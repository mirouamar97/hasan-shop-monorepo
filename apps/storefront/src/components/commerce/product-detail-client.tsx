'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { SectionHeader } from '@/components/ui/section';
import { ProductGridList } from '@/components/commerce/product-card';
import { StickyAddToCart } from '@/components/cro/sticky-add-to-cart';
import type { ProductListItem, RecentlyViewedItem } from '@/lib/api';

interface ProductDetailClientProps {
  locale: string;
  currencyLabel: string;
  productId: string;
  variantId?: string;
  price: string;
  inStock: boolean;
  relatedProducts: ProductListItem[];
  fbtProducts: ProductListItem[];
  recentlyViewed: RecentlyViewedItem[];
}

export function ProductDetailClient({
  locale,
  currencyLabel,
  productId,
  variantId,
  price,
  inStock,
  relatedProducts,
  fbtProducts,
  recentlyViewed,
}: ProductDetailClientProps) {
  const t = useTranslations();
  const router = useRouter();

  function handleBuyNow() {
    const params = new URLSearchParams({ productId, quantity: '1', price });
    if (variantId) params.set('variantId', variantId);
    router.push(`/checkout?${params.toString()}`);
  }

  const recentAsProducts: ProductListItem[] = recentlyViewed
    .filter((r) => r.productSlug && r.productName && r.productPrice)
    .map((r) => ({
      id: r.productId,
      sku: '',
      slug: r.productSlug!,
      status: 'active',
      price: r.productPrice!,
      name: r.productName!,
      primaryImage: r.imageUrl ? { url: r.imageUrl, altText: r.productName } : null,
    }));

  return (
    <>
      {fbtProducts.length > 0 && (
        <section className="mt-16 border-t border-[var(--color-border)] pt-16">
          <SectionHeader title={t('products.fbt')} subtitle={t('products.fbtSubtitle')} />
          <ProductGridList
            products={fbtProducts}
            locale={locale}
            currencyLabel={currencyLabel}
            showAddToCart
          />
        </section>
      )}

      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-[var(--color-border)] pt-16">
          <SectionHeader title={t('products.related')} />
          <ProductGridList
            products={relatedProducts}
            locale={locale}
            currencyLabel={currencyLabel}
            showAddToCart
          />
        </section>
      )}

      {recentAsProducts.length > 0 && (
        <section className="mt-16 border-t border-[var(--color-border)] pt-16">
          <SectionHeader title={t('products.recentlyViewed')} />
          <ProductGridList
            products={recentAsProducts}
            locale={locale}
            currencyLabel={currencyLabel}
            showAddToCart
          />
        </section>
      )}

      <StickyAddToCart
        productId={productId}
        variantId={variantId}
        price={price}
        inStock={inStock}
        locale={locale}
        currencyLabel={currencyLabel}
        onBuyNow={handleBuyNow}
      />
    </>
  );
}
