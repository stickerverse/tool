
'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import { removeImageBackground } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, Wand2, Loader2 } from 'lucide-react';

interface BackgroundRemoverProps {
  onImageUpdate: (newImageUrl: string) => void;
  stickerImage: string | null;
}

export function BackgroundRemover({ onImageUpdate, stickerImage }: BackgroundRemoverProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({
            variant: "destructive",
            title: "Invalid File Type",
            description: "Please upload an image file.",
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      onImageUpdate(dataUri);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = async () => {
    if (!stickerImage) {
        toast({
            variant: "destructive",
            title: "No Image",
            description: "Please upload an image first.",
        });
        return;
    }
    
    setIsProcessing(true);
    toast({ title: "AI is at work...", description: "Removing background from your image." });
    
    const result = await removeImageBackground({ photoDataUri: stickerImage });

    setIsProcessing(false);

    if ('error' in result) {
      toast({
        variant: "destructive",
        title: "Background Removal Failed",
        description: result.error,
      });
    } else {
      onImageUpdate(result.removedBackgroundDataUri);
      toast({
        title: "Success!",
        description: "Background has been removed.",
      });
    }
  };

  return (
    <div className="space-y-3">
      <Input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
          <Upload className="mr-2 h-4 w-4" /> Upload
        </Button>
        <Button onClick={handleRemoveBackground} disabled={isProcessing || !stickerImage} className="w-full">
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Erase BG
        </Button>
      </div>
    </div>
  );
}
