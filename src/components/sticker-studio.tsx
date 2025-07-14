
'use client';

import { useState, useCallback, useEffect } from 'react';
import { DesignCanvas } from './design-canvas';
import { PropertiesPanel } from './properties-panel';
import { Separator } from './ui/separator';
import { AddNewPanel } from './add-new-panel';
import { AddTextPanel } from './add-text-panel';
import { AddCodePanel } from './add-code-panel';
import { AddClipartPanel } from './add-clipart-panel';
import { HistoryPanel } from './history-panel';


export type StickerState = {
  imageUrl: string | null;
  width: number;
  height: number;
  aspectRatio: number;
  proportionsLocked: boolean;
  isFlipped: boolean;
  borderWidth: number;
  borderColor: string;
  scale: number;
  x: number;
  y: number;
};

export type HistoryEntry = {
    state: StickerState;
    description: string;
    timestamp: number;
}

const INITIAL_STATE: StickerState = {
  imageUrl: `https://placehold.co/400x400.png`,
  width: 400,
  height: 400,
  aspectRatio: 1,
  proportionsLocked: true,
  isFlipped: false,
  borderWidth: 4,
  borderColor: '#FFFFFF',
  scale: 1,
  x: 0,
  y: 0,
};

const INITIAL_HISTORY_ENTRY: HistoryEntry = {
    state: INITIAL_STATE,
    description: 'Initial State',
    timestamp: Date.now(),
}

export type EditorView = 'add' | 'edit' | 'add-text' | 'add-code' | 'add-clipart' | 'history';

export default function StickerStudio() {
  const [history, setHistory] = useState<HistoryEntry[]>([INITIAL_HISTORY_ENTRY]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [sticker, setSticker] = useState<StickerState>(INITIAL_STATE);
  const [view, setView] = useState<EditorView>('edit');
  
  useEffect(() => {
    setSticker(history[historyIndex].state);
  }, [history, historyIndex]);

  const updateHistory = useCallback((newState: Partial<StickerState>, description: string) => {
    setHistory(prevHistory => {
        const currentEntry = prevHistory[historyIndex];
        const updatedState = { ...currentEntry.state, ...newState };
        const newEntry: HistoryEntry = {
            state: updatedState,
            description,
            timestamp: Date.now()
        };
        const newHistory = prevHistory.slice(0, historyIndex + 1);
        newHistory.push(newEntry);
        return newHistory;
    });
    setHistoryIndex(prevIndex => prevIndex + 1);
  }, [historyIndex]);

  const commitToHistory = (description: string) => {
    updateHistory(sticker, description);
  }

  const handleLiveUpdate = (updates: Partial<StickerState>) => {
    setSticker(prev => ({...prev, ...updates}));
  }

  const handleImageUpdate = (newImageUrl: string, description: string) => {
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const newWidth = 400;
      const newHeight = newWidth / aspectRatio;
      
      const currentState = history[historyIndex]?.state;

      const nextState: Partial<StickerState> = {
        ...sticker,
        imageUrl: newImageUrl,
        width: newWidth,
        height: newHeight,
        aspectRatio,
        isFlipped: false,
      };

      updateHistory(nextState, description);
      setView('edit');
    };
    img.src = newImageUrl;
  };
  
  const handleReset = () => {
    updateHistory(INITIAL_STATE, 'Reset Canvas');
    setView('add');
  }

  const navigateTo = (newView: EditorView) => {
    setView(newView);
  }

  const jumpToHistory = (index: number) => {
    setHistoryIndex(index);
    setView('edit');
  }

  const undo = () => {
    if (historyIndex > 0) {
        setHistoryIndex(historyIndex - 1);
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
        setHistoryIndex(historyIndex + 1);
    }
  }
  
  // A bit of a hack to pass a function to a child component that can navigate.
  // In a real app, this would be a proper context or state manager.
  if (typeof window !== 'undefined') {
    (window as any).navigateToHistory = () => navigateTo('history');
  }

  const renderPanel = () => {
    switch (view) {
        case 'edit':
            return (
                <PropertiesPanel 
                    sticker={sticker} 
                    onStickerChange={updateHistory}
                    onReset={handleReset}
                    onNavigate={navigateTo}
                />
            );
        case 'add':
            return (
                <AddNewPanel 
                    onImageUpdate={(url) => handleImageUpdate(url, 'Upload Image')} 
                    onNavigate={navigateTo} 
                />
            );
        case 'add-text':
            return (
                <AddTextPanel 
                    onNavigateBack={() => navigateTo('add')}
                    onTextAdd={(url) => handleImageUpdate(url, 'Add Text')}
                />
            );
        case 'add-code':
            return (
                <AddCodePanel
                    onNavigateBack={() => navigateTo('add')}
                    onCodeAdd={(url) => handleImageUpdate(url, 'Add QR Code')}
                />
            );
        case 'add-clipart':
            return (
                <AddClipartPanel
                    onNavigateBack={() => navigateTo('add')}
                    onClipartAdd={(url) => handleImageUpdate(url, 'Add Clipart')}
                />
            );
        case 'history':
            return (
                <HistoryPanel
                    history={history}
                    currentIndex={historyIndex}
                    onNavigateBack={() => navigateTo('edit')}
                    onJump={jumpToHistory}
                    onUndo={undo}
                    onRedo={redo}
                />
            );
        default:
            return null;
    }
  }

  const gridStyle = {
    backgroundSize: '40px 40px',
    backgroundImage:
      'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)',
    backgroundPosition: 'center center',
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background text-foreground overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative" style={gridStyle}>
        <DesignCanvas 
            sticker={sticker}
            onUpdate={handleLiveUpdate} 
            onCommit={commitToHistory}
        />
      </div>
      <Separator orientation="vertical" className="hidden md:block bg-border/50" />
      <div className="w-full md:w-[360px] flex-shrink-0 bg-card border-l border-border/50">
        {renderPanel()}
      </div>
    </div>
  );
}
