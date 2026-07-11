# HASAN SHOP — SEO Report

**Report date:** 2026-07-10  
**Target market:** Algeria (Arabic primary, French secondary)  
**SEO score:** **45 / 100** (RC1 target: **80**)

---

## Executive summary

HASAN SHOP has basic metadata infrastructure (Next.js `generateMetadata`, per-product SEO fields, hreflang alternates) but is **not search-engine ready** for production launch. Critical assets (`sitemap.xml`, `robots.txt`, favicon) are missing. Most pages lack unique metadata. Admin-configurable SEO settings exist in the database but are not consumed by the storefront.

**RC1 blockers (LB-8):** sitemap, robots, favicon, production `NEXT_PUBLIC_APP_URL`.

---

## Technical SEO

### Present ✅

| Feature | Location | Notes |
|---------|----------|-------|
| Title template | `apps/storefront/src/app/[locale]/layout.tsx` | `%s \| HASAN SHOP` |
| Default description | Same | From i18n `meta.description` |
| `metadataBase` | Same | Uses `NEXT_PUBLIC_APP_URL` |
| hreflang alternates | Same | `/ar`, `/fr` |
| OpenGraph locale | Same | `ar_DZ` / `fr_DZ` |
| Per-product metadata | `products/[slug]/page.tsx` | `metaTitle`, `metaDescription` from catalog |
| Per-category metadata | `categories/[slug]/page.tsx` | Category name + description |
| Locale-prefixed URLs | `middleware.ts` | Always `/ar/...` or `/fr/...` |
| Admin noindex | `apps/admin/src/app/layout.tsx` | Correct |

### Missing ❌ (launch blockers)

| Feature | Impact | Priority |
|---------|--------|----------|
| `sitemap.ts` / `sitemap.xml` | Crawlers cannot discover product/category URLs efficiently | **P0** |
| `robots.ts` / `robots.txt` | No crawl directives for storefront | **P0** |
| `public/favicon.ico` | No brand icon in SERPs/tabs | **P0** |
| `apple-touch-icon` | Poor mobile bookmark experience | P1 |
| Canonical URLs per page | Duplicate content risk across locales/query params | P1 |
| `NEXT_PUBLIC_APP_URL` in production | Broken `metadataBase` defaults to localhost | **P0** |

---

## On-page SEO by route

| Route | Unique title | Unique description | OG image | JSON-LD | Score |
|-------|-------------|-------------------|----------|---------|-------|
| `/[locale]` (home) | ⬜ Generic | ⬜ Generic | ❌ | ❌ | 30 |
| `/[locale]/products` | ⬜ Generic | ⬜ Generic | ❌ | ❌ | 30 |
| `/[locale]/products/[slug]` | ✅ | ✅ | ❌ | ❌ | 65 |
| `/[locale]/categories/[slug]` | ✅ | ✅ | ❌ | ❌ | 60 |
| `/[locale]/cart` | ⬜ Generic | ⬜ Generic | ❌ | ❌ | 20 |
| `/[locale]/checkout` | ⬜ Generic | ⬜ noindex recommended | ❌ | ❌ | 15 |
| `/[locale]/track` | ⬜ Generic | ⬜ | ❌ | ❌ | 25 |
| `/[locale]/favorites` | ⬜ Generic | ⬜ noindex recommended | ❌ | ❌ | 20 |
| `/[locale]/checkout/success` | ⬜ | ⬜ noindex recommended | ❌ | ❌ | 15 |

**Recommendation:** Add `robots: { index: false }` on cart, checkout, favorites, success, and track pages.

---

## Content SEO

| Factor | Status | Notes |
|--------|--------|-------|
| Arabic content quality | ✅ | Native UI strings in `messages/ar.json` |
| French content quality | ✅ | Parity with Arabic (95 keys) |
| Product descriptions | 🔄 | Depends on seed/catalog data |
| Category descriptions | 🔄 | From database |
| Homepage content depth | ⚠️ | Thin — no featured products section |
| Blog / content marketing | ❌ | Not planned for v1.0 |
| Internal linking | 🔄 | Nav links only; no breadcrumbs |
| Search functionality | ❌ | Backend search exists; no UI |

### Unused SEO potential

Admin store settings define keys (`seo_title_ar`, `seo_description_fr`, etc.) in `packages/shared/src/constants/index.ts` but the storefront **does not fetch or apply** them. Planned for v1.2.0.

---

## International SEO

| Feature | Status |
|---------|--------|
| hreflang tags | ✅ Root layout only |
| Per-page hreflang | ❌ PDP/category should include self-referencing alternates |
| `lang` attribute | ✅ |
| RTL support | ✅ Arabic |
| Geo targeting | 🔄 No `geo.region` meta; Algeria implied by content |
| Currency display | ✅ DZD formatting |

---

## Structured data (JSON-LD)

| Schema | Status | Priority |
|--------|--------|----------|
| `Organization` | ❌ | P1 |
| `WebSite` + `SearchAction` | ❌ | P2 |
| `Product` | ❌ | P1 — rich results for PDP |
| `BreadcrumbList` | ❌ | P2 |
| `Offer` (price, availability) | ❌ | P1 — with Product schema |

**Example target (PDP):**

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "...",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "DZD",
    "price": "..."
  }
}
```

---

## Social / Open Graph

| Platform | Status |
|----------|--------|
| Open Graph title/description | ✅ PDP + category |
| Open Graph image | ❌ All pages |
| Open Graph url | 🔄 Layout only |
| Twitter Card | ❌ |
| WhatsApp link previews | ❌ Depends on OG image |

---

## Crawlability

| Check | Status |
|-------|--------|
| Server-rendered product pages | ✅ Next.js SSR/SSG |
| Client-only content in cart/checkout | ✅ Correctly noindex candidates |
| Pagination (`?page=`) | 🔄 Accepted but no UI — orphan pages possible |
| Search (`?q=`) | 🔄 Works but no UI — thin query pages |
| 404 handling | 🔄 Default Next.js |
| Redirect `/` → `/ar` | ✅ |

---

## Performance impact on SEO

See [CORE_WEB_VITALS_REPORT.md](./CORE_WEB_VITALS_REPORT.md). Poor LCP on Arabic pages (missing font) indirectly hurts search rankings.

---

## Remediation plan

### RC1 (required)

| # | Task | File |
|---|------|------|
| 1 | Add `apps/storefront/src/app/sitemap.ts` | Dynamic: products + categories + static |
| 2 | Add `apps/storefront/src/app/robots.ts` | Allow storefront; disallow `/checkout`, `/cart` |
| 3 | Add `apps/storefront/public/favicon.ico` | Brand asset |
| 4 | Set `NEXT_PUBLIC_APP_URL` in production CI/build | `.env.example`, deploy docs |
| 5 | `noindex` on cart, checkout, track, favorites, success | Respective `page.tsx` metadata |

### v1.1.0

| # | Task |
|---|------|
| 6 | Page-specific metadata for home, products list |
| 7 | Breadcrumbs on PDP and category |
| 8 | OG images (dynamic or static per locale) |
| 9 | Product JSON-LD on PDP |

### v1.2.0

| # | Task |
|---|------|
| 10 | Wire admin SEO settings to storefront metadata |
| 11 | `WebSite` + `SearchAction` schema when search UI ships |
| 12 | Google Search Console setup + monitoring |

---

## Score breakdown

| Area | Score | Weight |
|------|-------|--------|
| Technical SEO | 35 | 30% |
| On-page SEO | 50 | 25% |
| Content | 55 | 20% |
| International | 60 | 15% |
| Structured data | 10 | 10% |
| **Weighted** | **45** | |

---

## Related documents

- [CORE_WEB_VITALS_REPORT.md](./CORE_WEB_VITALS_REPORT.md) — performance SEO factor
- [RELEASE_SCORE.md](./RELEASE_SCORE.md) — SEO category
- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) — LB-8
