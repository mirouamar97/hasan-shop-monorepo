import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { StoreShell } from '@/components/layout/store-shell';
import { ProductCard, ProductGrid } from '@/components/commerce/product-card';
import { EmptyState } from '@/components/ui/section';
import { fetchCategory, fetchProducts } from '@/lib/api';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const category = await fetchCategory(slug, locale);
    return {
      title: category.name,
      description: category.description ?? category.name,
    };
  } catch {
    return { title: slug };
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale });

  let category;
  try {
    category = await fetchCategory(slug, locale);
  } catch {
    notFound();
  }

  const data = await fetchProducts(locale, { categorySlug: slug }).catch(() => ({
    items: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  }));

  return (
    <StoreShell locale={locale}>
      <div className="container-store py-8 md:py-12">
        <h1 className="text-display text-3xl md:text-4xl">{category.name}</h1>
        {category.description && (
          <p className="mt-4 max-w-2xl text-[var(--color-muted)] leading-relaxed">{category.description}</p>
        )}

        {data.items.length === 0 ? (
          <div className="mt-12">
            <EmptyState title={t('products.empty')} description={t('products.emptyDesc')} />
          </div>
        ) : (
          <div className="mt-10">
            <ProductGrid>
              {data.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={locale}
                  currencyLabel={t('common.currency')}
                  showAddToCart
                />
              ))}
            </ProductGrid>
          </div>
        )}
      </div>
    </StoreShell>
  );
}
