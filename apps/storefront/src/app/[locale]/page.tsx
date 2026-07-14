import { getTranslations } from 'next-intl/server';
import { StoreShell } from '@/components/layout/store-shell';
import { HeroBanner } from '@/components/commerce/home/hero-banner';
import { CategoryStrip } from '@/components/commerce/home/category-strip';
import { ProductShowcase } from '@/components/commerce/home/product-showcase';
import { BrandsStrip } from '@/components/commerce/home/brands-strip';
import { PromotionBanners } from '@/components/commerce/home/promotion-banners';
import { NewsletterSignup } from '@/components/commerce/home/newsletter-signup';
import { StoreReviews } from '@/components/cro/store-reviews';
import {
  fetchProducts,
  fetchCategories,
  fetchBrands,
  getRecommendedProducts,
  recommendedToListItem,
  type ProductListItem,
} from '@/lib/api';

const EMPTY_PAGE = {
  items: [] as ProductListItem[],
  pagination: { page: 1, pageSize: 12, total: 0, totalPages: 0 },
};

function pickUnique(products: ProductListItem[], limit: number): ProductListItem[] {
  const seen = new Set<string>();
  const out: ProductListItem[] = [];
  for (const p of products) {
    const dedupeKey = p.id || p.slug;
    if (dedupeKey && seen.has(dedupeKey)) continue;
    if (dedupeKey) seen.add(dedupeKey);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

export const revalidate = 60;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const [categories, brands, featured, newArrivals, catalog, recommended] = await Promise.all([
    fetchCategories(locale).catch(() => []),
    fetchBrands().catch(() => []),
    fetchProducts(locale, { featured: 'true', pageSize: '12' }).catch(() => EMPTY_PAGE),
    fetchProducts(locale, { sortBy: 'createdAt', sortOrder: 'desc', pageSize: '12' }).catch(() => EMPTY_PAGE),
    fetchProducts(locale, { pageSize: '24' }).catch(() => EMPTY_PAGE),
    getRecommendedProducts(locale).catch(() => []),
  ]);

  const catalogItems = catalog.items;
  const flashSale = pickUnique(
    catalogItems.filter((p) => p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price)),
    12,
  );
  const featuredProducts = pickUnique(featured.items.length > 0 ? featured.items : catalogItems, 12);
  const bestSellers = pickUnique(
    featured.items.length >= 4 ? featured.items : catalogItems,
    12,
  );
  const newProducts = pickUnique(newArrivals.items.length > 0 ? newArrivals.items : catalogItems, 12);
  const recommendedProducts = pickUnique(recommended.map(recommendedToListItem), 8);

  const spotlight = featuredProducts[0] ?? catalogItems[0] ?? null;
  const currency = t('common.currency');
  const viewAll = t('nav.viewAll');

  return (
    <StoreShell locale={locale}>
      {/* Sticky header + search + mega menu live in StoreShell */}

      <HeroBanner
        locale={locale}
        currencyLabel={currency}
        headline={t('home.hero')}
        subtitle={t('home.subtitle')}
        badge={t('home.badge')}
        shopNow={t('home.shopNow')}
        trackOrder={t('nav.trackOrder')}
        spotlightLabel={t('home.spotlight')}
        favoritesLabel={t('nav.favorites')}
        spotlight={spotlight}
      />

      <CategoryStrip
        categories={categories}
        locale={locale}
        title={t('home.categories')}
        viewAll={viewAll}
      />

      <ProductShowcase
        id="flash-sale"
        title={t('home.flashSale')}
        subtitle={t('home.flashSaleSubtitle')}
        products={flashSale}
        locale={locale}
        currencyLabel={currency}
        viewAllHref="/products"
        viewAllLabel={viewAll}
        emptyLabel={t('home.flashSaleEmpty')}
        badge={t('home.sale')}
        variant="accent"
        priorityCount={4}
      />

      <ProductShowcase
        id="featured"
        title={t('home.featuredProducts')}
        subtitle={t('home.featuredSubtitle')}
        products={featuredProducts}
        locale={locale}
        currencyLabel={currency}
        viewAllLabel={viewAll}
        emptyLabel={t('home.sectionEmpty')}
      />

      <ProductShowcase
        id="best-sellers"
        title={t('home.bestSellers')}
        subtitle={t('home.bestSellersSubtitle')}
        products={bestSellers}
        locale={locale}
        currencyLabel={currency}
        viewAllLabel={viewAll}
        emptyLabel={t('home.sectionEmpty')}
        variant="muted"
      />

      <ProductShowcase
        id="new-arrivals"
        title={t('home.newArrivals')}
        subtitle={t('home.newArrivalsSubtitle')}
        products={newProducts}
        locale={locale}
        currencyLabel={currency}
        viewAllHref="/products?sort=new"
        viewAllLabel={viewAll}
        emptyLabel={t('home.sectionEmpty')}
      />

      <BrandsStrip brands={brands} title={t('home.brands')} viewAll={viewAll} />

      <PromotionBanners
        title={t('home.promotions')}
        items={[
          {
            key: 'cod',
            title: t('home.promoCodTitle'),
            desc: t('home.promoCodDesc'),
            href: '/products',
            icon: 'shipping',
          },
          {
            key: 'sale',
            title: t('home.promoSaleTitle'),
            desc: t('home.promoSaleDesc'),
            href: '/products',
            icon: 'sale',
          },
          {
            key: 'new',
            title: t('home.promoNewTitle'),
            desc: t('home.promoNewDesc'),
            href: '/products',
            icon: 'new',
          },
        ]}
      />

      <ProductShowcase
        id="catalog"
        title={t('home.browseCatalog')}
        subtitle={t('home.browseCatalogSubtitle')}
        products={pickUnique(catalogItems, 24)}
        locale={locale}
        currencyLabel={currency}
        viewAllHref="/products"
        viewAllLabel={viewAll}
        emptyLabel={t('home.sectionEmpty')}
        variant="muted"
      />

      <ProductShowcase
        id="recommended"
        title={t('home.recommended')}
        subtitle={t('home.recommendedSubtitle')}
        products={recommendedProducts}
        locale={locale}
        currencyLabel={currency}
        viewAllLabel={viewAll}
        emptyLabel={t('home.sectionEmpty')}
        variant="muted"
      />

      <section className="container-store py-10 md:py-14">
        <StoreReviews />
      </section>

      <NewsletterSignup
        locale={locale}
        title={t('home.newsletterTitle')}
        subtitle={t('home.newsletterSubtitle')}
        placeholder={t('home.newsletterPlaceholder')}
        submitLabel={t('home.newsletterSubmit')}
        successMessage={t('home.newsletterSuccess')}
        errorMessage={t('home.newsletterError')}
        privacyNote={t('home.newsletterPrivacy')}
      />

      {/* Footer + trust badges in StoreShell */}
    </StoreShell>
  );
}
