export interface BackgroundRemovalOptions {
  quality: 'low' | 'medium' | 'high';
  model?: 'u2net' | 'mobilenet' | 'api';
  outputFormat?: 'png' | 'webp';
  maxDimension?: number;
  edgeFeathering?: number;
  confidenceThreshold?: number;
}

export interface ProcessingProgress {
  stage: 'loading' | 'preprocessing' | 'processing' | 'postprocessing' | 'complete';
  progress: number;
  message: string;
}

export interface BackgroundRemovalResult {
  blob: Blob;
  width: number;
  height: number;
  processingTime: number;
  method: string;
}

export type BackgroundRemovalError = 
  | { type: 'INVALID_IMAGE'; message: string }
  | { type: 'MODEL_LOAD_FAILED'; message: string }
  | { type: 'PROCESSING_FAILED'; message: string }
  | { type: 'API_ERROR'; message: string; statusCode?: number }
  | { type: 'SIZE_LIMIT_EXCEEDED'; message: string };
