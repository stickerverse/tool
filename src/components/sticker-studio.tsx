
'use client';

import { useState } from 'react';
import { DesignCanvas } from './design-canvas';
import { PropertiesPanel } from './properties-panel';
import { Separator } from './ui/separator';

export type StickerState = {
  key: number;
  imageUrl: string | null;
  width: number;
  height: number;
  aspectRatio: number;
  proportionsLocked: boolean;
  isFlipped: boolean;
  borderWidth: number;
  borderColor: string;
};

const INITIAL_STATE: StickerState = {
  key: Date.now(),
  imageUrl: `https://placehold.co/400x400.png`,
  width: 400,
  height: 400,
  aspectRatio: 1,
  proportionsLocked: true,
  isFlipped: false,
  borderWidth: 4,
  borderColor: '#FFFFFF',
};

export default function StickerStudio() {
  const [sticker, setSticker] = useState<StickerState>(INITIAL_STATE);

  const handleImageUpdate = (newImageUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const newWidth = 400;
      const newHeight = newWidth / aspectRatio;
      setSticker(s => ({
        ...s,
        key: Date.now(),
        imageUrl: newImageUrl,
        width: newWidth,
        height: newHeight,
        aspectRatio,
      }));
    };
    img.src = newImageUrl;
  };

  const handleReset = () => {
    setSticker(s => ({
      ...INITIAL_STATE,
      key: Date.now(), // Ensure a re-render
      imageUrl: null, // Clear the image
    }));
  }

  const { key, ...designCanvasProps } = sticker;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background text-foreground overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative">
        <DesignCanvas key={key} {...designCanvasProps} />
      </div>
      <Separator orientation="vertical" className="hidden md:block bg-border/50" />
      <div className="w-full md:w-[360px] flex-shrink-0 bg-card border-l border-border/50">
        <PropertiesPanel sticker={sticker} setSticker={setSticker} onImageUpdate={handleImageUpdate} onReset={handleReset} />
      </div>
    </div>
  );
}
