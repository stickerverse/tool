import type { 
  ProcessingOptions, 
  ProcessingResult, 
  ProcessingProgress 
} from './types';

// Dynamic import with CDN fallback
const loadONNXRuntime = async () => {
  try {
    // Try local import first
    const ort = await import('onnxruntime-web');
    return ort;
  } catch (error) {
    console.warn('Failed to load local ONNX Runtime, loading from CDN...');
    // Load from CDN as fallback
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.3/dist/ort.min.js';
    document.head.appendChild(script);
    
    return new Promise((resolve, reject) => {
      script.onload = () => {
        if ((window as any).ort) {
          resolve((window as any).ort);
        } else {
          reject(new Error('ONNX Runtime not found on window'));
        }
      };
      script.onerror = reject;
    });
  }
};

export class BackgroundRemovalServiceCDN {
  private session: any = null;
  private isInitialized = false;
  private ort: any = null;
  
  private modelConfig = {
    inputSize: 320,
    mean: [0.485, 0.456, 0.406],
    std: [0.229, 0.224, 0.225],
  };

  async initialize(modelUrl?: string): Promise<void> {
    if (this.isInitialized && this.session) return;

    try {
      // Load ONNX Runtime
      this.ort = await loadONNXRuntime();
      
      // Configure ONNX Runtime
      this.ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.3/dist/';
      
      const finalModelUrl = modelUrl || '/models/u2net.onnx';
      console.log(`Loading model from: ${finalModelUrl}`);

      // Create session
      this.session = await this.ort.InferenceSession.create(finalModelUrl, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });

      console.log('✅ Model loaded successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('Model initialization failed:', error);
      throw new Error(`Failed to initialize model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removeBackground(
    file: File,
    options?: ProcessingOptions
  ): Promise<ProcessingResult> {
    const onProgress = options?.onProgress || (() => {});
    const startTime = Date.now();

    try {
      // Initialize if needed
      if (!this.isInitialized) {
        onProgress({ stage: 'Loading AI model...', progress: 10 });
        await this.initialize();
      }

      onProgress({ stage: 'Processing image...', progress: 20 });
      
      // Load and preprocess image
      const { canvas, originalWidth, originalHeight } = await this.loadImage(file);
      const inputTensor = await this.preprocessImage(canvas);
      
      onProgress({ stage: 'Running AI inference...', progress: 50 });
      
      // Run inference
      const outputTensor = await this.runInference(inputTensor);
      
      onProgress({ stage: 'Applying mask...', progress: 70 });
      
      // Apply mask and create result
      const resultCanvas = await this.applyMask(
        canvas, 
        outputTensor, 
        originalWidth, 
        originalHeight,
        file
      );
      
      onProgress({ stage: 'Creating final image...', progress: 90 });
      
      // Convert to blob
      const blob = await this.canvasToBlob(resultCanvas);
      
      onProgress({ stage: 'Complete!', progress: 100 });

      return {
        blob,
        originalSize: file.size,
        processedSize: blob.size,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Background removal failed:', error);
      throw error instanceof Error ? error : new Error('Processing failed');
    }
  }

  private async loadImage(file: File): Promise<{
    canvas: HTMLCanvasElement;
    originalWidth: number;
    originalHeight: number;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        const canvas = document.createElement('canvas');
        canvas.width = this.modelConfig.inputSize;
        canvas.height = this.modelConfig.inputSize;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        resolve({
          canvas,
          originalWidth: img.width,
          originalHeight: img.height,
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  private async preprocessImage(canvas: HTMLCanvasElement): Promise<any> {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;
    
    // Create float32 array in CHW format
    const float32Data = new Float32Array(3 * width * height);
    
    for (let c = 0; c < 3; c++) {
      for (let h = 0; h < height; h++) {
        for (let w = 0; w < width; w++) {
          const idx = (h * width + w) * 4;
          const value = data[idx + c] / 255.0;
          const normalized = (value - this.modelConfig.mean[c]) / this.modelConfig.std[c];
          float32Data[c * width * height + h * width + w] = normalized;
        }
      }
    }
    
    return new this.ort.Tensor('float32', float32Data, [1, 3, height, width]);
  }

  private async runInference(inputTensor: any): Promise<any> {
    if (!this.session) throw new Error('Model session not initialized');
    
    const feeds: Record<string, any> = {};
    feeds[this.session.inputNames[0]] = inputTensor;
    
    const results = await this.session.run(feeds);
    return results[this.session.outputNames[0]];
  }

  private async applyMask(
    modelCanvas: HTMLCanvasElement,
    maskTensor: any,
    originalWidth: number,
    originalHeight: number,
    originalFile: File
  ): Promise<HTMLCanvasElement> {
    // Create result canvas at original size
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = originalWidth;
    resultCanvas.height = originalHeight;
    const ctx = resultCanvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    
    // Load original image at full resolution
    const img = new Image();
    const url = URL.createObjectURL(originalFile);
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    
    URL.revokeObjectURL(url);
    
    // Draw original image
    ctx.drawImage(img, 0, 0, originalWidth, originalHeight);
    
    // Process mask
    const maskData = maskTensor.data;
    const [, , maskHeight, maskWidth] = maskTensor.dims;
    
    // Create mask canvas
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = maskWidth;
    maskCanvas.height = maskHeight;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) throw new Error('Failed to get mask context');
    
    const maskImageData = maskCtx.createImageData(maskWidth, maskHeight);
    
    // Apply threshold and convert to image data
    for (let i = 0; i < maskData.length; i++) {
      const value = Math.round(Math.max(0, Math.min(1, maskData[i])) * 255);
      const idx = i * 4;
      maskImageData.data[idx] = value;
      maskImageData.data[idx + 1] = value;
      maskImageData.data[idx + 2] = value;
      maskImageData.data[idx + 3] = 255;
    }
    
    maskCtx.putImageData(maskImageData, 0, 0);
    
    // Apply mask using composite operation
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(maskCanvas, 0, 0, originalWidth, originalHeight);
    
    return resultCanvas;
  }

  private async canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
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
      this.ort = null;
    }
  }
}