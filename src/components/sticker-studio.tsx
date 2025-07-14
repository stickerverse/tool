
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

export type Layer = {
  id: string;
  type: 'image' | 'text';
  // Common properties
  x: number;
  y: number;
  scale: number;
  rotation: number;
  // Image specific
  imageUrl?: string | null;
  width: number;
  height?: number;
  aspectRatio?: number;
  proportionsLocked?: boolean;
  isFlipped?: boolean;
  borderWidth?: number;
  borderColor?: string;
  // Text specific
  text?: string;
  font?: string;
  fontSize?: number;
  textColor?: string;
};

const INITIAL_LAYER: Layer = {
    id: `layer-${Date.now()}`,
    type: 'image',
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
    rotation: 0,
};

export type HistoryEntry = {
    layers: Layer[];
    description: string;
    timestamp: number;
}

const INITIAL_HISTORY_ENTRY: HistoryEntry = {
    layers: [INITIAL_LAYER],
    description: 'Initial State',
    timestamp: Date.now(),
}

export type EditorView = 'add' | 'edit' | 'add-text' | 'add-code' | 'add-clipart' | 'history';

export default function StickerStudio() {
  const [history, setHistory] = useState<HistoryEntry[]>([INITIAL_HISTORY_ENTRY]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [layers, setLayers] = useState<Layer[]>(INITIAL_HISTORY_ENTRY.layers);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(INITIAL_LAYER.id);
  const [view, setView] = useState<EditorView>('edit');
  
  useEffect(() => {
    setLayers(history[historyIndex].layers);
  }, [history, historyIndex]);

  const updateHistory = useCallback((newLayers: Layer[], description: string) => {
    setHistory(prevHistory => {
        const newEntry: HistoryEntry = {
            layers: newLayers,
            description,
            timestamp: Date.now()
        };
        const newHistory = prevHistory.slice(0, historyIndex + 1);
        newHistory.push(newEntry);
        return newHistory;
    });
    setHistoryIndex(prevIndex => prevIndex + 1);
  }, [historyIndex]);

  const handleLiveUpdateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers(prevLayers =>
        prevLayers.map(l => (l.id === id ? { ...l, ...updates } : l))
    );
  }

  const handleCommitUpdate = (description: string) => {
    updateHistory(layers, description);
  }

  const handleLayerChange = (id: string, updates: Partial<Layer>, description: string) => {
    const newLayers = layers.map(l => (l.id === id ? { ...l, ...updates } : l));
    updateHistory(newLayers, description);
  }
  
  const addLayer = (newLayer: Omit<Layer, 'id'>, description: string) => {
    const layerWithId: Layer = { ...newLayer, id: `layer-${Date.now()}` };
    const newLayers = [...layers, layerWithId];
    updateHistory(newLayers, description);
    setSelectedLayerId(layerWithId.id);
    setView('edit');
  }

  const handleImageUpdate = (newImageUrl: string, description: string) => {
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const newWidth = 400;
      const newHeight = newWidth / aspectRatio;
      
      const newImageLayer: Omit<Layer, 'id'> = {
        type: 'image',
        imageUrl: newImageUrl,
        width: newWidth,
        height: newHeight,
        aspectRatio: aspectRatio,
        x: 0, y: 0, scale: 1, rotation: 0,
        isFlipped: false,
        proportionsLocked: true,
      };
      addLayer(newImageLayer, description);
    };
    img.src = newImageUrl;
  };

  const handleTextAdd = (text: string) => {
    const newTextLayer: Omit<Layer, 'id'> = {
        type: 'text',
        text,
        width: 300, // a default width
        x: 20, y: 20, scale: 1, rotation: 0,
        textColor: '#FFFFFF',
        font: 'Inter',
        fontSize: 48,
    };
    addLayer(newTextLayer, 'Add Text');
  }
  
  const handleReset = () => {
    updateHistory([INITIAL_LAYER], 'Reset Canvas');
    setSelectedLayerId(INITIAL_LAYER.id);
    setView('edit');
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
  
  if (typeof window !== 'undefined') {
    (window as any).navigateToHistory = () => navigateTo('history');
  }

  const renderPanel = () => {
    const selectedLayer = layers.find(l => l.id === selectedLayerId) ?? null;

    switch (view) {
        case 'edit':
            return (
                <PropertiesPanel 
                    layer={selectedLayer} 
                    onLayerChange={handleLayerChange}
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
                    onTextAdd={handleTextAdd}
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
            layers={layers}
            onUpdateLayer={handleLiveUpdateLayer} 
            onCommit={handleCommitUpdate}
        />
      </div>
      <Separator orientation="vertical" className="hidden md:block bg-border/50" />
      <div className="w-full md:w-[360px] flex-shrink-0 bg-card border-l border-border/50">
        {renderPanel()}
      </div>
    </div>
  );
}
