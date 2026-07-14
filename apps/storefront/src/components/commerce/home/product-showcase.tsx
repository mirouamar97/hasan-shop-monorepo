import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { ProductGridList } from '@/components/commerce/product-card';
import type { ProductListItem } from '@/lib/api';
import { LinkButton } from '@/components/ui/link-button';

interface ProductShowcaseProps {
  id: string;
  title: string;
  subtitle?: string;
  products: ProductListItem[];
  locale: string;
  currencyLabel: string;
  viewAllHref?: string;
  viewAllLabel: string;
  emptyLabel: string;
  badge?: string;
  variant?: 'default' | 'muted' | 'accent';
  priorityCount?: number;
}

export function ProductShowcase({
  id,
  title,
  subtitle,
  products,
  locale,
  currencyLabel,
  viewAllHref = '/products',
  viewAllLabel,
  emptyLabel,
  badge,
  variant = 'default',
  priorityCount = 4,
}: ProductShowcaseProps) {
  const bg =
    variant === 'muted'
      ? 'bg-[var(--color-surface-muted)]'
      : variant === 'accent'
        ? 'bg-[var(--color-accent-soft)]/40'
        : '';

  return (
    <section
      id={id}
      className={`py-8 md:py-10 ${bg}`}
      aria-labelledby={`${id}-heading`}
    >
      <div className="container-store">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id={`${id}-heading`} className="text-display text-xl md:text-2xl">
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p>}
          </div>
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] hover:underline"
          >
            {viewAllLabel}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Link>
        </div>

        {products.length > 0 ? (
          <ProductGridList
            products={products}
            locale={locale}
            currencyLabel={currencyLabel}
            showAddToCart
            priorityCount={priorityCount}
            badge={badge}
          />
        ) : (
          <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
            <p className="text-[var(--color-muted)]">{emptyLabel}</p>
            <LinkButton href="/products" className="mt-4">
              {viewAllLabel}
            </LinkButton>
          </div>
        )}
      </div>
    </section>
  );
}
