
'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { StickerState } from './sticker-studio';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { BackgroundRemover } from './background-remover';
import { ControlGroup } from './control-group';
import { ScreenshotButton } from './screenshot-button';
import { FlipHorizontal, Lock, Unlock, Trash2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface PropertiesPanelProps {
  sticker: StickerState;
  setSticker: Dispatch<SetStateAction<StickerState>>;
  onImageUpdate: (newImageUrl: string) => void;
  onReset: () => void;
}

export function PropertiesPanel({ sticker, setSticker, onImageUpdate, onReset }: PropertiesPanelProps) {
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Number(e.target.value);
    setSticker(s => ({
      ...s,
      width: newWidth,
      height: s.proportionsLocked ? newWidth / s.aspectRatio : s.height,
    }));
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = Number(e.target.value);
    setSticker(s => ({
      ...s,
      height: newHeight,
      width: s.proportionsLocked ? newHeight * s.aspectRatio : s.width,
    }));
  };
  
  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-6 space-y-6">
        <header>
          <h1 className="font-headline text-4xl text-foreground tracking-wide">Sticker Studio</h1>
          <p className="text-muted-foreground">Design your perfect sticker.</p>
        </header>

        <BackgroundRemover onImageUpdate={onImageUpdate} stickerImage={sticker.imageUrl} />
        
        {sticker.imageUrl && (
          <>
            <ControlGroup title="Size & Proportions">
              <div className="flex items-center gap-2">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="width">Width</Label>
                  <Input id="width" type="number" value={Math.round(sticker.width)} onChange={handleWidthChange} />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="height">Height</Label>
                  <Input id="height" type="number" value={Math.round(sticker.height)} onChange={handleHeightChange} />
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="mt-6"
                  onClick={() => setSticker(s => ({...s, proportionsLocked: !s.proportionsLocked}))}
                  aria-label="Toggle proportions lock"
                >
                  {sticker.proportionsLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </Button>
              </div>
            </ControlGroup>
            
            <ControlGroup title="Appearance">
              <div className="space-y-2">
                <Label htmlFor="border-width">Border Width</Label>
                <Slider
                  id="border-width"
                  min={0}
                  max={50}
                  step={1}
                  value={[sticker.borderWidth]}
                  onValueChange={(value) => setSticker(s => ({ ...s, borderWidth: value[0] }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="border-color">Border Color</Label>
                <Input
                  id="border-color"
                  type="color"
                  value={sticker.borderColor}
                  onChange={(e) => setSticker(s => ({ ...s, borderColor: e.target.value }))}
                  className="p-1 h-10"
                />
              </div>
            </ControlGroup>

            <ControlGroup title="Actions">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setSticker(s => ({ ...s, isFlipped: !s.isFlipped }))}>
                  <FlipHorizontal className="mr-2 h-4 w-4" />
                  Flip
                </Button>
                <ScreenshotButton />
                <Button variant="destructive" className="col-span-2" onClick={onReset}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset Design
                </Button>
              </div>
            </ControlGroup>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
