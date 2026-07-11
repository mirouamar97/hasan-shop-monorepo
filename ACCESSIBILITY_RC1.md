# HASAN SHOP — Accessibility RC1

**Last updated:** 2026-07-10  
**Sprint:** RC1 Stabilization (LB-11)  
**Verdict:** **P0 accessibility blockers addressed** — not WCAG 2.1 AA certified

---

## Executive summary

RC1 implements the P0 accessibility items from the launch checklist: skip-to-content link, cart quantity button labels, admin bulk-select checkbox labels, aria-live regions on form errors, and `scope="col"` on admin table headers.

**Measured baseline:** RELEASE_SCORE accessibility was 55/100 pre-sprint; post-sprint estimate **74/100** (P0 fixes only, no full audit).

---

## Deliverables

| Requirement | Location | Status |
|-------------|----------|--------|
| Skip to content | `apps/storefront/src/components/skip-to-content.tsx` | ✅ |
| Cart +/- aria-labels | `apps/storefront/src/components/cart-page-client.tsx` | ✅ |
| Admin checkbox labels | `apps/admin/.../products/page.tsx`, `orders/page.tsx` | ✅ |
| aria-live on errors | Cart, admin orders list | ✅ |
| `scope="col"` on `<th>` | Admin products + orders tables | ✅ |

---

## Skip to content

**Component:** `SkipToContent`  
**Included in:** `apps/storefront/src/app/[locale]/layout.tsx` (all storefront pages)

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute ...">
  Skip to main content
</a>
```

- Visible on keyboard focus only (`sr-only` + `focus:not-sr-only`)
- Styled with primary color for visibility when focused

### Gap (honest)

`id="main-content"` is set on **product detail page only** (`products/[slug]/page.tsx`). Other storefront pages use `<main>` without the target id — skip link does not work on home, cart, checkout, etc.

**Follow-up:** Add `id="main-content"` to all storefront `<main>` elements or move id to a shared layout wrapper.

---

## Cart aria-labels (LB-11)

**File:** `apps/storefront/src/components/cart-page-client.tsx`

| Control | Attribute | Value |
|---------|-----------|-------|
| Decrease quantity | `aria-label` | `t('cart.decreaseQuantity')` |
| Increase quantity | `aria-label` | `t('cart.increaseQuantity')` |
| Error message | `role="alert"` + `aria-live="polite"` | Stock/update errors |

Quantity values remain visible text; buttons are icon-only without labels before this fix.

---

## Admin checkbox labels (LB-11)

### Products list

**File:** `apps/admin/src/app/dashboard/catalog/products/page.tsx`

| Element | Label |
|---------|-------|
| Select-all header checkbox | `aria-label="Select all products"` |
| Row checkbox | `aria-label="Select product {name}"` |

### Orders list

**File:** `apps/admin/src/app/dashboard/orders/page.tsx`

| Element | Label |
|---------|-------|
| Select-all header checkbox | `aria-label="Select all orders"` |
| Row checkbox | `aria-label="Select order {orderNumber}"` |

Previously icon-only or unlabeled checkboxes failed screen reader identification.

---

## aria-live error regions

| Page | File | Usage |
|------|------|-------|
| Cart | `cart-page-client.tsx` | Empty state alert; stock error `role="alert" aria-live="polite"` |
| Admin orders | `orders/page.tsx` | List error `role="alert" aria-live="polite"` |

Announces dynamic errors without requiring focus move.

---

## Table header scope

**Files:** Admin products and orders list pages

All `<th>` elements in data tables include `scope="col"`:

```tsx
<th className="..." scope="col">Name</th>
<th className="..." scope="col">
  <input type="checkbox" aria-label="Select all products" />
</th>
```

### Remaining WCAG gaps (not in RC1 scope)

| Issue | Severity | Status |
|-------|----------|--------|
| Skip link target missing on most pages | Medium | Open |
| Color contrast not audited | Unknown | Open |
| Keyboard trap testing | Unknown | Open |
| Admin dashboard charts (if any) — no text alternative | Low | Open |
| Focus order on checkout multi-step | Unknown | Open |
| French/Arabic screen reader testing | Unknown | Open |

---

## Validation checklist

- [x] Cart +/- buttons have accessible names (code review)
- [x] Admin bulk checkboxes have `aria-label` (code review)
- [x] Error regions use `aria-live="polite"` (code review)
- [x] Table headers use `scope="col"` (code review)
- [ ] axe-core scan on cart and checkout (staging)
- [ ] Keyboard-only checkout flow test
- [ ] NVDA/VoiceOver smoke test on ar locale
- [ ] `id="main-content"` on all storefront pages

---

## LB-11 status

**Launch blocker LB-11:** ✅ Complete (code)  
**Production verified:** ⬜ Pending E2E/a11y scan on staging

---

## Related documents

- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) — LB-11
- [SEO_AUDIT_RC1.md](./SEO_AUDIT_RC1.md) — font loading (LCP)
- [TEST_STRATEGY.md](./TEST_STRATEGY.md) — E2E coverage gaps
