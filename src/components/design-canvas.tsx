
'use client';

import { useState, useRef, type MouseEvent, type WheelEvent } from 'react';
import Image from 'next/image';
import type { StickerState } from './sticker-studio';
import { Skeleton } from './ui/skeleton';

interface DesignCanvasProps extends Omit<StickerState, 'key'> {
  onUpdate: (updates: Partial<StickerState>) => void;
}

export function DesignCanvas({
  imageUrl,
  width,
  height,
  isFlipped,
  borderWidth,
  borderColor,
  scale,
  x,
  y,
  onUpdate,
}: DesignCanvasProps) {
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, imageX: 0, imageY: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      imageX: x,
      imageY: y,
    };
    if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing';
    }
  };

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    onUpdate({
      x: panStartRef.current.imageX + dx,
      y: panStartRef.current.imageY + dy,
    });
  };

  const onMouseUpOrLeave = () => {
    setIsPanning(false);
    if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grab';
    }
  };
  
  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newScale;
    if (e.deltaY < 0) {
      // Zoom in
      newScale = scale * zoomFactor;
    } else {
      // Zoom out
      newScale = scale / zoomFactor;
    }
    onUpdate({ scale: Math.max(0.1, Math.min(newScale, 10)) });
  };


  const containerStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    cursor: 'grab',
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
    transition: isPanning ? 'none' : 'transform 0.1s ease-out',
  };

  const imageStyle: React.CSSProperties = {
    transform: `scaleX(${isFlipped ? -1 : 1})`,
    border: `${borderWidth}px solid ${borderColor}`,
    borderRadius: '8px',
    boxShadow: `0 0 0 1px hsla(var(--foreground), 0.1)`,
    objectFit: 'contain',
    width: '100%',
    height: '100%',
    transition: 'transform 0.3s ease',
  };

  return (
    <div
      id="design-canvas"
      ref={canvasRef}
      className="relative flex items-center justify-center"
      style={containerStyle}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUpOrLeave}
      onMouseLeave={onMouseUpOrLeave}
      onWheel={onWheel}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt="Sticker design"
          width={width}
          height={height}
          style={imageStyle}
          data-ai-hint="sticker design"
          unoptimized // Necessary for data URIs and to prevent Next.js image optimization issues
          draggable={false} // Prevents native image dragging
        />
      ) : (
        <Skeleton className="w-full h-full rounded-lg" />
      )}
    </div>
  );
}
