'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wand2, Loader2 } from 'lucide-react';
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval';

interface BackgroundRemoverEnhancedProps {
  imageUrl: string;
  onComplete?: (processedUrl: string) => void;
}

export function BackgroundRemoverEnhanced({ imageUrl, onComplete }: BackgroundRemoverEnhancedProps) {
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const {
    removeBackground,
    isProcessing,
    progress,
    error,
  } = useBackgroundRemoval();

  const handleRemoveBackground = useCallback(async () => {
    try {
      setStatusMessage('');
      
      // Convert image URL to File object
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'image.png', { type: blob.type });

      const result = await removeBackground(file, { 
        model: 'u2net',
        quality: 'high' 
      });
      
      if (result) {
        const url = URL.createObjectURL(result.blob);
        setProcessedUrl(url);
        onComplete?.(url);
        setStatusMessage('Background removed successfully! ✨');
      }
    } catch (err) {
      setStatusMessage('Failed to remove background');
      console.error('Background removal error:', err);
    }
  }, [imageUrl, removeBackground, onComplete]);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-2">Original</p>
            <div className="border rounded overflow-hidden bg-muted">
              <img
                src={imageUrl}
                alt="Original"
                className="w-full h-32 object-contain"
              />
            </div>
          </div>
          
          {processedUrl && (
            <div>
              <p className="text-sm font-medium mb-2">AI Processed</p>
              <div className="border rounded overflow-hidden bg-checkerboard">
                <img
                  src={processedUrl}
                  alt="Processed"
                  className="w-full h-32 object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {isProcessing && progress && (
          <div className="text-center">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all" 
                style={{ width: `${progress.progress}%` }} 
              />
            </div>
            <p className="text-xs text-gray-600">{progress.stage}</p>
          </div>
        )}

        {(error || statusMessage) && (
          <p className={`text-sm text-center ${error ? 'text-destructive' : 'text-green-600'}`}>
            {error ? error.message : statusMessage}
          </p>
        )}

        <Button
          onClick={handleRemoveBackground}
          disabled={isProcessing || !!processedUrl}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : processedUrl ? (
            'Background Removed ✓'
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Remove Background with AI
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}