# HASAN SHOP — SEO Audit RC1

**Last updated:** 2026-07-10  
**Sprint:** RC1 Stabilization (LB-8)  
**Verdict:** **Minimum SEO baseline met** — not a full SEO audit; indexing not verified in production

---

## Executive summary

RC1 delivers the P0 SEO minimum: dynamic sitemap, robots rules, favicon, structured data on product pages, Twitter/Open Graph metadata, and Arabic font loading via `next/font` for LCP improvement.

**Gaps:** `id="main-content"` SEO-adjacent a11y only on PDP; cart/checkout included in sitemap (should be noindex); no Lighthouse CI gate; no Search Console verification.

---

## Deliverables

| Asset | Path | Status |
|-------|------|--------|
| Sitemap | `apps/storefront/src/app/sitemap.ts` | ✅ Implemented |
| Robots | `apps/storefront/src/app/robots.ts` | ✅ Implemented |
| Favicon | `apps/storefront/public/favicon.svg` | ✅ Present |
| Product JSON-LD | `apps/storefront/src/components/json-ld.tsx` | ✅ Implemented |
| Breadcrumb JSON-LD | `apps/storefront/src/components/json-ld.tsx` | ✅ Implemented |
| Twitter cards | `layout.tsx`, product `generateMetadata` | ✅ Implemented |
| Arabic font | `apps/storefront/src/app/[locale]/layout.tsx` | ✅ `Noto_Sans_Arabic` via `next/font/google` |

---

## `sitemap.ts`

**Route:** `/sitemap.xml` (Next.js App Router metadata route)

### Data sources

- Fetches product slugs from `GET /api/v1/products?pageSize=500`
- Fetches category slugs from `GET /api/v1/categories`
- Revalidates every 3600s (`next: { revalidate: 3600 }`)
- Falls back to static paths only if API unreachable

### URL coverage

| Pattern | Locales | Priority | Change frequency |
|---------|---------|----------|------------------|
| `/{locale}` | ar, fr | 1.0 | daily |
| `/{locale}/products` | ar, fr | 0.7 | weekly |
| `/{locale}/products/{slug}` | ar, fr | 0.8 | weekly |
| `/{locale}/categories/{slug}` | ar, fr | 0.75 | weekly |
| `/{locale}/cart`, `/checkout`, `/track` | ar, fr | 0.7 | weekly |

### Known issues

1. **Cart and checkout in sitemap** — transactional pages should be excluded (robots disallows them but sitemap still lists them)
2. **API dependency** — sitemap quality depends on API availability at build/request time
3. **`NEXT_PUBLIC_APP_URL`** must be set correctly in production builds or URLs will point to `localhost:3000`

---

## `robots.ts`

**Route:** `/robots.txt`

```typescript
allow: ['/ar/', '/fr/']
disallow: ['/ar/cart', '/fr/cart', '/ar/checkout', '/fr/checkout', ...]
sitemap: `${BASE_URL}/sitemap.xml`
```

- Blocks cart, checkout, and `/api/` from crawling
- References sitemap URL from `NEXT_PUBLIC_APP_URL`

**Validated in:** `scripts/deploy/validate-deployment.sh` (HTTP 200 check)

---

## `favicon.svg`

- **Path:** `apps/storefront/public/favicon.svg`
- **Referenced in:** `layout.tsx` → `icons.icon` and `icons.apple`
- **Validated in:** deploy validation script

---

## Structured data

### `ProductJsonLd`

Rendered on product detail pages (`apps/storefront/src/app/[locale]/products/[slug]/page.tsx`):

- `@type: Product`
- Fields: `name`, `description`, `image`, `sku`, `offers` (price, currency DZD, availability InStock, URL)

### `BreadcrumbJsonLd`

Same page — Home → Products → Product name with `@type: BreadcrumbList`

**Not implemented:** Organization, WebSite, or LocalBusiness schema on homepage.

---

## Twitter cards & Open Graph

### Global (`layout.tsx` `generateMetadata`)

- `openGraph.type`: `website`
- `openGraph.locale`: `ar_DZ` / `fr_DZ`
- `openGraph.siteName`: `HASAN SHOP`
- `twitter.card`: `summary_large_image`
- `metadataBase` from `NEXT_PUBLIC_APP_URL`
- `alternates.languages`: ar, fr

### Product pages (`generateMetadata`)

- Per-product `title`, `description`
- `openGraph`: title, description, type `website`
- `twitter`: `summary_large_image`, title, description

**Gap:** No `twitter:image` or `og:image` per product — uses default/large card without explicit image URL in metadata.

---

## Noto Sans Arabic font

```typescript
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-arabic',
});
```

- Applied via `className={notoSansArabic.variable}` on `<html>`
- **`display: 'swap'`** reduces invisible text during font load (LCP/CLS improvement for `ar` locale)
- Addresses RELEASE_SCORE P0 item: load Arabic font via `next/font`

---

## Validation checklist

- [x] `/sitemap.xml` returns 200 (deploy script)
- [x] `/robots.txt` returns 200 (deploy script)
- [x] `/favicon.svg` returns 200 (deploy script)
- [x] Product page includes JSON-LD scripts (code review)
- [ ] Google Rich Results Test on staging URL
- [ ] Search Console sitemap submission
- [ ] Lighthouse SEO score ≥ 90 on mobile
- [ ] Remove cart/checkout from sitemap
- [ ] Add `og:image` per product

---

## LB-8 status

**Launch blocker LB-8:** ✅ Complete (code) — `sitemap.ts`, `robots.ts`, favicon in `apps/storefront/public/`  
**Production verified:** ⬜ Pending staging deploy

---

## Related documents

- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) — LB-8
- [ACCESSIBILITY_RC1.md](./ACCESSIBILITY_RC1.md) — complementary UX work
- [DEPLOYMENT_VALIDATION.md](./DEPLOYMENT_VALIDATION.md) — SEO asset health checks
