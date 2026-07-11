'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface GalleryImage {
  id: string;
  url: string;
  altText?: string | null;
  isPrimary: boolean;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const sorted = [...images].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
  const [activeIndex, setActiveIndex] = useState(0);

  function goPrev() {
    setActiveIndex((i) => (i === 0 ? sorted.length - 1 : i - 1));
  }

  function goNext() {
    setActiveIndex((i) => (i === sorted.length - 1 ? 0 : i + 1));
  }

  if (!sorted.length) {
    return (
      <div className="aspect-square rounded-[var(--radius-2xl)] bg-[var(--color-surface-muted)] flex items-center justify-center text-[var(--color-muted)]">
        —
      </div>
    );
  }

  const active = sorted[activeIndex] ?? sorted[0];
  if (!active) return null;

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-[var(--radius-2xl)] bg-[var(--color-surface-muted)]">
        <Image
          key={active.id}
          src={active.url}
          alt={active.altText ?? productName}
          fill
          className="object-cover animate-fade-in"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        {sorted.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute start-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)]/90 shadow-[var(--shadow-md)] backdrop-blur"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute end-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)]/90 shadow-[var(--shadow-md)] backdrop-blur"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 rtl:rotate-180" />
            </button>
          </>
        )}
      </div>
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product images">
          {sorted.map((img, index) => (
            <button
              key={img.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] border-2 transition-colors',
                index === activeIndex
                  ? 'border-[var(--color-accent)]'
                  : 'border-transparent opacity-70 hover:opacity-100',
              )}
            >
              <Image src={img.url} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
