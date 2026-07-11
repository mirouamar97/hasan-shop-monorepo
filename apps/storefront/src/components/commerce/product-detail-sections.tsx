'use client';

import { useProductVariant } from '@/components/commerce/product-variant-context';
import { ProductDetailClient } from '@/components/commerce/product-detail-client';
import type { ProductListItem, RecentlyViewedItem } from '@/lib/api';

interface ProductDetailSectionsProps {
  locale: string;
  currencyLabel: string;
  productId: string;
  inStock: boolean;
  description?: string | null;
  descriptionTitle: string;
  relatedProducts: ProductListItem[];
  fbtProducts: ProductListItem[];
  recentlyViewed: RecentlyViewedItem[];
}

export function ProductDetailSections({
  locale,
  currencyLabel,
  productId,
  inStock,
  description,
  descriptionTitle,
  relatedProducts,
  fbtProducts,
  recentlyViewed,
}: ProductDetailSectionsProps) {
  const { selectedVariant, displayPrice } = useProductVariant();

  return (
    <>
      {description && (
        <section className="mt-16 max-w-3xl">
          <h2 className="text-display text-xl mb-4">{descriptionTitle}</h2>
          <div className="prose-store">
            <p>{description}</p>
          </div>
        </section>
      )}

      <ProductDetailClient
        locale={locale}
        currencyLabel={currencyLabel}
        productId={productId}
        variantId={selectedVariant?.id}
        price={displayPrice}
        inStock={inStock}
        relatedProducts={relatedProducts}
        fbtProducts={fbtProducts}
        recentlyViewed={recentlyViewed}
      />
    </>
  );
}
