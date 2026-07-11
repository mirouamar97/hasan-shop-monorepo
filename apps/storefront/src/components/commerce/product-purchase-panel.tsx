'use client';

import { useTranslations } from 'next-intl';
import { ProductVariantPicker } from '@/components/commerce/product-variant-picker';
import { ProductDetailActions } from '@/components/commerce/product-detail-actions';
import { TrustBadges } from '@/components/cro/trust-badges';
import { useProductVariant } from '@/components/commerce/product-variant-context';

interface ProductPurchasePanelProps {
  locale: string;
  currencyLabel: string;
  productId: string;
  productName: string;
  inStock: boolean;
}

export function ProductPurchasePanel({
  locale,
  currencyLabel,
  productId,
  productName,
  inStock,
}: ProductPurchasePanelProps) {
  const t = useTranslations();
  const { variants, selectedVariant, setSelectedVariantId, displayPrice } = useProductVariant();

  return (
    <>
      {variants.length > 1 && (
        <div className="mb-6">
          <ProductVariantPicker
            variants={variants}
            selectedId={selectedVariant?.id}
            onChange={setSelectedVariantId}
            label={t('products.selectVariant')}
          />
        </div>
      )}

      <ProductDetailActions
        productId={productId}
        variantId={selectedVariant?.id}
        price={displayPrice}
        inStock={inStock}
        locale={locale}
        currencyLabel={currencyLabel}
        productName={productName}
      />

      <div className="mt-10 border-t border-[var(--color-border)] pt-8">
        <TrustBadges variant="grid" />
      </div>
    </>
  );
}
