import { getTranslations } from 'next-intl/server';
import { StoreShell } from '@/components/layout/store-shell';
import { TrackPageClient } from '@/components/commerce/track-page-client';

export default async function TrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ orderNumber?: string }>;
}) {
  const { locale } = await params;
  const { orderNumber } = await searchParams;
  const t = await getTranslations({ locale });

  return (
    <StoreShell locale={locale}>
      <div className="container-store py-8 md:py-12">
        <h1 className="text-display text-3xl md:text-4xl mb-8 text-center">{t('track.title')}</h1>
        <p className="mb-10 text-center text-[var(--color-muted)] max-w-lg mx-auto">{t('track.subtitle')}</p>
        <TrackPageClient locale={locale} initialOrderNumber={orderNumber} />
      </div>
    </StoreShell>
  );
}
