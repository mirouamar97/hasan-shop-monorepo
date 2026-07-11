'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import {
  addToCart,
  addFavorite,
  removeFavorite,
  getFavorites,
  recordRecentlyViewed,
} from '@/lib/api';

interface ProductDetailActionsProps {
  productId: string;
  variantId?: string;
  price: string;
  inStock: boolean;
  locale: string;
  currencyLabel: string;
  productName: string;
}

export function ProductDetailActions({
  productId,
  variantId,
  price,
  inStock,
  locale,
  currencyLabel,
}: ProductDetailActionsProps) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState<'cart' | 'buy' | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    recordRecentlyViewed(productId).catch(() => {});
    getFavorites()
      .then((items) => setIsFavorite(items.some((f) => f.productId === productId)))
      .catch(() => {});
  }, [productId]);

  async function handleAddToCart() {
    setLoading('cart');
    setError(null);
    try {
      await addToCart({ productId, variantId, quantity: 1 });
      router.push('/cart');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(null);
    }
  }

  function handleBuyNow() {
    const params = new URLSearchParams({ productId, quantity: '1', price });
    if (variantId) params.set('variantId', variantId);
    router.push(`/checkout?${params.toString()}`);
  }

  async function handleToggleFavorite() {
    setError(null);
    try {
      if (isFavorite) {
        await removeFavorite(productId);
        setIsFavorite(false);
      } else {
        await addFavorite(productId);
        setIsFavorite(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    }
  }

  return (
    <div id="product-actions" className="space-y-6">
      <div className="flex items-baseline gap-3">
        <span className="text-display text-3xl tabular-nums">
          {formatPrice(price, locale)} {currencyLabel}
        </span>
      </div>

      <Badge variant={inStock ? 'success' : 'danger'}>
        {inStock ? t('products.inStock') : t('products.outOfStock')}
      </Badge>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          size="lg"
          fullWidth
          className="sm:flex-1"
          disabled={!inStock || loading !== null}
          loading={loading === 'cart'}
          onClick={handleAddToCart}
        >
          {t('products.addToCart')}
        </Button>
        <Button
          variant="outline"
          size="lg"
          fullWidth
          className="sm:flex-1"
          disabled={!inStock || loading !== null}
          onClick={handleBuyNow}
        >
          {t('products.buyNow')}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? t('favorites.remove') : t('favorites.add')}
          aria-pressed={isFavorite}
          className={cn(isFavorite && 'text-[var(--color-danger)]')}
        >
          <Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} />
        </Button>
      </div>

      {error && (
        <p className="text-sm text-[var(--color-danger)]" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
