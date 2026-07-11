'use client';

import { cn } from '@/lib/cn';

export interface ProductVariantOption {
  id: string;
  name: string;
  price?: string | null;
}

interface ProductVariantPickerProps {
  variants: ProductVariantOption[];
  selectedId?: string;
  onChange: (variantId: string) => void;
  label: string;
}

export function ProductVariantPicker({
  variants,
  selectedId,
  onChange,
  label,
}: ProductVariantPickerProps) {
  if (variants.length <= 1) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2" role="listbox" aria-label={label}>
        {variants.map((variant) => {
          const selected = variant.id === selectedId;
          return (
            <button
              key={variant.id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(variant.id)}
              className={cn(
                'rounded-[var(--radius-md)] border px-4 py-2 text-sm transition-colors',
                selected
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] font-medium'
                  : 'border-[var(--color-border)] hover:border-[var(--color-accent)]',
              )}
            >
              {variant.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
