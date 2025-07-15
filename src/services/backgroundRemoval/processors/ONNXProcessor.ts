import * as ort from 'onnxruntime-web';
import { 
  BackgroundRemovalOptions, 
  ProcessingProgress,
  BackgroundRemovalError 
} from '../types';
import { BG_REMOVAL_CONFIG } from '../config';
import { BackgroundRemovalException, applyFeathering } from '../utils';

export class ONNXProcessor {
  private session: ort.InferenceSession | null = null;
  private modelType: 'u2net' | 'mobilenet' = 'u2net';
  
  async initialize(
    modelType: 'u2net' | 'mobilenet',
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<void> {
    try {
      onProgress?.({
        stage: 'loading',
        progress: 0,
        message: 'Loading AI model...',
      });
      
      this.modelType = modelType;
      const modelPath = BG_REMOVAL_CONFIG.models[modelType];
      
      // Configure ONNX Runtime for better compatibility
      if (typeof window !== 'undefined') {
        ort.env.wasm.wasmPaths = `${window.location.origin}/`;
        ort.env.wasm.numThreads = Math.min(navigator.hardwareConcurrency || 1, 4);
        ort.env.wasm.simd = true;
        ort.env.wasm.proxy = false; // Disable proxy to avoid dynamic import issues
        ort.env.debug = false;
        ort.env.logLevel = 'warning';
      }
      
      this.session = await ort.InferenceSession.create(modelPath, {
        executionProviders: ['wasm'], // Use only WASM for maximum compatibility
        graphOptimizationLevel: 'basic',
        enableCpuMemArena: false,
        enableMemPattern: false,
        executionMode: 'sequential',
        logSeverityLevel: 2,
        extra: {
          session: {
            'use_device_allocator_for_initializers': '0',
            'enable_profiling': '0'
          }
        }
      });
      
      onProgress?.({
        stage: 'loading',
        progress: 100,
        message: 'Model loaded successfully',
      });
    } catch (error) {
      throw new BackgroundRemovalException({
        type: 'MODEL_LOAD_FAILED',
        message: `Failed to load ${modelType} model: ${error}`,
      });
    }
  }
  
  async processImage(
    imageData: ImageData,
    options: BackgroundRemovalOptions,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<Uint8Array> {
    if (!this.session) {
      throw new Error('Model not initialized');
    }
    
    onProgress?.({
      stage: 'preprocessing',
      progress: 0,
      message: 'Preparing image...',
    });
    
    // Preprocess image for model input
    const inputTensor = this.preprocessImage(imageData);
    
    onProgress?.({
      stage: 'processing',
      progress: 30,
      message: 'Running AI segmentation...',
    });
    
    // Run inference
    const feeds = { [this.session.inputNames[0]]: inputTensor };
    const results = await this.session.run(feeds);
    
    onProgress?.({
      stage: 'postprocessing',
      progress: 70,
      message: 'Refining mask...',
    });
    
    // Post-process the output
    const mask = this.postprocessOutput(
      results[this.session.outputNames[0]],
      imageData.width,
      imageData.height,
      options.confidenceThreshold || 0.5
    );
    
    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Background removed successfully',
    });
    
    return mask;
  }
  
  private preprocessImage(imageData: ImageData): ort.Tensor {
    const { width, height, data } = imageData;
    const inputSize = this.modelType === 'u2net' ? 320 : 224;
    
    // Create canvas for resizing
    const canvas = document.createElement('canvas');
    canvas.width = inputSize;
    canvas.height = inputSize;
    const ctx = canvas.getContext('2d')!;
    
    // Draw and resize image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(imageData, 0, 0);
    
    ctx.drawImage(tempCanvas, 0, 0, inputSize, inputSize);
    const resizedData = ctx.getImageData(0, 0, inputSize, inputSize);
    
    // Convert to tensor format
    const rgb = new Float32Array(inputSize * inputSize * 3);
    for (let i = 0; i < inputSize * inputSize; i++) {
      rgb[i * 3] = (resizedData.data[i * 4] / 255 - 0.485) / 0.229;
      rgb[i * 3 + 1] = (resizedData.data[i * 4 + 1] / 255 - 0.456) / 0.224;
      rgb[i * 3 + 2] = (resizedData.data[i * 4 + 2] / 255 - 0.406) / 0.225;
    }
    
    return new ort.Tensor('float32', rgb, [1, 3, inputSize, inputSize]);
  }
  
  private postprocessOutput(
    output: ort.Tensor,
    originalWidth: number,
    originalHeight: number,
    threshold: number
  ): Uint8Array {
    const outputData = output.data as Float32Array;
    const outputSize = Math.sqrt(outputData.length);
    
    // Create canvas for resizing mask back to original size
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d')!;
    
    // Convert tensor to image data
    const imageData = ctx.createImageData(outputSize, outputSize);
    for (let i = 0; i < outputData.length; i++) {
      const value = outputData[i] > threshold ? 255 : 0;
      imageData.data[i * 4] = value;
      imageData.data[i * 4 + 1] = value;
      imageData.data[i * 4 + 2] = value;
      imageData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    
    // Resize back to original dimensions
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = originalWidth;
    finalCanvas.height = originalHeight;
    const finalCtx = finalCanvas.getContext('2d')!;
    finalCtx.drawImage(canvas, 0, 0, originalWidth, originalHeight);
    
    // Extract alpha channel
    const finalData = finalCtx.getImageData(0, 0, originalWidth, originalHeight);
    const mask = new Uint8Array(originalWidth * originalHeight);
    for (let i = 0; i < mask.length; i++) {
      mask[i] = finalData.data[i * 4];
    }
    
    return mask;
  }
  
  dispose(): void {
    this.session?.release();
    this.session = null;
  }
}
