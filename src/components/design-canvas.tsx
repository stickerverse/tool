
'use client';

import Image from 'next/image';
import type { StickerState } from './sticker-studio';
import { Skeleton } from './ui/skeleton';

// The key is destructured but not used because it's a special React prop for list reconciliation.
// We remove it from the props passed to the component to avoid confusion.
export function DesignCanvas({ imageUrl, width, height, isFlipped, borderWidth, borderColor }: Omit<StickerState, 'key'>) {

  const containerStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
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
    <div id="design-canvas" className="relative transition-all duration-300 ease-in-out flex items-center justify-center" style={containerStyle}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt="Sticker design"
          width={width}
          height={height}
          style={imageStyle}
          data-ai-hint="sticker design"
          unoptimized // Necessary for data URIs and to prevent Next.js image optimization issues
        />
      ) : (
        <Skeleton className="w-full h-full rounded-lg" />
      )}
    </div>
  );
}
