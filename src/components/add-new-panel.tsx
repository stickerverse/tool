
'use client';

import { useRef, type ChangeEvent } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft,
  UploadCloud,
  Type,
  Smile,
  QrCode,
  Plus,
  Layers,
  Save,
  CheckCircle2,
} from 'lucide-react';
import type { EditorView } from './sticker-studio';


interface AddNewPanelProps {
  onImageUpdate: (newImageUrl: string) => void;
  onNavigate: (view: EditorView) => void;
}

interface AddItemButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
}

function AddItemButton({ icon, title, description, onClick, disabled }: AddItemButtonProps) {
  return (
    <Button
      variant="ghost"
      className="h-auto w-full justify-start p-4 text-left rounded-lg border border-zinc-800 hover:bg-zinc-800/50"
      onClick={onClick}
      disabled={disabled}
    >
      <div className="flex items-center">
        <div className="mr-4 text-accent">{icon}</div>
        <div className="flex flex-col">
          <span className="font-semibold text-base text-foreground">{title}</span>
          <span className="text-sm text-muted-foreground">{description}</span>
        </div>
      </div>
    </Button>
  );
}

export function AddNewPanel({ onImageUpdate, onNavigate }: AddNewPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload an image file.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      if (dataUri) {
        onImageUpdate(dataUri);
      }
    };
    reader.onerror = () => {
        toast({
            variant: 'destructive',
            title: 'File Read Error',
            description: 'Could not read the selected file.',
        });
    }
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="h-full flex flex-col bg-card text-foreground">
      <header className="flex items-center justify-between p-4 border-b border-border/50">
        <Button variant="ghost" size="icon" disabled>
          <ChevronLeft className="w-5 h-5 opacity-0" />
        </Button>
        <h1 className="text-lg font-semibold tracking-wide">ADD NEW</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 p-4 space-y-3">
        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        <AddItemButton
          icon={<UploadCloud size={24} />}
          title="Upload File"
          description="Use your artwork or photos to design"
          onClick={handleUploadClick}
        />
        <AddItemButton
          icon={<Type size={24} />}
          title="Add Text"
          description="Personalize text with fonts & colors"
          onClick={() => onNavigate('add-text')}
        />
        <AddItemButton
          icon={<Smile size={24} />}
          title="Add Clipart"
          description="Choose from thousands of graphics"
          onClick={() => onNavigate('add-clipart')}
        />
        <AddItemButton
          icon={<QrCode size={24} />}
          title="Add Code"
          description="Create scannable QR and bar codes"
          onClick={() => onNavigate('add-code')}
        />
      </div>

      <footer className="grid grid-cols-4 gap-2 p-4 border-t border-border/50">
        <Button variant="ghost" className="flex-col h-auto text-accent">
          <Plus className="w-5 h-5 mb-1" />
          Add Item
        </Button>
        <Button variant="ghost" className="flex-col h-auto" onClick={() => onNavigate('history')}>
          <Layers className="w-5 h-5 mb-1" />
          History
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
