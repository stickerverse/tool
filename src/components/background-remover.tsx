'use client';

import { Button } from '@/components/ui/button';
import { Wand2, Loader2 } from 'lucide-react';
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface BackgroundRemoverProps {
  stickerImage: string;
  onImageUpdate: (newUrl: string) => void;
}

export function BackgroundRemover({ stickerImage, onImageUpdate }: BackgroundRemoverProps) {
  const [isProcessingLocal, setIsProcessingLocal] = useState(false);
  const { removeBackground, isProcessing, progress } = useBackgroundRemoval();

  const handleRemoveBackground = useCallback(async () => {
    try {
      setIsProcessingLocal(true);
      
      // Convert image URL to File
      const response = await fetch(stickerImage);
      const blob = await response.blob();
      const file = new File([blob], 'image.png', { type: blob.type });

      // Use AI-powered background removal
      const result = await removeBackground(file, {
        model: 'u2net',
        quality: 'high'
      });

      if (result) {
        const processedUrl = URL.createObjectURL(result.blob);
        onImageUpdate(processedUrl);
        toast.success('Background removed with AI! ✨');
      }
    } catch (error) {
      console.error('Background removal error:', error);
      toast.error('Failed to remove background');
    } finally {
      setIsProcessingLocal(false);
    }
  }, [stickerImage, removeBackground, onImageUpdate]);

  const processing = isProcessing || isProcessingLocal;

  return (
    <Button
      variant="outline"
      className="w-full justify-center h-10 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
      onClick={handleRemoveBackground}
      disabled={processing}
    >
      {processing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {progress ? `${Math.round(progress.progress)}%` : 'Processing...'}
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-4 w-4" />
          Remove BG
        </>
      )}
    </Button>
  );
}