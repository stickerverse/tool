export const BG_REMOVAL_CONFIG = {
  // Model URLs (host these on your CDN)
  models: {
    u2net: '/models/u2net_quant.onnx',
    mobilenet: '/models/mobilenet_quant.onnx',
  },
  
  // Processing limits
  maxImageSize: 4096,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  
  // Quality presets
  qualityPresets: {
    low: {
      maxDimension: 512,
      modelType: 'mobilenet',
      confidenceThreshold: 0.5,
    },
    medium: {
      maxDimension: 1024,
      modelType: 'u2net',
      confidenceThreshold: 0.6,
    },
    high: {
      maxDimension: 2048,
      modelType: 'u2net',
      confidenceThreshold: 0.7,
    },
  },
  
  // API configuration (if using Remove.bg)
  api: {
    endpoint: process.env.NEXT_PUBLIC_REMOVEBG_ENDPOINT || 'https://api.remove.bg/v1.0/removebg',
    // API key should be stored securely, preferably server-side
  },
} as const;
