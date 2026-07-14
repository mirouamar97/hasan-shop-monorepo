'use client';

import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { formatPrice, discountPercent } from '@/lib/format';
import { addToCart } from '@/lib/api';
import type { ProductListItem } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface ProductCardProps {
  product: ProductListItem;
  locale: string;
  currencyLabel: string;
  showAddToCart?: boolean;
  priority?: boolean;
  className?: string;
  badge?: string;
}

export function ProductCard({
  product,
  locale,
  currencyLabel,
  showAddToCart,
  priority,
  className,
  badge,
}: ProductCardProps) {
  const t = useTranslations();
  const [adding, setAdding] = useState(false);
  const discount = discountPercent(product.price, product.compareAtPrice);
  const imageUrl = product.primaryImage?.url;
  const legacySvgPlaceholder = imageUrl?.includes('placehold.co') ?? false;

  async function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    try {
      await addToCart({ productId: product.id, quantity: 1 });
    } finally {
      setAdding(false);
    }
  }

  return (
    <article
      className={cn(
        'group relative flex flex-col animate-slide-up',
        className,
      )}
    >
      <Link href={`/products/${product.slug}`} className="flex flex-col flex-1">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-muted)]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.primaryImage?.altText ?? product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              unoptimized={legacySvgPlaceholder}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[var(--color-muted)]">—</div>
          )}
          {discount && (
            <Badge variant="accent" className="absolute start-3 top-3">
              −{discount}%
            </Badge>
          )}
          {badge && (
            <Badge variant="danger" className="absolute end-3 top-3">
              {badge}
            </Badge>
          )}
          {showAddToCart && (
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={adding}
              aria-label={t('products.addToCart')}
              className={cn(
                'absolute bottom-3 end-3 flex h-10 w-10 items-center justify-center rounded-full',
                'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[var(--shadow-md)]',
                'opacity-0 translate-y-2 transition-all duration-[var(--duration-normal)] group-hover:opacity-100 group-hover:translate-y-0',
                'focus-visible:opacity-100 focus-visible:translate-y-0 md:opacity-100 md:translate-y-0',
              )}
            >
              <ShoppingBag className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
        <div className="mt-4 flex flex-1 flex-col gap-1">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[var(--color-foreground)] group-hover:text-[var(--color-accent)] transition-colors">
            {product.name}
          </h3>
          <div className="mt-auto flex items-baseline gap-2 pt-1">
            <span className="text-base font-semibold tabular-nums">
              {formatPrice(product.price, locale)} {currencyLabel}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-[var(--color-muted)] line-through tabular-nums">
                {formatPrice(product.compareAtPrice, locale)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

export function ProductGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

function productListKey(product: ProductListItem, index: number): string {
  return product.id || product.slug || `product-${index}`;
}

/** Client-side grid mapping — keeps React keys when used from Server Components. */
export function ProductGridList({
  products,
  locale,
  currencyLabel,
  className,
  showAddToCart,
  priorityCount = 4,
  badge,
}: {
  products: ProductListItem[];
  locale: string;
  currencyLabel: string;
  className?: string;
  showAddToCart?: boolean;
  priorityCount?: number;
  badge?: string;
}) {
  return (
    <ProductGrid className={className}>
      {products.map((product, i) => (
        <ProductCard
          key={productListKey(product, i)}
          product={product}
          locale={locale}
          currencyLabel={currencyLabel}
          showAddToCart={showAddToCart}
          priority={i < priorityCount}
          badge={badge}
        />
      ))}
    </ProductGrid>
  );
}
