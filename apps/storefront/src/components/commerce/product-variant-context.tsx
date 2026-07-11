'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface VariantOption {
  id: string;
  name: string;
  price?: string | null;
}

interface ProductVariantContextValue {
  variants: VariantOption[];
  selectedVariantId?: string;
  setSelectedVariantId: (id: string) => void;
  selectedVariant?: VariantOption;
  displayPrice: string;
}

const ProductVariantContext = createContext<ProductVariantContextValue | null>(null);

export function ProductVariantProvider({
  variants,
  basePrice,
  children,
}: {
  variants: VariantOption[];
  basePrice: string;
  children: ReactNode;
}) {
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id);

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? variants[0],
    [variants, selectedVariantId],
  );

  const displayPrice = selectedVariant?.price ?? basePrice;

  const value = useMemo(
    () => ({
      variants,
      selectedVariantId,
      setSelectedVariantId,
      selectedVariant,
      displayPrice,
    }),
    [variants, selectedVariantId, selectedVariant, displayPrice],
  );

  return <ProductVariantContext.Provider value={value}>{children}</ProductVariantContext.Provider>;
}

export function useProductVariant() {
  const ctx = useContext(ProductVariantContext);
  if (!ctx) throw new Error('useProductVariant must be used within ProductVariantProvider');
  return ctx;
}
