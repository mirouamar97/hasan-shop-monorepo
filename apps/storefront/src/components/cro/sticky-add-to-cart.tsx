'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import { addToCart } from '@/lib/api';

interface StickyAddToCartProps {
  productId: string;
  variantId?: string;
  price: string;
  inStock: boolean;
  locale: string;
  currencyLabel: string;
  onBuyNow: () => void;
}

export function StickyAddToCart({
  productId,
  variantId,
  price,
  inStock,
  locale,
  currencyLabel,
  onBuyNow,
}: StickyAddToCartProps) {
  const t = useTranslations();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trigger = document.getElementById('product-actions');
    if (!trigger) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setVisible(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(trigger);
    return () => observer.disconnect();
  }, []);

  async function handleAdd() {
    setLoading(true);
    try {
      await addToCart({ productId, variantId, quantity: 1 });
    } finally {
      setLoading(false);
    }
  }

  if (!visible || !inStock) return null;

  return (
    <div className="sticky-bar lg:hidden">
      <div className="container-store flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold tabular-nums">
            {formatPrice(price, locale)} {currencyLabel}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onBuyNow}>
          {t('products.buyNow')}
        </Button>
        <Button size="sm" loading={loading} onClick={handleAdd}>
          {t('products.addToCart')}
        </Button>
      </div>
    </div>
  );
}
