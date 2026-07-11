import { getTranslations } from 'next-intl/server';
import { StoreShell } from '@/components/layout/store-shell';
import { FavoritesPageClient } from '@/components/commerce/favorites-page-client';

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <StoreShell locale={locale}>
      <div className="container-store py-8 md:py-12">
        <h1 className="text-display text-3xl md:text-4xl mb-8">{t('favorites.title')}</h1>
        <FavoritesPageClient locale={locale} />
      </div>
    </StoreShell>
  );
}
