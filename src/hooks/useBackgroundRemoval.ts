import { useState, useCallback, useRef } from 'react';
import { BackgroundRemovalService } from '@/services/backgroundRemoval/BackgroundRemovalService';
import { BackgroundRemovalServiceCDN } from '@/services/backgroundRemoval/BackgroundRemovalServiceCDN';
import type { ProcessingOptions, ProcessingResult, ProcessingProgress, ProcessingError } from '@/services/backgroundRemoval/types';

export function useBackgroundRemoval() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<ProcessingError | null>(null);
  const serviceRef = useRef<BackgroundRemovalService | BackgroundRemovalServiceCDN | null>(null);

  const getService = useCallback(async () => {
    if (serviceRef.current) return serviceRef.current;
    
    try {
      // Try local service first
      const service = new BackgroundRemovalService();
      await service.initialize();
      serviceRef.current = service;
      return service;
    } catch (error) {
      console.warn('Failed to initialize local service, using CDN fallback:', error);
      // Fallback to CDN version
      const cdnService = new BackgroundRemovalServiceCDN();
      serviceRef.current = cdnService;
      return cdnService;
    }
  }, []);

  const removeBackground = useCallback(async (
    file: File,
    options?: ProcessingOptions
  ): Promise<ProcessingResult | null> => {
    setIsProcessing(true);
    setError(null);
    setProgress(null);

    try {
      const service = await getService();
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
  }, [getService]);

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