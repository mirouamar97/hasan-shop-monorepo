import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { StoreShell } from '@/components/layout/store-shell';
import { CategoryCard } from '@/components/commerce/category-card';
import { EmptyState } from '@/components/ui/section';
import { fetchCategories } from '@/lib/api';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'categories' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'categories' });

  const categories = await fetchCategories(locale).catch(() => []);

  return (
    <StoreShell locale={locale}>
      <div className="container-store py-8 md:py-12">
        <h1 className="text-display text-3xl md:text-4xl">{t('title')}</h1>
        <p className="mt-3 max-w-2xl text-[var(--color-muted)] leading-relaxed">{t('subtitle')}</p>

        {categories.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title={t('empty')}
              description={t('emptyDesc')}
              action={
                <Link href="/products">
                  <Button>{t('browseProducts')}</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </StoreShell>
  );
}
