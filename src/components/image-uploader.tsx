
'use client';

import { useRef, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud } from 'lucide-react';

interface ImageUploaderProps {
  onImageUpdate: (newImageUrl: string) => void;
}

export function ImageUploader({ onImageUpdate }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({
            variant: "destructive",
            title: "Invalid File Type",
            description: "Please upload an image file.",
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      onImageUpdate(dataUri);
    };
    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Image</h3>
        <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
        />
        <Button onClick={handleButtonClick} className="w-full justify-center h-10 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload Image
        </Button>
    </div>
  );
}
