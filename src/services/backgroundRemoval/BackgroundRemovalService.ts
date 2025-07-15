import { ONNXProcessor } from './processors/ONNXProcessor';
import {
  BackgroundRemovalOptions,
  BackgroundRemovalResult,
  ProcessingProgress,
} from './types';
import { BG_REMOVAL_CONFIG } from './config';
import {
  BackgroundRemovalException,
  loadImageFromBlob,
  resizeImage,
  applyFeathering,
  canvasToBlob,
} from './utils';

export class BackgroundRemovalService {
  private onnxProcessor: ONNXProcessor | null = null;
  private initialized = false;
  
  async removeBackground(
    imageFile: File | Blob,
    options: BackgroundRemovalOptions = { quality: 'medium' },
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<BackgroundRemovalResult> {
    const startTime = performance.now();
    
    // Validate file size
    if (imageFile.size > BG_REMOVAL_CONFIG.maxFileSize) {
      throw new BackgroundRemovalException({
        type: 'SIZE_LIMIT_EXCEEDED',
        message: `File size exceeds ${BG_REMOVAL_CONFIG.maxFileSize / 1024 / 1024}MB limit`,
      });
    }
    
    try {
      // Load and validate image
      const img = await loadImageFromBlob(imageFile);
      
      // Get quality preset
      const preset = BG_REMOVAL_CONFIG.qualityPresets[options.quality];
      const maxDimension = options.maxDimension || preset.maxDimension;
      
      // Resize if needed
      const canvas = resizeImage(img, maxDimension);
      const ctx = canvas.getContext('2d')!;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Initialize processor if needed
      if (!this.initialized || options.model !== this.onnxProcessor?.modelType) {
        await this.initializeProcessor(
          options.model || preset.modelType,
          onProgress
        );
      }
      
      // Process image
      const mask = await this.onnxProcessor!.processImage(
        imageData,
        { ...options, confidenceThreshold: preset.confidenceThreshold },
        onProgress
      );
      
      // Apply mask with feathering
      const featherRadius = options.edgeFeathering || 2;
      const processedImageData = applyFeathering(imageData, mask, featherRadius);
      
      // Convert to blob
      ctx.putImageData(processedImageData, 0, 0);
      const blob = await canvasToBlob(canvas, options.outputFormat || 'png');
      
      const processingTime = performance.now() - startTime;
      
      return {
        blob,
        width: canvas.width,
        height: canvas.height,
        processingTime,
        method: 'onnx',
      };
    } catch (error) {
      if (error instanceof BackgroundRemovalException) {
        throw error;
      }
      
      throw new BackgroundRemovalException({
        type: 'PROCESSING_FAILED',
        message: `Background removal failed: ${error}`,
      });
    }
  }
  
  private async initializeProcessor(
    modelType: 'u2net' | 'mobilenet',
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<void> {
    if (this.onnxProcessor) {
      this.onnxProcessor.dispose();
    }
    
    this.onnxProcessor = new ONNXProcessor();
    await this.onnxProcessor.initialize(modelType, onProgress);
    this.initialized = true;
  }
  
  dispose(): void {
    this.onnxProcessor?.dispose();
    this.onnxProcessor = null;
    this.initialized = false;
  }
}

// Singleton instance
export const backgroundRemovalService = new BackgroundRemovalService();
