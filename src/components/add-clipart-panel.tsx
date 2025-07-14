
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { generateClipart } from '@/app/actions';
import {
  ChevronLeft,
  Plus,
  Layers,
  Save,
  CheckCircle2,
  Loader2,
  Paintbrush,
} from 'lucide-react';

interface AddClipartPanelProps {
    onNavigateBack: () => void;
    onClipartAdd: (imageUrl: string) => void;
}

export function AddClipartPanel({ onNavigateBack, onClipartAdd }: AddClipartPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleGenerateClipart = async () => {
    if (!prompt.trim()) {
        toast({
            variant: 'destructive',
            title: 'Prompt is empty',
            description: 'Please enter a description for the clipart.',
        });
        return;
    }
    
    setIsProcessing(true);
    toast({ title: "AI is at work...", description: "Generating your clipart." });

    const result = await generateClipart({ prompt });
    setIsProcessing(false);

    if ('error' in result) {
        toast({
            variant: "destructive",
            title: "Failed to generate clipart",
            description: result.error,
        });
    } else {
        toast({
            title: "Success!",
            description: "Clipart added to the canvas.",
        });
        onClipartAdd(result.imageDataUri);
    }
  };

  return (
    <div className="h-full flex flex-col bg-card text-foreground">
      <header className="flex items-center justify-between p-4 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onNavigateBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold tracking-wide">ADD CLIPART</h1>
        <div className="w-10" />
      </header>
      
      <div className="flex-1 p-4 space-y-6">
        <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Clipart Prompt</h3>
            <Input
                placeholder="e.g., a cute smiling cat"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-zinc-800 border-zinc-700 focus:ring-accent"
            />
        </div>

        <Button 
            onClick={handleGenerateClipart} 
            disabled={isProcessing} 
            className="w-full h-12 bg-accent hover:bg-accent/90 text-lg"
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Paintbrush className="mr-2 h-5 w-5" />
          )}
          Generate Clipart
        </Button>
      </div>

      <footer className="grid grid-cols-4 gap-2 p-4 border-t border-border/50 mt-auto">
        <Button variant="ghost" className="flex-col h-auto text-accent" onClick={onNavigateBack}>
          <Plus className="w-5 h-5 mb-1" />
          Add Item
        </Button>
        <Button variant="ghost" className="flex-col h-auto">
          <Layers className="w-5 h-5 mb-1" />
          Layers
        </Button>
        <Button variant="ghost" className="flex-col h-auto">
          <Save className="w-5 h-5 mb-1" />
          Save
        </Button>
        <Button variant="ghost" className="flex-col h-auto text-green-400 hover:text-green-400">
          <CheckCircle2 className="w-5 h-5 mb-1" />
          Finalize
        </Button>
      </footer>
    </div>
  );
}
