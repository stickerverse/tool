
'use client';

import type { Layer, EditorView } from './sticker-studio';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { BackgroundRemover } from './background-remover';
import { ScreenshotButton } from './screenshot-button';
import { ImageUploader } from './image-uploader';
import { ImageCropper } from './image-cropper';
import { StickerBorder } from './sticker-border';
import {
  FlipHorizontal,
  Lock,
  Unlock,
  Trash2,
  ChevronLeft,
  Minus,
  Plus,
  Layers,
  CheckCircle2,
  Copy,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  Layers2,
  Layers3,
  Undo,
  Redo,
} from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';


interface PropertiesPanelProps {
  // For now, we only edit the first layer. This needs to be improved
  // to support selecting and editing different layers.
  layer: Layer | null;
  onLayerChange: (id: string, updates: Partial<Layer>, description: string) => void;
  onReset: () => void;
  onNavigate: (view: EditorView) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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


export function PropertiesPanel({ layer, onLayerChange, onReset, onNavigate, onUndo, onRedo, canUndo, canRedo }: PropertiesPanelProps) {
  if (!layer) {
    return (
        <div className="h-full flex flex-col bg-card text-foreground">
             <header className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onNavigate('add')}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo}>
                        <Undo className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo}>
                        <Redo className="w-5 h-5" />
                    </Button>
                </div>
                <h1 className="text-lg font-semibold tracking-wide">EDIT FILE</h1>
                <Button variant="ghost" size="icon" onClick={onReset}>
                <Trash2 className="w-5 h-5" />
                </Button>
            </header>
            <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Select a layer to edit</p>
            </div>
            <footer className="grid grid-cols-4 gap-2 p-4 border-t border-border/50">
                <Button variant="ghost" className="flex-col h-auto" onClick={() => onNavigate('add')}><Plus className="w-5 h-5 mb-1"/>Add Item</Button>
                <Button variant="ghost" className="flex-col h-auto" onClick={() => onNavigate('history')}><Layers className="w-5 h-5 mb-1"/>History</Button>
                <ScreenshotButton />
                <Button variant="ghost" className="flex-col h-auto text-green-400 hover:text-green-400"><CheckCircle2 className="w-5 h-5 mb-1"/>Finalize</Button>
            </footer>
        </div>
    )
  }

  const handleSizeChange = (amount: number) => {
    const { width, height, proportionsLocked, aspectRatio } = layer;
    const newWidth = width + amount;
    const newHeight = proportionsLocked && aspectRatio ? newWidth / aspectRatio : (height || width) + amount;
    onLayerChange(layer.id, {
      width: Math.max(10, newWidth),
      height: Math.max(10, newHeight),
    }, `Resize to ${Math.round(newWidth)}x${Math.round(newHeight)}`);
  };

  const handleDirectImageUpdate = (newImageUrl: string, description: string) => {
    onLayerChange(layer.id, { imageUrl: newImageUrl }, description);
  };

  const onImageCrop = (newImageUrl: string, shape: string) => {
    onLayerChange(layer.id, { imageUrl: newImageUrl }, `Crop to ${shape}`);
  }

  const isImageLayer = layer.type === 'image';

  return (
    <div className="h-full flex flex-col bg-card text-foreground">
      <header className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onNavigate('add')}>
                <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo}>
                <Undo className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo}>
                <Redo className="w-5 h-5" />
            </Button>
        </div>
        <h1 className="text-lg font-semibold tracking-wide">EDIT FILE</h1>
        <Button variant="ghost" size="icon" onClick={onReset}>
          <Trash2 className="w-5 h-5" />
        </Button>
      </header>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          
          {isImageLayer && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <ImageUploader onImageUpdate={(url) => handleDirectImageUpdate(url, 'Update Image')} />
                <BackgroundRemover 
                  onImageUpdate={(newUrl) => onLayerChange(layer.id, { imageUrl: newUrl }, 'Remove Background')} 
                  stickerImage={layer.imageUrl} 
                />
              </div>
              <Separator className="bg-border/50" />
            </>
          )}

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
          
          {isImageLayer && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <ControlSection title="Size">
                  <ButtonGroup>
                    <ButtonGroupButton onClick={() => handleSizeChange(-10)}><Minus /></ButtonGroupButton>
                    <ButtonGroupButton onClick={() => handleSizeChange(10)}><Plus /></ButtonGroupButton>
                  </ButtonGroup>
                </ControlSection>
                <ControlSection title="Proportions">
                  <ButtonGroup>
                    <ButtonGroupButton onClick={() => onLayerChange(layer.id, { proportionsLocked: true }, 'Lock Proportions')} active={layer.proportionsLocked}>
                      <Lock />
                    </ButtonGroupButton>
                    <ButtonGroupButton onClick={() => onLayerChange(layer.id, { proportionsLocked: false }, 'Unlock Proportions')} active={!layer.proportionsLocked}>
                      <Unlock />
                    </ButtonGroupButton>
                  </ButtonGroup>
                </ControlSection>
              </div>
              
              <Separator className="bg-border/50" />
              
              <ImageCropper onImageUpdate={onImageCrop} stickerImage={layer.imageUrl}/>
              
              <Separator className="bg-border/50" />
              
              <StickerBorder 
                layer={layer} 
                onImageUpdate={(url) => handleDirectImageUpdate(url, 'Update Border')} 
              />

              <Separator className="bg-border/50" />
            </>
          )}
          
          <ControlSection title="Layer Actions">
            <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="w-full justify-center h-10 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
                    <Copy className="mr-2"/> Duplicate
                </Button>
                {isImageLayer && (
                  <Button variant="outline" className="w-full justify-center h-10 bg-zinc-800 border-zinc-700 hover:bg-zinc-700" onClick={() => onLayerChange(layer.id, { isFlipped: !layer.isFlipped }, 'Flip Layer')}>
                      <FlipHorizontal className="mr-2 h-4 w-4" />
                      Flip Image
                  </Button>
                )}
            </div>
          </ControlSection>

        </div>
      </ScrollArea>
      
      <footer className="grid grid-cols-4 gap-2 p-4 border-t border-border/50">
        <Button variant="ghost" className="flex-col h-auto" onClick={() => onNavigate('add')}><Plus className="w-5 h-5 mb-1"/>Add Item</Button>
        <Button variant="ghost" className="flex-col h-auto" onClick={() => onNavigate('history')}><Layers className="w-5 h-5 mb-1"/>History</Button>
        <ScreenshotButton />
        <Button variant="ghost" className="flex-col h-auto text-green-400 hover:text-green-400"><CheckCircle2 className="w-5 h-5 mb-1"/>Finalize</Button>
      </footer>
    </div>
  );
}
