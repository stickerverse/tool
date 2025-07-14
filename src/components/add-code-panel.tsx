
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { createQrCode } from '@/app/actions';
import {
  ChevronLeft,
  Plus,
  Layers,
  Save,
  CheckCircle2,
  Loader2,
  Link,
  Contact,
  MessageSquareText,
  Scan,
} from 'lucide-react';

interface AddCodePanelProps {
  onNavigateBack: () => void;
  onCodeAdd: (imageUrl: string) => void;
}

type QrCodeType = 'url' | 'contact' | 'text' | 'custom';

function QrTypeButton({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
    return (
        <Button
            variant="ghost"
            className={`flex flex-col items-center justify-center h-20 w-full space-y-1 rounded-lg border ${isActive ? 'bg-accent/20 border-accent text-accent' : 'border-zinc-800 hover:bg-zinc-800/50'}`}
            onClick={onClick}
        >
            {icon}
            <span className="text-xs font-medium">{label}</span>
        </Button>
    )
}

export function AddCodePanel({ onNavigateBack, onCodeAdd }: AddCodePanelProps) {
  const [qrCodeType, setQrCodeType] = useState<QrCodeType>('url');
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleAddCode = async () => {
    if (!inputValue.trim()) {
        toast({
            variant: 'destructive',
            title: 'Input is empty',
            description: 'Please enter some data for the QR code.',
        });
        return;
    }
    
    setIsProcessing(true);
    toast({ title: "AI is at work...", description: "Generating your QR code." });

    const result = await createQrCode({ text: inputValue });
    setIsProcessing(false);

    if ('error' in result) {
        toast({
            variant: "destructive",
            title: "Failed to create QR code",
            description: result.error,
        });
    } else {
        toast({
            title: "Success!",
            description: "QR Code added to the canvas.",
        });
        onCodeAdd(result.imageDataUri);
    }
  };

  const renderQrContent = () => {
    switch(qrCodeType) {
        case 'url':
            return (
                <div className="space-y-2">
                    <label htmlFor="website-url" className="text-sm font-medium text-muted-foreground">Website URL:</label>
                    <Input id="website-url" placeholder="Example: stickersstickers.com" value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="bg-zinc-800 border-zinc-700 focus:ring-accent" />
                </div>
            )
        // Add other cases for contact, text, custom later
        default:
            return <p className="text-muted-foreground text-center py-4">This feature is not yet available.</p>
    }
  }

  return (
    <div className="h-full flex flex-col bg-card text-foreground">
      <header className="flex items-center justify-between p-4 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onNavigateBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold tracking-wide">ADD QR CODE</h1>
        <div className="w-10" />
      </header>
      
      <div className="flex-1 p-4 space-y-6">
        <Tabs defaultValue="qr-code" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-800 border-zinc-700">
                <TabsTrigger value="qr-code">QR Code</TabsTrigger>
                <TabsTrigger value="bar-code" disabled>Bar Code</TabsTrigger>
            </TabsList>
            <TabsContent value="qr-code" className="mt-6 space-y-6">
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">QR Code Type</h3>
                    <div className="grid grid-cols-4 gap-2">
                        <QrTypeButton icon={<Link size={24}/>} label="URL" isActive={qrCodeType === 'url'} onClick={() => { setQrCodeType('url'); setInputValue(''); }} />
                        <QrTypeButton icon={<Contact size={24}/>} label="Contact" isActive={qrCodeType === 'contact'} onClick={() => { setQrCodeType('contact'); setInputValue(''); }} />
                        <QrTypeButton icon={<MessageSquareText size={24}/>} label="Text" isActive={qrCodeType === 'text'} onClick={() => { setQrCodeType('text'); setInputValue(''); }} />
                        <QrTypeButton icon={<Scan size={24}/>} label="Custom" isActive={qrCodeType === 'custom'} onClick={() => { setQrCodeType('custom'); setInputValue(''); }} />
                    </div>
                </div>
                {renderQrContent()}
            </TabsContent>
        </Tabs>

        <Button 
            onClick={handleAddCode} 
            disabled={isProcessing || qrCodeType !== 'url'} 
            className="w-full h-12 bg-accent hover:bg-accent/90 text-lg"
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : 'Add To Design'}
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
