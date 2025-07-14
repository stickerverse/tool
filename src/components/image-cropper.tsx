
'use client';

import { useState } from 'react';
import { cropImageToShape } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star, Circle, Heart, Square } from 'lucide-react';
import type { CropImageInput } from '@/ai/flows/crop-image';

interface ImageCropperProps {
  onImageUpdate: (newImageUrl: string) => void;
  stickerImage: string | null;
}

type Shape = CropImageInput['shape'];

function ButtonGroup({ children }: { children: React.ReactNode }) {
    return <div className="flex items-center space-x-px rounded-md bg-zinc-800 border border-zinc-700 overflow-hidden">{children}</div>
}

function ButtonGroupButton({ children, onClick, disabled }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean }) {
    return <Button variant="ghost" size="sm" onClick={onClick} disabled={disabled} className="h-10 flex-1 rounded-none px-4 hover:bg-zinc-700">{children}</Button>
}

export function ImageCropper({ onImageUpdate, stickerImage }: ImageCropperProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingShape, setProcessingShape] = useState<Shape | null>(null);
  const { toast } = useToast();

  const handleCrop = async (shape: Shape) => {
    if (!stickerImage) {
        toast({
            variant: "destructive",
            title: "No Image",
            description: "Please upload an image first.",
        });
        return;
    }
    
    setIsProcessing(true);
    setProcessingShape(shape);
    toast({ title: "AI is at work...", description: `Cropping your image into a ${shape}.` });
    
    const result = await cropImageToShape({ photoDataUri: stickerImage, shape });

    setIsProcessing(false);
    setProcessingShape(null);

    if ('error' in result) {
      toast({
        variant: "destructive",
        title: "Image Cropping Failed",
        description: result.error,
      });
    } else {
      onImageUpdate(result.croppedImageDataUri);
      toast({
        title: "Success!",
        description: "Image has been cropped.",
      });
    }
  };
  
  const renderIcon = (shape: Shape, IconComponent: React.ElementType) => {
    if(isProcessing && processingShape === shape) {
        return <Loader2 className="h-4 w-4 animate-spin" />
    }
    return <IconComponent className="h-4 w-4" />
  }

  return (
    <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Crop Image</h3>
        <ButtonGroup>
            <ButtonGroupButton onClick={() => handleCrop('star')} disabled={isProcessing}>
                {renderIcon('star', Star)}
            </ButtonGroupButton>
            <ButtonGroupButton onClick={() => handleCrop('circle')} disabled={isProcessing}>
                {renderIcon('circle', Circle)}
            </ButtonGroupButton>
            <ButtonGroupButton onClick={() => handleCrop('heart')} disabled={isProcessing}>
                {renderIcon('heart', Heart)}
            </ButtonGroupButton>
            <ButtonGroupButton onClick={() => handleCrop('square')} disabled={isProcessing}>
                {renderIcon('square', Square)}
            </ButtonGroupButton>
        </ButtonGroup>
    </div>
  );
}
