import { getTranslations } from 'next-intl/server';
import { StoreShell } from '@/components/layout/store-shell';
import { ProductCard, ProductGridList } from '@/components/commerce/product-card';
import { EmptyState } from '@/components/ui/section';
import { fetchProducts, searchProducts } from '@/lib/api';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { locale } = await params;
  const { page, q } = await searchParams;
  const t = await getTranslations({ locale });

  const data = q
    ? await searchProducts(q, locale)
        .then((r) => ({ items: r.hits, pagination: r.pagination }))
        .catch(() => ({
          items: [],
          pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
        }))
    : await fetchProducts(locale, { page: page ?? '1', pageSize: '20' }).catch(() => ({
        items: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      }));

  return (
    <StoreShell locale={locale}>
      <div className="container-store py-8 md:py-12">
        <h1 className="text-display text-3xl md:text-4xl">
          {q ? t('products.searchResults', { query: q }) : t('nav.products')}
        </h1>
        {q && (
          <p className="mt-2 text-[var(--color-muted)]">
            {data.pagination.total} {t('products.results')}
          </p>
        )}

        {data.items.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title={t('products.empty')}
              description={t('products.emptyDesc')}
              action={
                <Link href="/products">
                  <Button>{t('nav.products')}</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-10">
            <ProductGridList
              products={data.items}
              locale={locale}
              currencyLabel={t('common.currency')}
              showAddToCart
              priorityCount={4}
            />
          </div>
        )}
      </div>
    </StoreShell>
  );
}
