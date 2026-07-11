# Homepage — Before / After (Commerce Restoration)

**Date:** 2026-07-10  
**Issue:** v1.1.0 first pass replaced a functional e-commerce homepage with a sparse landing page (UX regression).

## Before (regression)

| Section | Status |
|---------|--------|
| Sticky header | ✅ Present |
| Search | Icon only (overlay) |
| Mega menu | ✅ Present |
| Hero | Large empty gradient, minimal CTAs |
| Categories | Only if API returns data, max 4 |
| Featured products | Only if API returns data |
| Flash sales | Only if discounted featured exist |
| Best sellers | ❌ Missing |
| New arrivals | ❌ Missing |
| Brands | ❌ Missing |
| Promotions | ❌ Missing |
| Product grids | Sparse, conditional |
| Reviews | ✅ Present |
| Trust badges | ✅ Present |
| Newsletter | ❌ Missing |
| Footer | ✅ Present |

**Problem:** Most sections hidden when API empty or filtered; hero dominated viewport with little commerce content.

## After (restored + improved)

| Section | Status |
|---------|--------|
| Sticky header | ✅ Unchanged |
| Search | ✅ Inline bar on desktop + mobile overlay |
| Mega menu | ✅ Unchanged |
| Hero banner | Commerce hero: spotlight product + promo tiles + trust row |
| Categories | ✅ Always rendered; chips (mobile) + 6-card grid (desktop) |
| Flash sales | ✅ Always section; up to 12 products; fallback CTA |
| Featured products | ✅ Up to 12; falls back to catalog |
| Best sellers | ✅ Up to 12; uses featured or catalog |
| New arrivals | ✅ Sorted by `createdAt` desc |
| Brands | ✅ `/brands` API strip |
| Promotions | ✅ 3 promo cards (COD, sales, new) |
| Product grids | ✅ Dense 4-column grids + full catalog (24) |
| Reviews | ✅ Preserved |
| Trust badges | Hero + footer |
| Newsletter | ✅ Email capture (client UI) |
| Footer | ✅ Unchanged |

## Screenshot checklist (run before next major layout change)

1. Start stack: `pnpm --filter @hasan-shop/storefront dev` + API on `:4000`
2. Capture `/ar` at 375px, 768px, 1280px:
   ```bash
   cd e2e && node capture-homepage-screenshots.mjs
   ```
3. Saved captures (2026-07-10):
   - `docs/screenshots/homepage-2026-07-10-375.png`
   - `docs/screenshots/homepage-2026-07-10-768.png`
   - `docs/screenshots/homepage-2026-07-10-1280.png`
4. Compare section count and product card count vs this table before any major layout replacement

## API dependencies (unchanged backend)

- `GET /categories`, `GET /products`, `GET /brands`, `GET /engagement/products/recommended`
- Query params: `featured`, `sortBy=createdAt`, `pageSize`
