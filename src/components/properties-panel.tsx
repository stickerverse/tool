
'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { StickerState } from './sticker-studio';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { BackgroundRemover } from './background-remover';
import { ScreenshotButton } from './screenshot-button';
import {
  FlipHorizontal,
  Lock,
  Unlock,
  Trash2,
  ChevronLeft,
  Minus,
  Plus,
  Eye,
  EyeOff,
  Layers,
  CheckCircle2,
  Copy,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  StretchHorizontal,
  StretchVertical,
  Layers2,
  Layers3,
  Image,
  Star,
  Circle,
  Heart,
  Square,
  RefreshCw,
} from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { ImageCropper } from './image-cropper';

interface PropertiesPanelProps {
  sticker: StickerState;
  setSticker: Dispatch<SetStateAction<StickerState>>;
  onImageUpdate: (newImageUrl: string) => void;
  onReset: () => void;
}

function ControlSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function ButtonGroup({ children }: { children: React.ReactNode }) {
    return <div className="flex items-center space-x-px rounded-md bg-zinc-800 border border-zinc-700 overflow-hidden">{children}</div>
}

function ButtonGroupButton({ children, onClick, active, disabled }: { children: React.ReactNode, onClick?: () => void, active?: boolean, disabled?: boolean }) {
    return <Button variant="ghost" size="sm" onClick={onClick} disabled={disabled} className={`h-10 flex-1 rounded-none px-4 ${active ? 'bg-accent/80 hover:bg-accent' : 'hover:bg-zinc-700'}`}>{children}</Button>
}


export function PropertiesPanel({ sticker, setSticker, onImageUpdate, onReset }: PropertiesPanelProps) {
  const handleSizeChange = (amount: number) => {
    setSticker(s => {
      const newWidth = s.width + amount;
      const newHeight = s.proportionsLocked ? newWidth / s.aspectRatio : s.height + amount;
      return {
        ...s,
        width: Math.max(10, newWidth),
        height: Math.max(10, newHeight),
      };
    });
  };

  const handleBorderWidthChange = (amount: number) => {
    setSticker(s => ({
      ...s,
      borderWidth: Math.max(0, s.borderWidth + amount),
    }));
  }

  const toggleBorder = () => {
    setSticker(s => ({...s, borderWidth: s.borderWidth > 0 ? 0 : 4}))
  }

  return (
    <div className="h-full flex flex-col bg-card text-foreground">
      <header className="flex items-center justify-between p-4 border-b border-border/50">
        <Button variant="ghost" size="icon">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold tracking-wide">EDIT FILE</h1>
        <Button variant="ghost" size="icon" onClick={onReset}>
          <Trash2 className="w-5 h-5" />
        </Button>
      </header>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <ControlSection title="Alignment">
                <ButtonGroup>
                    <ButtonGroupButton><AlignVerticalJustifyCenter/></ButtonGroupButton>
                    <ButtonGroupButton><AlignHorizontalJustifyCenter/></ButtonGroupButton>
                </ButtonGroup>
            </ControlSection>
            <ControlSection title="Layer Position">
                <ButtonGroup>
                    <ButtonGroupButton><Layers3/></ButtonGroupButton>
                    <ButtonGroupButton><Layers2/></ButtonGroupButton>
                </ButtonGroup>
            </ControlSection>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <ControlSection title="Size">
              <ButtonGroup>
                <ButtonGroupButton onClick={() => handleSizeChange(-10)}><Minus /></ButtonGroupButton>
                <ButtonGroupButton onClick={() => handleSizeChange(10)}><Plus /></ButtonGroupButton>
              </ButtonGroup>
            </ControlSection>
            <ControlSection title="Proportions">
              <ButtonGroup>
                <ButtonGroupButton onClick={() => setSticker(s => ({ ...s, proportionsLocked: true }))} active={sticker.proportionsLocked}>
                  <Lock />
                </ButtonGroupButton>
                <ButtonGroupButton onClick={() => setSticker(s => ({ ...s, proportionsLocked: false }))} active={!sticker.proportionsLocked}>
                  <Unlock />
                </ButtonGroupButton>
              </ButtonGroup>
            </ControlSection>
             <ControlSection title="Fit">
                <ButtonGroup>
                    <ButtonGroupButton><StretchVertical /></ButtonGroupButton>
                    <ButtonGroupButton><StretchHorizontal /></ButtonGroupButton>
                </ButtonGroup>
            </ControlSection>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <ControlSection title="Invert">
                <Button variant="outline" className="w-full justify-center h-10 bg-zinc-800 border-zinc-700 hover:bg-zinc-700" onClick={() => setSticker(s => ({ ...s, isFlipped: !s.isFlipped }))}>
                  <FlipHorizontal className="mr-2 h-4 w-4" />
                  Flip Image
                </Button>
            </ControlSection>
            <BackgroundRemover onImageUpdate={onImageUpdate} stickerImage={sticker.imageUrl} />
          </div>

          <Separator className="bg-border/50" />
          
          <ImageCropper onImageUpdate={onImageUpdate} stickerImage={sticker.imageUrl}/>
          
          <Separator className="bg-border/50" />
          
          <ControlSection title="Border">
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Color</h3>
                    <Input
                      id="border-color"
                      type="color"
                      value={sticker.borderColor}
                      onChange={(e) => setSticker(s => ({ ...s, borderColor: e.target.value }))}
                      className="p-1 h-10 w-full bg-zinc-800 border-zinc-700"
                    />
                </div>
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Size</h3>
                  <ButtonGroup>
                    <ButtonGroupButton onClick={() => handleBorderWidthChange(-1)}><Minus /></ButtonGroupButton>
                    <ButtonGroupButton onClick={() => handleBorderWidthChange(1)}><Plus /></ButtonGroupButton>
                  </ButtonGroup>
                </div>
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Show/Hide</h3>
                   <ButtonGroup>
                    <ButtonGroupButton onClick={toggleBorder} active={sticker.borderWidth > 0}>
                        <Eye />
                    </ButtonGroupButton>
                    <ButtonGroupButton onClick={() => setSticker(s => ({...s, borderColor: 'transparent'}))} active={sticker.borderColor === 'transparent'}>
                        <EyeOff />
                    </ButtonGroupButton>
                  </ButtonGroup>
                </div>
            </div>
          </ControlSection>

          <Separator className="bg-border/50" />
          
          <ControlSection title="Layer Actions">
            <Button variant="outline" className="w-full justify-center h-10 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
                <Copy className="mr-2"/> Duplicate
            </Button>
          </ControlSection>

        </div>
      </ScrollArea>
      
      <footer className="grid grid-cols-4 gap-2 p-4 border-t border-border/50">
        <Button variant="ghost" className="flex-col h-auto"><Plus className="w-5 h-5 mb-1"/>Add Item</Button>
        <Button variant="ghost" className="flex-col h-auto"><Layers className="w-5 h-5 mb-1"/>Layers</Button>
        <ScreenshotButton />
        <Button variant="ghost" className="flex-col h-auto text-green-400 hover:text-green-400"><CheckCircle2 className="w-5 h-5 mb-1"/>Finalize</Button>
      </footer>
    </div>
  );
}
