import * as ort from 'onnxruntime-web';
import { 
  ProcessingOptions, 
  ProcessingResult, 
  ModelConfig,
  ProcessingProgress,
  ProcessingError
} from './types';

// Configure ONNX Runtime for web
ort.env.wasm.wasmPaths = '/';
ort.env.wasm.numThreads = 1;
ort.env.wasm.simd = true;

export class BackgroundRemovalService {
  private session: ort.InferenceSession | null = null;
  private isInitialized = false;
  private modelConfig: ModelConfig = {
    name: 'u2net',
    inputSize: 320, // U2Net expects 320x320 input
    mean: [0.485, 0.456, 0.406],
    std: [0.229, 0.224, 0.225],
  };

  async initialize(modelPath?: string): Promise<void> {
    if (this.isInitialized && this.session) return;

    console.log('Initializing ONNX Runtime...');
    
    // Try multiple model paths with fallback
    const modelPaths = modelPath ? [modelPath] : [
      '/models/u2net.onnx',
      '/models/u2net_small.onnx'
    ];

    let lastError: Error | null = null;

    for (const modelUrl of modelPaths) {
      try {
        console.log(`Attempting to load model from: ${modelUrl}`);

        // Create session with WebGL if available, fallback to WASM
        this.session = await ort.InferenceSession.create(modelUrl, {
          executionProviders: ['webgl', 'wasm'],
          graphOptimizationLevel: 'all',
          enableCpuMemArena: true,
          enableMemPattern: true,
          executionMode: 'sequential',
          logSeverityLevel: 0,
        });

        console.log('✅ Model loaded successfully from:', modelUrl);
        console.log('Input names:', this.session.inputNames);
        console.log('Output names:', this.session.outputNames);
        
        // Verify expected input shape
        const inputName = this.session.inputNames[0];
        const inputInfo = this.session.inputMetadata[inputName];
        console.log('Expected input shape:', inputInfo?.dims);
        
        // Update model config based on actual model requirements
        if (inputInfo?.dims && inputInfo.dims.length === 4) {
          const expectedSize = inputInfo.dims[2]; // Assuming NCHW format
          if (expectedSize && expectedSize !== this.modelConfig.inputSize) {
            console.log(`Updating input size from ${this.modelConfig.inputSize} to ${expectedSize}`);
            this.modelConfig.inputSize = expectedSize;
          }
        }
        
        this.isInitialized = true;
        return; // Success, exit the loop
      } catch (error) {
        console.warn(`Failed to load model from ${modelUrl}:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Clean up session if it was partially created
        if (this.session) {
          try {
            this.session.release();
          } catch (e) {
            console.warn('Error releasing failed session:', e);
          }
          this.session = null;
        }
      }
    }

    // If we get here, all model loading attempts failed
    console.error('All model loading attempts failed');
    throw new Error(`Failed to initialize any model. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  async removeBackground(
    file: File,
    options?: ProcessingOptions
  ): Promise<ProcessingResult> {
    const onProgress = options?.onProgress || (() => {});

    try {
      // Initialize if needed
      if (!this.isInitialized) {
        onProgress({ stage: 'Initializing AI model...', progress: 10 });
        await this.initialize();
      }

      if (!this.session) {
        throw new Error('Model session not initialized');
      }

      onProgress({ stage: 'Loading image...', progress: 20 });
      const imageData = await this.loadImage(file);
      
      onProgress({ stage: 'Preprocessing...', progress: 30 });
      const input = await this.preprocessImage(imageData);
      
      onProgress({ stage: 'Running AI inference...', progress: 50 });
      const output = await this.runInference(input);
      
      onProgress({ stage: 'Generating mask...', progress: 70 });
      const result = await this.postprocess(output, imageData, file);
      
      onProgress({ stage: 'Creating final image...', progress: 90 });
      const blob = await this.canvasToBlob(result.canvas);
      
      onProgress({ stage: 'Complete!', progress: 100 });

      return {
        blob,
        originalSize: file.size,
        processedSize: blob.size,
        processingTime: Date.now() - imageData.startTime,
      };
    } catch (error) {
      console.error('Background removal failed:', error);
      throw error instanceof Error ? error : new Error('Unknown error during processing');
    }
  }

  private async loadImage(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        const canvas = document.createElement('canvas');
        canvas.width = this.modelConfig.inputSize;
        canvas.height = this.modelConfig.inputSize;
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Fill with white background first (some models expect this)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calculate scaling to fit image in canvas while maintaining aspect ratio
        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        );
        
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (canvas.width - scaledWidth) / 2;
        const offsetY = (canvas.height - scaledHeight) / 2;
        
        // Draw scaled image centered
        ctx.drawImage(
          img, 
          offsetX, 
          offsetY, 
          scaledWidth, 
          scaledHeight
        );
        
        resolve({
          canvas,
          ctx,
          originalWidth: img.width,
          originalHeight: img.height,
          originalImage: img,
          scale,
          offsetX,
          offsetY,
          scaledWidth,
          scaledHeight,
          startTime: Date.now(),
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  private async preprocessImage(imageData: any): Promise<ort.Tensor> {
    const { ctx, canvas } = imageData;
    const imageDataRaw = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageDataRaw;
    
    // Create tensor in CHW format (Channels, Height, Width)
    const float32Data = new Float32Array(3 * width * height);
    
    // Convert RGBA to normalized RGB in CHW format
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Get RGB values and normalize to [0, 1]
        const r = data[idx] / 255;
        const g = data[idx + 1] / 255;
        const b = data[idx + 2] / 255;
        
        // Apply normalization and arrange in CHW format
        const pixelIndex = y * width + x;
        float32Data[0 * width * height + pixelIndex] = 
          (r - this.modelConfig.mean[0]) / this.modelConfig.std[0];
        float32Data[1 * width * height + pixelIndex] = 
          (g - this.modelConfig.mean[1]) / this.modelConfig.std[1];
        float32Data[2 * width * height + pixelIndex] = 
          (b - this.modelConfig.mean[2]) / this.modelConfig.std[2];
      }
    }
    
    return new ort.Tensor('float32', float32Data, [1, 3, height, width]);
  }

  private async runInference(input: ort.Tensor): Promise<ort.Tensor> {
    if (!this.session) {
      throw new Error('Model session not initialized');
    }

    const feeds: Record<string, ort.Tensor> = {};
    feeds[this.session.inputNames[0]] = input;
    
    console.log('Running inference with input shape:', input.dims);
    
    const results = await this.session.run(feeds);
    const outputTensor = results[this.session.outputNames[0]];
    
    console.log('Inference complete. Output shape:', outputTensor.dims);
    
    return outputTensor;
  }

  private async postprocess(
    output: ort.Tensor,
    imageData: any,
    originalFile: File
  ): Promise<{ canvas: HTMLCanvasElement }> {
    const { 
      originalWidth, 
      originalHeight, 
      originalImage,
      scale,
      offsetX,
      offsetY,
      scaledWidth,
      scaledHeight
    } = imageData;
    
    // Create result canvas at original size
    const canvas = document.createElement('canvas');
    canvas.width = originalWidth;
    canvas.height = originalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Get mask data
    const maskData = output.data as Float32Array;
    const [, , maskHeight, maskWidth] = output.dims;
    
    // Create mask canvas
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = maskWidth;
    maskCanvas.height = maskHeight;
    const maskCtx = maskCanvas.getContext('2d');
    
    if (!maskCtx) {
      throw new Error('Failed to get mask canvas context');
    }

    // Convert mask to image data
    const maskImageData = maskCtx.createImageData(maskWidth, maskHeight);
    
    // Process mask with threshold
    const threshold = 0.5;
    for (let i = 0; i < maskData.length; i++) {
      // Apply sigmoid if the output is logits
      let value = maskData[i];
      if (value < -10 || value > 10) {
        // Likely logits, apply sigmoid
        value = 1 / (1 + Math.exp(-value));
      }
      
      const alpha = value > threshold ? 255 : 0;
      const idx = i * 4;
      maskImageData.data[idx] = alpha;
      maskImageData.data[idx + 1] = alpha;
      maskImageData.data[idx + 2] = alpha;
      maskImageData.data[idx + 3] = 255;
    }
    
    maskCtx.putImageData(maskImageData, 0, 0);
    
    // Draw original image at full resolution
    ctx.drawImage(originalImage, 0, 0, originalWidth, originalHeight);
    
    // Create a temporary canvas for the scaled mask
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = originalWidth;
    tempCanvas.height = originalHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) {
      throw new Error('Failed to get temp canvas context');
    }
    
    // Draw the mask at the correct position and scale
    tempCtx.drawImage(
      maskCanvas,
      offsetX,
      offsetY,
      scaledWidth,
      scaledHeight,
      0,
      0,
      originalWidth,
      originalHeight
    );
    
    // Apply mask using composite operation
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(tempCanvas, 0, 0);
    
    return { canvas };
  }

  private async canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/png',
        1.0
      );
    });
  }

  dispose(): void {
    if (this.session) {
      this.session.release();
      this.session = null;
      this.isInitialized = false;
    }
  }
}