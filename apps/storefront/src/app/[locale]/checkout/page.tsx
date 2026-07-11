import { getTranslations } from 'next-intl/server';
import { StoreShell } from '@/components/layout/store-shell';
import { CheckoutPageClient } from '@/components/commerce/checkout-page-client';

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ productId?: string; variantId?: string; quantity?: string; price?: string }>;
}) {
  const { locale } = await params;
  const { productId, variantId, quantity, price } = await searchParams;
  const t = await getTranslations({ locale });

  return (
    <StoreShell locale={locale}>
      <div className="container-store py-8 md:py-12">
        <h1 className="text-display text-3xl md:text-4xl mb-8">
          {productId ? t('checkout.buyNowTitle') : t('checkout.title')}
        </h1>
        <CheckoutPageClient
          locale={locale}
          buyNowProductId={productId}
          buyNowVariantId={variantId}
          buyNowQuantity={quantity ? Number(quantity) : 1}
          buyNowPrice={price ? Number(price) : 0}
        />
      </div>
    </StoreShell>
  );
}
