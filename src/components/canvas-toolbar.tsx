'use client';

import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Wand2, Loader2 } from 'lucide-react';
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval';
import type { Layer } from './sticker-studio';

interface CanvasToolbarProps {
  selectedLayer: Layer | null;
  onLayerUpdate: (id: string, updates: Partial<Layer>, description: string) => void;
}

export function CanvasToolbar({ selectedLayer, onLayerUpdate }: CanvasToolbarProps) {
  const [statusMessage, setStatusMessage] = useState<string>('');
  const {
    removeBackground,
    isProcessing,
    progress,
    error,
  } = useBackgroundRemoval();

  const handleRemoveBackground = useCallback(async () => {
    if (!selectedLayer || selectedLayer.type !== 'image' || !selectedLayer.imageUrl) {
      return;
    }

    try {
      setStatusMessage('');
      
      // Convert image URL to File object
      const response = await fetch(selectedLayer.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'image.png', { type: blob.type });

      const result = await removeBackground(file, { 
        model: 'u2net',
        quality: 'high' 
      });
      
      if (result) {
        const url = URL.createObjectURL(result.blob);
        onLayerUpdate(selectedLayer.id, { imageUrl: url }, 'Remove Background (AI)');
        setStatusMessage('Background removed successfully! ✨');
        
        // Clear status message after a few seconds
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      setStatusMessage('Failed to remove background');
      console.error('Background removal error:', err);
    }
  }, [selectedLayer, removeBackground, onLayerUpdate]);

  // Only show toolbar for image layers
  if (!selectedLayer || selectedLayer.type !== 'image' || !selectedLayer.imageUrl) {
    return null;
  }

  return (
    <Card className="absolute top-4 left-4 z-10 p-3 bg-background/95 backdrop-blur-sm border shadow-lg">
      <div className="flex items-center gap-3">
        <Button
          onClick={handleRemoveBackground}
          disabled={isProcessing}
          size="sm"
          className="gap-2"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          {isProcessing ? 'Removing...' : 'Remove Background'}
        </Button>

        {isProcessing && progress && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-16 bg-muted rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all" 
                style={{ width: `${progress.progress}%` }} 
              />
            </div>
            <span>{progress.stage}</span>
          </div>
        )}

        {(error || statusMessage) && (
          <span className={`text-xs ${error ? 'text-destructive' : 'text-green-600'}`}>
            {error ? error.message : statusMessage}
          </span>
        )}
      </div>
    </Card>
  );
}