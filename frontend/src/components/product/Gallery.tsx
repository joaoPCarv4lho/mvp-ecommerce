import { useState } from 'react';
import type { ProductImage } from '../../domain/types';
import { productImgProps } from './img';

/** 1:1 main image (eager, high priority — it's above the fold) with thumbnail buttons below it. */
export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const img = images[active] ?? images[0];
  if (!img) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-card bg-surface">
        <img
          {...productImgProps(img.src)}
          {...({ fetchpriority: 'high' } as Record<string, string>)}
          alt={img.alt}
          sizes="(min-width: 1024px) 50vw, 100vw"
          loading="eager"
          decoding="async"
          className="aspect-square h-auto w-full object-cover"
        />
      </div>
      {images.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {images.map((im, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === active ? 'true' : undefined}
              onClick={() => setActive(i)}
              className={`h-11 w-11 overflow-hidden rounded-card border ${i === active ? 'border-brand' : 'border-border'}`}
            >
              <img src={im.src} alt="" width={44} height={44} decoding="async" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
      <p className="sr-only">{name}</p>
    </div>
  );
}
