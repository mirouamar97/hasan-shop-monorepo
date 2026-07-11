'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  type Cart,
} from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import { StickyCheckout } from '@/components/cro/sticky-checkout';
import { TrustBadges } from '@/components/cro/trust-badges';

interface CartPageClientProps {
  locale: string;
}

export function CartPageClient({ locale }: CartPageClientProps) {
  const t = useTranslations();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCart();
      setCart(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  async function handleQuantityChange(itemId: string, quantity: number) {
    setUpdatingId(itemId);
    setError(null);
    try {
      const updated = await updateCartItem(itemId, quantity);
      setCart(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemove(itemId: string) {
    setUpdatingId(itemId);
    setError(null);
    try {
      const updated = await removeCartItem(itemId);
      setCart(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleClear() {
    setError(null);
    try {
      await clearCart();
      setCart(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    }
  }

  if (loading) {
    return (
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-[var(--radius-xl)]" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-[var(--radius-xl)]" />
      </div>
    );
  }

  if (error && !cart) {
    return (
      <EmptyState
        title={t('common.error')}
        description={error}
        action={
          <Button onClick={loadCart}>{t('common.retry')}</Button>
        }
      />
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-8 w-8" />}
        title={t('cart.empty')}
        description={t('cart.emptyDesc')}
        action={
          <Link href="/products">
            <Button size="lg">{t('cart.continueShopping')}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
        <div className="space-y-4 lg:col-span-2">
          {error && (
            <p className="text-sm text-[var(--color-danger)]" role="alert" aria-live="polite">
              {error}
            </p>
          )}
          {cart.items.map((item) => (
            <Card key={item.id} padding="sm" className="flex gap-4 sm:gap-6">
              <Link
                href={item.productSlug ? `/products/${item.productSlug}` : '#'}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] sm:h-28 sm:w-28"
              >
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.productName ?? ''} fill className="object-cover" sizes="112px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--color-muted)]">—</div>
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                {item.productSlug ? (
                  <Link href={`/products/${item.productSlug}`} className="font-medium hover:text-[var(--color-accent)] line-clamp-2">
                    {item.productName}
                  </Link>
                ) : (
                  <span className="font-medium line-clamp-2">{item.productName}</span>
                )}
                {item.variantName && (
                  <span className="mt-1 text-sm text-[var(--color-muted)]">{item.variantName}</span>
                )}
                <p className="mt-2 font-semibold tabular-nums">
                  {formatPrice(item.unitPrice, locale)} {t('common.currency')}
                </p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                  <div className="flex items-center rounded-[var(--radius-md)] border border-[var(--color-border)]">
                    <button
                      type="button"
                      aria-label={t('cart.decreaseQuantity')}
                      disabled={updatingId === item.id || item.quantity <= 1}
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="flex h-9 w-9 items-center justify-center hover:bg-[var(--color-surface-muted)] disabled:opacity-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2.5rem] text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={t('cart.increaseQuantity')}
                      disabled={
                        updatingId === item.id ||
                        (item.maxQuantity != null && item.quantity >= item.maxQuantity)
                      }
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="flex h-9 w-9 items-center justify-center hover:bg-[var(--color-surface-muted)] disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={updatingId === item.id}
                    onClick={() => handleRemove(item.id)}
                    className="flex items-center gap-1 text-sm text-[var(--color-danger)] hover:underline disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('cart.remove')}</span>
                  </button>
                </div>
              </div>
            </Card>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-danger)]"
          >
            {t('cart.clear')}
          </button>
        </div>

        <div id="cart-summary" className="h-fit space-y-6">
          <Card padding="lg" className="sticky top-24">
            <h2 className="text-lg font-semibold">{t('cart.summary')}</h2>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">{t('cart.items', { count: cart.itemCount })}</span>
                <span className="tabular-nums font-medium">
                  {formatPrice(cart.subtotal, locale)} {t('common.currency')}
                </span>
              </div>
            </div>
            <div className="mt-6 flex justify-between border-t border-[var(--color-border)] pt-6 text-lg font-semibold">
              <span>{t('cart.subtotal')}</span>
              <span className="tabular-nums">
                {formatPrice(cart.subtotal, locale)} {t('common.currency')}
              </span>
            </div>
            <Link href="/checkout" className="mt-6 block">
              <Button fullWidth size="lg">
                {t('cart.checkout')}
              </Button>
            </Link>
            <p className="mt-4 text-center text-xs text-[var(--color-muted)]">{t('checkout.codNote')}</p>
          </Card>
          <TrustBadges variant="grid" className="hidden lg:grid" />
        </div>
      </div>
      <StickyCheckout subtotal={cart.subtotal} locale={locale} currencyLabel={t('common.currency')} />
    </>
  );
}
