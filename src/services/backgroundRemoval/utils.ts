import { BackgroundRemovalError } from './types';

export class BackgroundRemovalException extends Error {
  constructor(public error: BackgroundRemovalError) {
    super(error.message);
    this.name = 'BackgroundRemovalException';
  }
}

export async function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new BackgroundRemovalException({
        type: 'INVALID_IMAGE',
        message: 'Failed to load image',
      }));
    };
    
    img.src = url;
  });
}

export function resizeImage(
  img: HTMLImageElement,
  maxDimension: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  let { width, height } = img;
  
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width *= scale;
    height *= scale;
  }
  
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
  
  return canvas;
}

export function applyFeathering(
  imageData: ImageData,
  mask: Uint8Array,
  featherRadius: number
): ImageData {
  const { width, height } = imageData;
  const result = new ImageData(width, height);
  const pixels = result.data;
  const original = imageData.data;
  
  // Simple box blur for feathering
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let alpha = 0;
      let count = 0;
      
      // Sample surrounding pixels
      for (let dy = -featherRadius; dy <= featherRadius; dy++) {
        for (let dx = -featherRadius; dx <= featherRadius; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            alpha += mask[ny * width + nx];
            count++;
          }
        }
      }
      
      alpha = alpha / count / 255;
      
      pixels[idx] = original[idx];
      pixels[idx + 1] = original[idx + 1];
      pixels[idx + 2] = original[idx + 2];
      pixels[idx + 3] = original[idx + 3] * alpha;
    }
  }
  
  return result;
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'png' | 'webp' = 'png',
  quality = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      `image/${format}`,
      quality
    );
  });
}
