
'use client';

import { Save } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

export function ScreenshotButton() {
  const { toast } = useToast();

  const takeScreenshot = () => {
    const canvasElement = document.getElementById('design-canvas');
    if (canvasElement) {
      toast({
        title: "Saving your masterpiece...",
      });
      html2canvas(canvasElement, {
        backgroundColor: null,
        useCORS: true, 
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'sticker-design.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(err => {
        console.error("Failed to save image:", err);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Could not capture the design. Please try again.",
        });
      });
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not find the design canvas element.",
        });
    }
  };

  return (
    <Button variant="ghost" onClick={takeScreenshot} className="flex-col h-auto">
      <Save className="w-5 h-5 mb-1" />
      Save
    </Button>
  );
}
