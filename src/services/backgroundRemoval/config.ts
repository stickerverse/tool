export interface ModelConfig {
  name: string;
  url?: string;
  inputSize: number;
  mean: number[];
  std: number[];
}

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  u2net: {
    name: 'u2net',
    inputSize: 1024,
    mean: [0.485, 0.456, 0.406],
    std: [0.229, 0.224, 0.225],
  },
  u2net_small: {
    name: 'u2net_small',
    inputSize: 320,
    mean: [0.485, 0.456, 0.406],
    std: [0.229, 0.224, 0.225],
  },
  briaai_rmbg: {
    name: 'briaai_rmbg',
    inputSize: 1024,
    mean: [0.5, 0.5, 0.5],
    std: [1.0, 1.0, 1.0],
  },
  isnet: {
    name: 'isnet',
    inputSize: 1024,
    mean: [0.5, 0.5, 0.5],
    std: [0.5, 0.5, 0.5],
  }
};

export const DEFAULT_MODEL = 'u2net';

// Background removal configuration
export const BG_REMOVAL_CONFIG = {
  models: {
    u2net: '/models/u2net.onnx',
    mobilenet: '/models/mobilenet.onnx'
  },
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFormats: ['image/jpeg', 'image/png', 'image/webp']
};