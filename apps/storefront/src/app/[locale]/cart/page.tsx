import { getTranslations } from 'next-intl/server';
import { StoreShell } from '@/components/layout/store-shell';
import { CartPageClient } from '@/components/commerce/cart-page-client';

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <StoreShell locale={locale}>
      <div className="container-store py-8 md:py-12">
        <h1 className="text-display text-3xl md:text-4xl mb-8">{t('cart.title')}</h1>
        <CartPageClient locale={locale} />
      </div>
    </StoreShell>
  );
}
