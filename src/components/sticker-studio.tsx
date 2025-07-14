
'use client';

import { useState } from 'react';
import { DesignCanvas } from './design-canvas';
import { PropertiesPanel } from './properties-panel';
import { Separator } from './ui/separator';
import { AddNewPanel } from './add-new-panel';
import { AddTextPanel } from './add-text-panel';
import { AddCodePanel } from './add-code-panel';
import { AddClipartPanel } from './add-clipart-panel';


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

export type EditorView = 'add' | 'edit' | 'add-text' | 'add-code' | 'add-clipart';

export default function StickerStudio() {
  const [sticker, setSticker] = useState<StickerState>(INITIAL_STATE);
  const [view, setView] = useState<EditorView>('edit');

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
      setView('edit');
    };
    img.src = newImageUrl;
  };

  const handleReset = () => {
    setSticker(s => ({
      ...INITIAL_STATE,
      key: Date.now(),
      imageUrl: null, 
    }));
    setView('add');
  }

  const navigateTo = (newView: EditorView) => {
    setView(newView);
  }

  const renderPanel = () => {
    switch (view) {
        case 'edit':
            return (
                <PropertiesPanel 
                    sticker={sticker} 
                    setSticker={setSticker} 
                    onImageUpdate={handleImageUpdate} 
                    onReset={handleReset}
                    onNavigateBack={() => navigateTo('add')}
                />
            );
        case 'add':
            return (
                <AddNewPanel onImageUpdate={handleImageUpdate} onNavigate={navigateTo} />
            );
        case 'add-text':
            return (
                <AddTextPanel 
                    onNavigateBack={() => navigateTo('add')}
                    onTextAdd={handleImageUpdate}
                />
            );
        case 'add-code':
            return (
                <AddCodePanel
                    onNavigateBack={() => navigateTo('add')}
                    onCodeAdd={handleImageUpdate}
                />
            );
        case 'add-clipart':
            return (
                <AddClipartPanel
                    onNavigateBack={() => navigateTo('add')}
                    onClipartAdd={handleImageUpdate}
                />
            );
        default:
            return null;
    }
  }

  const { key, ...designCanvasProps } = sticker;

  const gridStyle = {
    backgroundSize: '40px 40px',
    backgroundImage:
      'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)',
    backgroundPosition: 'center center',
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background text-foreground overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative" style={gridStyle}>
        <DesignCanvas key={key} {...designCanvasProps} />
      </div>
      <Separator orientation="vertical" className="hidden md:block bg-border/50" />
      <div className="w-full md:w-[360px] flex-shrink-0 bg-card border-l border-border/50">
        {renderPanel()}
      </div>
    </div>
  );
}
