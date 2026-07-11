# UI/UX Design System

**Project**: HASAN SHOP  
**Applications**: Storefront (`apps/storefront`), Admin (`apps/admin`)  
**Stack**: Next.js 15, Tailwind CSS 4, next-intl  
**Last Updated**: July 2026

---

## Design Philosophy

HASAN SHOP targets Algerian consumers who shop primarily on mobile, often via social media referrals. The interface must feel **trustworthy**, **fast**, and **familiar** — not like a foreign template.

### Core Principles

1. **Mobile-first** — Design for 360px width; enhance for tablet and desktop
2. **Clarity over decoration** — Price, delivery info, and COD badge are always visible
3. **Bilingual by design** — Arabic and French are first-class, not afterthoughts
4. **Trust signals** — Phone number, WhatsApp, delivery estimates, secure checkout cues
5. **Performance is UX** — Fast LCP, no layout shift, optimized images

---

## Brand Tokens

Configurable via `store_settings`; defaults from seed:

| Token | Default | Usage |
|-------|---------|-------|
| `--color-primary` | `#1a56db` | CTAs, links, active states |
| `--color-secondary` | `#111827` | Headings, body text |
| `--color-accent` | `#f59e0b` | Badges, highlights, sale tags |
| `--color-success` | `#059669` | Delivered, in stock |
| `--color-warning` | `#d97706` | Pending, low stock |
| `--color-error` | `#dc2626` | Errors, refused, out of stock |
| `--color-surface` | `#ffffff` | Cards, modals |
| `--color-background` | `#f9fafb` | Page background |

### Typography

| Role | Arabic | French | Size (mobile) |
|------|--------|--------|---------------|
| Display | Noto Kufi Arabic | Inter | 28–32px |
| Heading 1 | Noto Kufi Arabic | Inter | 24px |
| Heading 2 | Noto Kufi Arabic | Inter | 20px |
| Body | Noto Naskh Arabic | Inter | 16px |
| Caption | Noto Naskh Arabic | Inter | 14px |
| Price | Tabular nums | Tabular nums | 18–24px bold |

**Font loading**: `next/font` with `display: swap` to prevent FOIT.

### Spacing Scale

Tailwind default scale (4px base): `1` = 4px, `2` = 8px, `4` = 16px, `6` = 24px, `8` = 32px.

### Border Radius

| Element | Radius |
|---------|--------|
| Buttons | `rounded-lg` (8px) |
| Cards | `rounded-xl` (12px) |
| Inputs | `rounded-lg` (8px) |
| Images | `rounded-lg` (8px) |
| Avatars | `rounded-full` |

### Shadows

- Cards: `shadow-sm` default, `shadow-md` on hover
- Modals: `shadow-xl`
- Sticky header: `shadow-sm` with backdrop blur

---

## RTL / LTR Support

### Locale Routing

```
/ar/products/cotton-tshirt   → Arabic, RTL
/fr/products/cotton-tshirt   → French, LTR
```

Default redirect: `/` → `/ar` (configurable via `default_locale` setting).

### Implementation

```html
<!-- Set on <html> element -->
<html lang="ar" dir="rtl">
<html lang="fr" dir="ltr">
```

- **next-intl** provides `useLocale()` and message files (`messages/ar.json`, `messages/fr.json`)
- Tailwind logical properties: `ms-4` (margin-inline-start) instead of `ml-4`
- Icons with direction: chevrons, arrows flip in RTL via `rtl:rotate-180`
- Numbers and prices: always LTR within RTL context (`dir="ltr"` on price spans)

### RTL Checklist

- [ ] Navigation order mirrors in RTL
- [ ] Form labels align correctly
- [ ] Breadcrumbs flow right-to-left
- [ ] Modal close button on correct side
- [ ] Toast notifications appear from correct edge
- [ ] Carousel swipe direction feels natural
- [ ] Phone numbers display LTR (`+213 555 12 34 56`)

### Mixed Content

Product names may contain Latin characters in Arabic locale — use `unicode-bidi: plaintext` where needed.

---

## Storefront Layout

### Header

- Logo (left in LTR, right in RTL)
- Search icon → full-screen search overlay on mobile
- Language switcher (AR | FR)
- Cart icon with item count badge
- Sticky on scroll with reduced height

### Homepage Sections

1. Hero banner (promotional)
2. Category grid (icons + labels)
3. Featured products carousel
4. Trust bar: COD, nationwide delivery, WhatsApp support
5. New arrivals grid
6. Footer

### Product Card

```
┌─────────────────────┐
│      [Image]        │
│  ♡ wishlist         │
├─────────────────────┤
│ Product name        │
│ 2,500 DZD  ̶3̶2̶0̶0̶  │
│ ★★★★☆ (24)         │
│ 🚚 2-4 days         │
└─────────────────────┘
```

- Primary image with lazy loading (`loading="lazy"`)
- Sale badge when `compare_at_price` present
- Out-of-stock overlay when inventory = 0

### Product Detail Page

- Image gallery with thumbnails (swipe on mobile)
- Price, variant selector (color swatches, size buttons)
- Stock indicator
- Add to cart (full-width sticky bar on mobile)
- Description tabs: Description | Specifications | Reviews
- Delivery estimate based on default wilaya or geo-detected

### Cart Drawer

- Slide-in from inline-end (right in LTR, left in RTL)
- Line items with quantity stepper
- Coupon input
- Subtotal preview
- "Proceed to checkout" CTA

### Checkout Flow

Single page (not multi-step wizard) for mobile simplicity:

1. Contact: name, phone
2. Delivery: wilaya → commune → address → landmark
3. Delivery type: Home | Stop Desk (with desk selector)
4. Payment: COD selected by default; online options if enabled
5. Order summary sidebar (bottom sheet on mobile)
6. Place order CTA

**COD badge** prominently displayed: "الدفع عند الاستلام" / "Paiement à la livraison"

### Order Tracking

- Enter order number + phone
- Visual timeline: Placed → Confirmed → Shipped → Delivered
- Tracking link to carrier when available

---

## Admin Layout

### Shell

- Collapsible sidebar navigation (icons + labels)
- Top bar: search, notifications (future), user menu
- Breadcrumbs on detail pages
- French-primary UI labels (admin convention in Algeria)

### Data Tables

- Sortable columns
- Row actions menu (⋯)
- Pagination footer
- Empty state with illustration and CTA
- Loading skeleton rows

### Forms

- Label above input
- Inline validation errors (red, below field)
- Required field indicator (*)
- Save / Cancel footer sticky on long forms
- AR/FR tabs for translation fields

---

## Component Library

Shared patterns (implement as React components):

| Component | Variants |
|-----------|----------|
| `Button` | primary, secondary, outline, ghost, danger; sizes sm/md/lg |
| `Input` | text, tel, email, number; with error state |
| `Select` | native on mobile for wilaya/commune; custom on desktop |
| `Badge` | status colors mapped to order/product states |
| `Card` | default, interactive (hover) |
| `Modal` | centered, focus trap, ESC to close |
| `Toast` | success, error, info; auto-dismiss 5s |
| `Skeleton` | text, image, card |
| `Price` | formats DZD with thousands separator |
| `PhoneInput` | Algerian format validation (05/06/07) |

### Price Formatting

```typescript
// DZD display: "2 500 DA" or "2 500 دج"
formatPrice(2500, locale) // locale-aware currency symbol
```

- Always two decimal places in data; display whole DZD unless fils relevant
- Thousand separator: space (fr) or locale-appropriate

---

## Accessibility (WCAG 2.1 AA)

### Target Compliance

Storefront should meet WCAG 2.1 Level AA. Admin dashboard Level A minimum.

### Requirements

| Criterion | Implementation |
|-----------|----------------|
| Color contrast | 4.5:1 text, 3:1 large text and UI components |
| Focus visible | `ring-2 ring-primary ring-offset-2` on all interactive elements |
| Keyboard navigation | Full tab order; skip-to-content link |
| Screen readers | Semantic HTML (`nav`, `main`, `article`); `aria-label` on icons |
| Images | `alt` text required on product images (enforced in admin) |
| Forms | Labels associated with inputs; `aria-describedby` for errors |
| Motion | `prefers-reduced-motion` disables carousels and transitions |
| Touch targets | Minimum 44×44px on mobile |

### Testing

- axe-core in CI for critical pages
- Manual screen reader test (NVDA/VoiceOver) before launch
- Keyboard-only navigation audit

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| `sm` | 640px | 2-column product grid |
| `md` | 768px | Sidebar filters on catalog |
| `lg` | 1024px | 4-column product grid; checkout sidebar |
| `xl` | 1280px | Max content width 1280px centered |

### Mobile-Specific

- Bottom navigation bar (Home, Categories, Search, Cart, Account)
- Thumb-zone CTAs at bottom of screen
- Full-width buttons on checkout
- Native `tel:` links for phone numbers

---

## Imagery Guidelines

| Type | Spec |
|------|------|
| Product hero | 1200×1200px, WebP, < 200KB |
| Thumbnail | 400×400px, WebP |
| Category banner | 1200×400px |
| Logo | SVG preferred; PNG fallback |

- CDN delivery via `S3_PUBLIC_URL`
- `next/image` with responsive `sizes` attribute
- Placeholder blur (LQIP) during load

---

## Motion & Animation

- Page transitions: subtle fade (150ms)
- Cart add: micro-bounce on cart icon
- Skeleton shimmer during data fetch
- Respect `prefers-reduced-motion: reduce`

---

## Empty & Error States

| State | Storefront | Admin |
|-------|------------|-------|
| Empty cart | Illustration + "Continue shopping" CTA | — |
| No search results | Suggestions + popular products | "No results" + clear filters |
| 404 | Friendly message + home link | Back to list |
| API error | Retry button + support WhatsApp link | Toast + retry |
| Out of stock | Notify me (future) + similar products | Low stock badge in list |

---

## i18n Message Structure

```
messages/
├── ar.json
└── fr.json
```

Namespaces:

- `common` — buttons, labels, errors
- `nav` — navigation items
- `product` — product page strings
- `checkout` — checkout flow
- `order` — order status labels
- `seo` — default meta strings

**Rule**: No hardcoded user-facing strings in components. All via `useTranslations()`.

---

## Design Deliverables Checklist

- [x] Brand tokens defined (colors, typography)
- [x] RTL/LTR strategy documented
- [ ] Figma component library (M2)
- [ ] Homepage mockup AR + FR (M2)
- [ ] Checkout flow prototype (M2)
- [ ] Admin order detail mockup (M2)
- [ ] Accessibility audit report (M6)

---

## Related Documents

- [PROJECT.md](./PROJECT.md) — Brand positioning
- [ADMIN.md](./ADMIN.md) — Admin UI modules
- [SRS.md](./SRS.md) — NFR-UX requirements
