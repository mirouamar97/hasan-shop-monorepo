'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { getFavorites, removeFavorite, type WishlistItem } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductGrid } from '@/components/commerce/product-card';

interface FavoritesPageClientProps {
  locale: string;
}

export function FavoritesPageClient({ locale }: FavoritesPageClientProps) {
  const t = useTranslations();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFavorites();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRemove(productId: string) {
    try {
      await removeFavorite(productId);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    }
  }

  if (loading) {
    return (
      <ProductGrid>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full rounded-[var(--radius-xl)]" />
        ))}
      </ProductGrid>
    );
  }

  if (error) {
    return (
      <EmptyState
        title={t('common.error')}
        description={error}
        action={<Button onClick={load}>{t('common.retry')}</Button>}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="h-8 w-8" />}
        title={t('favorites.empty')}
        description={t('favorites.emptyDesc')}
        action={
          <Link href="/products">
            <Button size="lg">{t('cart.continueShopping')}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <ProductGrid>
      {items.map((item) => (
        <article key={item.id} className="group relative flex flex-col">
          <Link href={item.productSlug ? `/products/${item.productSlug}` : '/products'} className="flex flex-col flex-1">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-muted)]">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.productName ?? ''} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" sizes="25vw" />
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--color-muted)]">—</div>
              )}
            </div>
            <div className="mt-4">
              <h3 className="line-clamp-2 text-sm font-medium">{item.productName}</h3>
              {item.productPrice && (
                <p className="mt-1 font-semibold tabular-nums">
                  {formatPrice(item.productPrice, locale)} {t('common.currency')}
                </p>
              )}
            </div>
          </Link>
          <button
            type="button"
            onClick={() => handleRemove(item.productId)}
            className="mt-3 text-sm text-[var(--color-danger)] hover:underline"
          >
            {t('favorites.remove')}
          </button>
        </article>
      ))}
    </ProductGrid>
  );
}
