import { useState, useCallback } from 'react';
import { BackgroundRemovalService } from '@/services/backgroundRemoval/BackgroundRemovalService';
import type { ProcessingOptions, ProcessingResult, ProcessingProgress, ProcessingError } from '@/services/backgroundRemoval/types';

export function useBackgroundRemoval() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<ProcessingError | null>(null);
  const [service] = useState(() => new BackgroundRemovalService());

  const removeBackground = useCallback(async (
    file: File,
    options?: ProcessingOptions
  ): Promise<ProcessingResult | null> => {
    setIsProcessing(true);
    setError(null);
    setProgress(null);

    try {
      const result = await service.removeBackground(file, {
        ...options,
        onProgress: (prog) => setProgress(prog),
      });
      
      return result;
    } catch (err) {
      const error: ProcessingError = {
        code: 'PROCESSING_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error occurred',
      };
      setError(error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [service]);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(null);
    setError(null);
  }, []);

  return {
    removeBackground,
    isProcessing,
    progress,
    error,
    reset,
  };
}