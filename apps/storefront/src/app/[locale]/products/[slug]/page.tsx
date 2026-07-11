import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { StoreShell } from '@/components/layout/store-shell';
import { ProductGallery } from '@/components/commerce/product-gallery';
import { ProductVariantProvider } from '@/components/commerce/product-variant-context';
import { ProductPurchasePanel } from '@/components/commerce/product-purchase-panel';
import { ProductDetailSections } from '@/components/commerce/product-detail-sections';
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';
import { fetchProduct, getRelatedProducts, getRecentlyViewed } from '@/lib/api';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const product = await fetchProduct(slug, locale);
    const title = product.translation?.metaTitle ?? product.name;
    const description =
      product.translation?.metaDescription ?? product.shortDescription ?? product.name;
    return {
      title,
      description,
      openGraph: { title, description, type: 'website' },
      twitter: { card: 'summary_large_image', title, description },
    };
  } catch {
    return { title: slug };
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale });

  let product;
  try {
    product = await fetchProduct(slug, locale);
  } catch {
    notFound();
  }

  const [relatedProducts, recentlyViewed] = await Promise.all([
    getRelatedProducts(product.id, locale).catch(() => []),
    getRecentlyViewed().catch(() => []),
  ]);

  const fbtProducts = relatedProducts.slice(0, 3);
  const variantOptions = product.variants.map((v) => ({
    id: v.id,
    name: v.name,
    price: v.price,
  }));

  return (
    <StoreShell locale={locale}>
      <ProductJsonLd
        name={product.name}
        description={product.translation?.metaDescription ?? product.shortDescription ?? undefined}
        image={product.images[0]?.url}
        price={String(product.price)}
        slug={slug}
        locale={locale}
      />
      <BreadcrumbJsonLd
        items={[
          { name: t('nav.home'), href: `/${locale}` },
          { name: t('nav.products'), href: `/${locale}/products` },
          { name: product.name, href: `/${locale}/products/${slug}` },
        ]}
      />

      <ProductVariantProvider variants={variantOptions} basePrice={product.price}>
        <div className="container-store py-8 md:py-12">
          <nav className="mb-8 text-sm text-[var(--color-muted)]" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2">
              <li>{t('nav.home')}</li>
              <li aria-hidden>/</li>
              <li>{t('nav.products')}</li>
              <li aria-hidden>/</li>
              <li className="text-[var(--color-foreground)]">{product.name}</li>
            </ol>
          </nav>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <ProductGallery images={product.images} productName={product.name} />
            <div className="lg:py-4">
              <h1 className="text-display text-3xl md:text-4xl">{product.name}</h1>
              {product.shortDescription && (
                <p className="mt-4 text-[var(--color-muted)] leading-relaxed">{product.shortDescription}</p>
              )}
              <div className="mt-8">
                <ProductPurchasePanel
                  locale={locale}
                  currencyLabel={t('common.currency')}
                  productId={product.id}
                  productName={product.name}
                  inStock={product.inStock}
                />
              </div>
            </div>
          </div>

          <ProductDetailSections
            locale={locale}
            currencyLabel={t('common.currency')}
            productId={product.id}
            inStock={product.inStock}
            description={product.translation?.description}
            descriptionTitle={t('products.description')}
            relatedProducts={relatedProducts}
            fbtProducts={fbtProducts}
            recentlyViewed={recentlyViewed.filter((r) => r.productId !== product.id)}
          />
        </div>
      </ProductVariantProvider>
    </StoreShell>
  );
}
