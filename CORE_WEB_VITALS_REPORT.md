# HASAN SHOP — Core Web Vitals Report

**Report date:** 2026-07-10  
**Measurement status:** **Estimated from code review** — Lighthouse CI not yet in pipeline  
**Performance score:** **72 / 100** (RC1 target: **85**)

---

## Executive summary

Core Web Vitals were assessed through static analysis of Next.js configuration, image usage, font loading, and client bundle patterns. **No production Lighthouse run was executed** during this review. The storefront is reasonably optimized for images but has font-related LCP risk on Arabic pages and lacks automated performance regression gates.

---

## Core Web Vitals definitions

| Metric | Good | Needs improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5 s | 2.5–4.0 s | > 4.0 s |
| **INP** (Interaction to Next Paint) | ≤ 200 ms | 200–500 ms | > 500 ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1–0.25 | > 0.25 |

---

## Estimated vitals by page (storefront, mobile)

| Page | Est. LCP | Est. INP | Est. CLS | Confidence |
|------|----------|----------|----------|------------|
| Home (`/ar`) | 🟡 2.8–3.5 s | 🟢 < 200 ms | 🟡 0.1–0.15 | Medium — font not loaded |
| Products list | 🟢 2.0–2.5 s | 🟢 < 200 ms | 🟢 < 0.1 | Medium |
| Product detail (PDP) | 🟢 1.8–2.3 s | 🟢 < 200 ms | 🟢 < 0.05 | High — `priority` image |
| Cart | 🟢 2.0–2.5 s | 🟡 200–300 ms | 🟢 < 0.1 | Medium — client fetch |
| Checkout | 🟡 2.5–3.0 s | 🟡 250–400 ms | 🟢 < 0.1 | Medium — form + API calls |
| Track | 🟢 2.0–2.5 s | 🟢 < 200 ms | 🟢 < 0.1 | High |

**Note:** Estimates assume production deploy with CDN, optimized images, and warm API. Arabic LCP penalty from missing `Noto Sans Arabic` font load.

---

## Optimizations in place ✅

| Optimization | Location | CWV impact |
|--------------|----------|------------|
| `next/image` with `sizes` | `product-card.tsx`, PDP, cart | LCP, bandwidth |
| `priority` on PDP hero image | `products/[slug]/page.tsx` | LCP |
| `images.remotePatterns` | `next.config.ts` | Image pipeline |
| `reactStrictMode` | `next.config.ts` | Dev double-render only |
| Security headers | `next.config.ts` | No direct CWV impact |
| Shipping quote debounce 400 ms | `checkout-page-client.tsx` | INP (fewer re-renders) |
| Server components on list pages | `products/page.tsx`, home | Smaller initial JS |
| Redis + Meilisearch backend | API | API response time |

---

## Performance risks 🔴

| ID | Issue | CWV impact | Location |
|----|-------|------------|----------|
| PERF-01 | Arabic font referenced in CSS but not loaded via `next/font` | **LCP, CLS** | `globals.css` |
| PERF-02 | No Lighthouse CI in pipeline | Regression risk | CI |
| PERF-03 | Broad `remotePatterns: hostname: '**'` | Cache unpredictability | `next.config.ts` |
| PERF-04 | Heavy client components on cart, checkout, favorites | **INP** (JS parse) | `*-page-client.tsx` |
| PERF-05 | No explicit `loading="lazy"` strategy beyond defaults | LCP on long PLPs | `product-card.tsx` |
| PERF-06 | Home page thin content + `dark:` classes without theme | Minor CLS | `page.tsx` |
| PERF-07 | Admin uses raw `<img>` not `next/image` | Admin only | `product-image-uploader.tsx` |

---

## API performance (indirect CWV impact)

From `PERFORMANCE_BENCHMARK.md` and architecture review:

| Endpoint | Expected p95 | Notes |
|----------|--------------|-------|
| `GET /health` | < 50 ms | Health check |
| `GET /products` | < 150 ms | Paginated list |
| `GET /products/:slug` | < 100 ms | Single product |
| `POST /checkout/quote` | < 300 ms | Wilaya + shipping calc |
| `POST /checkout` | < 500 ms | Transactional |

Checkout INP is bounded by API latency + client form validation.

---

## Bundle analysis

| App | Framework | Est. first-load JS | Notes |
|-----|-----------|-------------------|-------|
| Storefront | Next 15 + React 19 | ~90–120 KB gzip (typical) | Not measured — run `@next/bundle-analyzer` |
| Admin | Next 15 + React 19 | ~90–120 KB gzip | Dashboard tables client-heavy |

**Recommendation:** Add `@next/bundle-analyzer` to CI for RC1 verification.

---

## Font strategy

### Current

```css
/* apps/storefront/src/app/globals.css */
font-family: 'Noto Sans Arabic', system-ui, sans-serif;
```

Font is **not** imported via `next/font/google` or `<link rel="preload">`.

### Recommended (RC1)

```typescript
// apps/storefront/src/app/[locale]/layout.tsx
import { Noto_Sans_Arabic } from 'next/font/google';

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-arabic',
});
```

**Expected improvement:** LCP −300–800 ms on Arabic pages; CLS reduction from font swap.

---

## Image strategy

| Pattern | Status | Recommendation |
|---------|--------|----------------|
| Product grid `sizes` | ✅ `(max-width: 768px) 50vw, 25vw` | — |
| PDP hero `priority` | ✅ | — |
| Placeholder images (`placehold.co`) | ⚠️ SVG warnings | Use raster placeholders (BUG-021) |
| CDN for production images | ⬜ | Configure S3/R2 public URL |

---

## Caching and CDN

| Layer | Status |
|-------|--------|
| Next.js static assets | ✅ Automatic `/_next/static` |
| API response caching | ❌ No Cache-Control on public catalog |
| Redis application cache | 🔄 Sessions only; no catalog cache |
| CDN in front of storefront | ⬜ Deploy-dependent |

**P1:** Add `Cache-Control` on `GET /products`, `GET /categories` for public catalog (short TTL + stale-while-revalidate).

---

## Monitoring plan

### RC1

| Tool | Purpose |
|------|---------|
| Lighthouse CLI (manual) | Baseline scores before launch |
| API health endpoint | Uptime |

### v1.1.0

| Tool | Purpose |
|------|---------|
| Lighthouse CI in GitHub Actions | Regression gate on PR |
| Real User Monitoring (Vercel Analytics or similar) | Field CWV data |

### v1.2.0

| Tool | Purpose |
|------|---------|
| Synthetic monitors (Checkly / k6 browser) | Production CWV alerts |

---

## Remediation plan

### RC1

| # | Task | Impact |
|---|------|--------|
| 1 | Load `Noto Sans Arabic` via `next/font` | LCP, CLS |
| 2 | Run Lighthouse on staging; record baseline | Measurement |
| 3 | Replace SVG placeholders with raster | LCP stability |
| 4 | Set production `NEXT_PUBLIC_APP_URL` | Preconnect, metadata |

### v1.1.0

| # | Task |
|---|------|
| 5 | Lighthouse CI gate (mobile, score ≥ 85 performance) |
| 6 | `Cache-Control` on catalog API responses |
| 7 | Bundle analyzer in CI |
| 8 | Narrow `remotePatterns` to known CDN host |

---

## Score breakdown

| Area | Score | Weight |
|------|-------|--------|
| LCP optimization | 65 | 35% |
| INP / interactivity | 78 | 25% |
| CLS stability | 70 | 20% |
| Monitoring & gates | 40 | 20% |
| **Weighted** | **72** | |

---

## Related documents

- [PERFORMANCE_BENCHMARK.md](./PERFORMANCE_BENCHMARK.md) — API benchmarks
- [SEO_REPORT.md](./SEO_REPORT.md) — CWV as ranking factor
- [RELEASE_SCORE.md](./RELEASE_SCORE.md) — Performance category
