
'use client';

import type { HistoryEntry } from './sticker-studio';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import {
  ChevronLeft,
  Undo,
  Redo,
  Plus,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';


interface HistoryPanelProps {
  history: HistoryEntry[];
  currentIndex: number;
  onNavigateBack: () => void;
  onJump: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function HistoryPanel({ history, currentIndex, onNavigateBack, onJump, onUndo, onRedo }: HistoryPanelProps) {

  return (
    <div className="h-full flex flex-col bg-card text-foreground">
      <header className="flex items-center justify-between p-4 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onNavigateBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold tracking-wide">HISTORY</h1>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onUndo} disabled={currentIndex === 0}>
                <Undo className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onRedo} disabled={currentIndex === history.length - 1}>
                <Redo className="w-5 h-5" />
            </Button>
        </div>
      </header>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
            <ul className="flex flex-col-reverse">
                {history.map((entry, index) => (
                    <li key={entry.timestamp}>
                        <button 
                            onClick={() => onJump(index)}
                            className={cn(
                                "w-full text-left p-3 rounded-md text-sm",
                                index === currentIndex ? 'bg-accent/20 text-accent-foreground font-semibold' : 'hover:bg-zinc-800/50'
                            )}
                        >
                            <p>{entry.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                            </p>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
      </ScrollArea>
      
      <footer className="grid grid-cols-4 gap-2 p-4 border-t border-border/50 mt-auto">
        <Button variant="ghost" className="flex-col h-auto" onClick={() => onNavigateBack()}><Plus className="w-5 h-5 mb-1"/>Add Item</Button>
        <Button variant="ghost" className="flex-col h-auto text-accent"><Undo className="w-5 h-5 mb-1"/>History</Button>
        <Button variant="ghost" className="flex-col h-auto"><Save className="w-5 h-5 mb-1"/>Save</Button>
        <Button variant="ghost" className="flex-col h-auto text-green-400 hover:text-green-400"><CheckCircle2 className="w-5 h-5 mb-1"/>Finalize</Button>
      </footer>
    </div>
  );
}
