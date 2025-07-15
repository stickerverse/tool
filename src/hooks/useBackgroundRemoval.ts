import { useState, useCallback, useRef, useEffect } from 'react';
import { backgroundRemovalService } from '../services/backgroundRemoval/BackgroundRemovalService';
import {
  BackgroundRemovalOptions,
  BackgroundRemovalResult,
  ProcessingProgress,
  BackgroundRemovalError,
} from '../services/backgroundRemoval/types';

interface UseBackgroundRemovalReturn {
  removeBackground: (file: File, options?: BackgroundRemovalOptions) => Promise<BackgroundRemovalResult | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: BackgroundRemovalError | null;
  result: BackgroundRemovalResult | null;
  reset: () => void;
}

export function useBackgroundRemoval(): UseBackgroundRemovalReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<BackgroundRemovalError | null>(null);
  const [result, setResult] = useState<BackgroundRemovalResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const removeBackground = useCallback(async (
    file: File,
    options: BackgroundRemovalOptions = { quality: 'medium' }
  ): Promise<BackgroundRemovalResult | null> => {
    // Reset state
    setError(null);
    setResult(null);
    setIsProcessing(true);
    
    // Create abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      const processedResult = await backgroundRemovalService.removeBackground(
        file,
        options,
        (progressUpdate) => {
          if (!abortControllerRef.current?.signal.aborted) {
            setProgress(progressUpdate);
          }
        }
      );
      
      if (!abortControllerRef.current?.signal.aborted) {
        setResult(processedResult);
        return processedResult;
      }
      
      return null;
    } catch (err: any) {
      if (!abortControllerRef.current?.signal.aborted) {
        const error = err.error || {
          type: 'PROCESSING_FAILED',
          message: err.message || 'Unknown error occurred',
        };
        setError(error as BackgroundRemovalError);
      }
      return null;
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsProcessing(false);
        setProgress(null);
      }
    }
  }, []);
  
  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsProcessing(false);
    setProgress(null);
    setError(null);
    setResult(null);
  }, []);
  
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);
  
  return {
    removeBackground,
    isProcessing,
    progress,
    error,
    result,
    reset,
  };
}
