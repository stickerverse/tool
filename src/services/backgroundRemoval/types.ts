export interface ProcessingOptions {
  model?: 'u2net' | 'u2net_quant' | 'isnet';
  quality?: 'low' | 'medium' | 'high';
  format?: 'png' | 'webp';
  onProgress?: (progress: ProcessingProgress) => void;
}

export interface ProcessingProgress {
  stage: string;
  progress: number;
}

export interface ProcessingResult {
  blob: Blob;
  originalSize: number;
  processedSize: number;
  processingTime: number;
}

export interface ProcessingError {
  code: string;
  message: string;
}

export interface ModelConfig {
  name: string;
  url?: string;
  inputSize: number;
  mean: number[];
  std: number[];
}