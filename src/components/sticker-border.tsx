
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { addBorder } from '@/app/actions';
import { Loader2, Palette } from 'lucide-react';
import type { Layer } from './sticker-studio';


interface StickerBorderProps {
    layer: Layer;
    onImageUpdate: (newImageUrl: string) => void;
}

export function StickerBorder({ layer, onImageUpdate }: StickerBorderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [borderColor, setBorderColor] = useState('#FFFFFF');
  const [borderWidth, setBorderWidth] = useState<number | string>(8);
  const { toast } = useToast();

  const handleAddBorder = async () => {
    if (layer.type !== 'image' || !layer.imageUrl) {
        toast({
            variant: "destructive",
            title: "Invalid Layer",
            description: "Please select an image layer to add a border.",
        });
        return;
    }

    setIsProcessing(true);
    toast({ title: "AI is at work...", description: "Adding a sticker border." });
    
    const result = await addBorder({ 
        photoDataUri: layer.imageUrl,
        borderColor,
        borderWidth: Number(borderWidth),
    });
    
    setIsProcessing(false);

    if ('error' in result) {
      toast({
        variant: "destructive",
        title: "Failed to Add Border",
        description: result.error,
      });
    } else {
      onImageUpdate(result.borderedImageDataUri);
      toast({
        title: "Success!",
        description: "Sticker border has been added.",
      });
    }
  };
  
  const handleBorderWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
        setBorderWidth('');
    } else {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
            setBorderWidth(numValue);
        }
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Border</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Color</h3>
            <Input
              id="border-color"
              type="color"
              value={borderColor}
              onChange={(e) => setBorderColor(e.target.value)}
              className="p-1 h-10 w-full bg-zinc-800 border-zinc-700"
            />
        </div>
        <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Size</h3>
            <Input
              id="border-width"
              type="number"
              value={borderWidth}
              onChange={handleBorderWidthChange}
              min="1"
              max="20"
              className="h-10 w-full bg-zinc-800 border-zinc-700"
            />
        </div>
      </div>
      <Button 
        onClick={handleAddBorder} 
        disabled={isProcessing} 
        className="w-full h-12 bg-accent hover:bg-accent/90 text-lg"
      >
        {isProcessing ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Palette className="mr-2 h-5 w-5" />
        )}
        Apply Border
      </Button>
    </div>
  );
}
