
'use client';

import { useState, useRef, type MouseEvent, type WheelEvent } from 'react';
import Image from 'next/image';
import type { Layer } from './sticker-studio';
import { Skeleton } from './ui/skeleton';

interface DesignCanvasProps {
  layers: Layer[];
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onCommit: (description: string) => void;
}

const LayerComponent = ({
    layer,
    onUpdateLayer,
    onCommit
}: {
    layer: Layer,
    onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
    onCommit: (description: string) => void;
}) => {
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0, layerX: 0, layerY: 0 });
    const layerRef = useRef<HTMLDivElement>(null);

    const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsPanning(true);
        panStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            layerX: layer.x,
            layerY: layer.y,
        };
        if (layerRef.current) {
            layerRef.current.style.cursor = 'grabbing';
            layerRef.current.style.zIndex = '10';
        }
    };

    const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!isPanning) return;
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        onUpdateLayer(layer.id, {
            x: panStartRef.current.layerX + dx,
            y: panStartRef.current.layerY + dy,
        });
    };

    const onMouseUpOrLeave = (e: MouseEvent<HTMLDivElement>) => {
        if (isPanning) {
            onCommit('Move Layer');
        }
        setIsPanning(false);
        if (layerRef.current) {
            layerRef.current.style.cursor = 'grab';
            layerRef.current.style.zIndex = '1';
        }
    };
    
    const onWheel = (e: WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const zoomFactor = 1.1;
        let newScale;
        if (e.deltaY < 0) {
            newScale = layer.scale * zoomFactor;
        } else {
            newScale = layer.scale / zoomFactor;
        }
        const finalScale = Math.max(0.1, Math.min(newScale, 10));
        onUpdateLayer(layer.id, { scale: finalScale });
        onCommit('Scale Layer');
    };

    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        width: layer.width,
        height: layer.type === 'text' ? 'auto' : layer.height,
        cursor: 'grab',
        transform: `translate(${layer.x}px, ${layer.y}px) scale(${layer.scale})`,
        transition: isPanning ? 'none' : 'transform 0.1s ease-out',
        borderRadius: '8px',
    };
    
    const imageStyle: React.CSSProperties = {
        transform: `scaleX(${layer.isFlipped ? -1 : 1})`,
        objectFit: 'contain',
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        transition: 'transform 0.3s ease',
    };

    const textStyle: React.CSSProperties = {
        fontSize: '48px', // Example size, should be part of layer state
        fontWeight: 'bold',
        color: '#FFFFFF', // Example color
        padding: '10px',
        fontFamily: 'Bebas Neue, sans-serif',
        whiteSpace: 'nowrap',
    }

    return (
        <div
          ref={layerRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUpOrLeave}
          onMouseLeave={onMouseUpOrLeave}
          onWheel={onWheel}
          style={containerStyle}
        >
          {layer.type === 'image' && layer.imageUrl ? (
            <Image
              src={layer.imageUrl}
              alt="Sticker design layer"
              width={layer.width}
              height={layer.height || 400}
              style={imageStyle}
              data-ai-hint="sticker design"
              unoptimized
              draggable={false}
            />
          ) : layer.type === 'text' ? (
              <div style={textStyle}>
                  {layer.text}
              </div>
          ) : (
            <Skeleton className="w-full h-full rounded-lg" />
          )}
        </div>
      );
}


export function DesignCanvas({
  layers,
  onUpdateLayer,
  onCommit,
}: DesignCanvasProps) {
    return (
        <div
            id="design-canvas"
            className="relative w-[500px] h-[500px] flex items-center justify-center"
        >
            {layers.map(layer => (
                <LayerComponent 
                    key={layer.id}
                    layer={layer}
                    onUpdateLayer={onUpdateLayer}
                    onCommit={onCommit}
                />
            ))}
        </div>
    );
}
