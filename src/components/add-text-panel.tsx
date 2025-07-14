
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { addTextToImage } from '@/app/actions';
import {
  ChevronLeft,
  Plus,
  Layers,
  Save,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface AddTextPanelProps {
    onNavigateBack: () => void;
    onTextAdd: (imageUrl: string) => void;
}

export function AddTextPanel({ onNavigateBack, onTextAdd }: AddTextPanelProps) {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleAddText = async () => {
    if (!text.trim()) {
        toast({
            variant: 'destructive',
            title: 'Text is empty',
            description: 'Please enter some text to add.',
        });
        return;
    }
    
    setIsProcessing(true);
    toast({ title: "AI is at work...", description: "Generating your text image." });

    const result = await addTextToImage({ text });
    setIsProcessing(false);

    if ('error' in result) {
        toast({
            variant: "destructive",
            title: "Failed to add text",
            description: result.error,
        });
    } else {
        toast({
            title: "Success!",
            description: "Text added to the canvas.",
        });
        onTextAdd(result.imageDataUri);
    }
  };

  return (
    <div className="h-full flex flex-col bg-card text-foreground">
      <header className="flex items-center justify-between p-4 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onNavigateBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold tracking-wide">ADD TEXT</h1>
        <div className="w-10" />
      </header>
      
      <div className="flex-1 p-4 space-y-6">
        <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-zinc-800 border-zinc-700">
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="number-range" disabled>Number Range</TabsTrigger>
                <TabsTrigger value="csv-list" disabled>CSV List</TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="mt-6">
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Text</h3>
                    <Textarea
                        placeholder="Your text here"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 focus:ring-accent"
                        rows={4}
                    />
                </div>
            </TabsContent>
        </Tabs>

        <Button 
            onClick={handleAddText} 
            disabled={isProcessing} 
            className="w-full h-12 bg-accent hover:bg-accent/90 text-lg"
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : 'Add Text'}
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
