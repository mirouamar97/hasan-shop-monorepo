# HASAN SHOP — Accessibility Report

**Report date:** 2026-07-10  
**Standard reference:** WCAG 2.1 Level AA (target)  
**Current estimated conformance:** **Partial — Level A with gaps**  
**Accessibility score:** **55 / 100** (RC1 target: **80**)

---

## Executive summary

The storefront has foundational accessibility (semantic HTML, RTL support, form labels on checkout) but lacks systematic ARIA usage, error announcements, and keyboard-accessible controls in critical flows. The admin dashboard has table accessibility gaps that block efficient screen-reader use.

**RC1 blockers (LB-11):** Cart quantity buttons, admin checkboxes, error `aria-live` regions.

---

## Scope

| Application | Pages reviewed | Locales |
|-------------|----------------|---------|
| Storefront | 10 routes | ar (RTL), fr (LTR) |
| Admin | 14 routes | English only |

---

## Storefront findings

### Strengths ✅

| Feature | Location |
|---------|----------|
| `lang` and `dir` on `<html>` | `apps/storefront/src/app/[locale]/layout.tsx` |
| Semantic landmarks (`header`, `main`, `nav`, `footer`) | Multiple pages |
| Form labels with `htmlFor` / `id` | `checkout-page-client.tsx`, `track-page-client.tsx` |
| Heading hierarchy (h1 on pages) | Product, cart, checkout pages |
| Ordered list for order timeline | `track-page-client.tsx` |
| Favorite button `aria-label` | `product-detail-actions.tsx` |

### Critical issues 🔴 (RC1 blockers)

| ID | Issue | Location | WCAG | Fix |
|----|-------|----------|------|-----|
| A11Y-01 | Cart `+` / `−` buttons have no accessible name | `cart-page-client.tsx` | 4.1.2 Name, Role, Value | Add `aria-label="Increase quantity"` / `aria-label="Decrease quantity"` |
| A11Y-02 | Form errors not announced to screen readers | `checkout-page-client.tsx`, `cart-page-client.tsx`, `track-page-client.tsx` | 4.1.3 Status Messages | Add `role="alert"` or `aria-live="polite"` on error container |
| A11Y-03 | No skip-to-content link | All storefront layouts | 2.4.1 Bypass Blocks | Add skip link as first focusable element |

### High issues 🟠

| ID | Issue | Location | WCAG |
|----|-------|----------|------|
| A11Y-04 | `<nav>` lacks `aria-label` | `store-header.tsx`, inline headers | 1.3.1 |
| A11Y-05 | Delivery type radios not in `<fieldset>` / `<legend>` | `checkout-page-client.tsx` | 1.3.1, 3.3.2 |
| A11Y-06 | Empty `alt` on cart/favorites images when name missing | `cart-page-client.tsx`, `favorites-page-client.tsx` | 1.1.1 |
| A11Y-07 | Decorative `✓` on success page not `aria-hidden` | `checkout/success/page.tsx` | 1.1.1 |
| A11Y-08 | `focus:outline-none` without visible replacement ring | `checkout-page-client.tsx`, `track-page-client.tsx` | 2.4.7 |

### Medium issues 🟡

| ID | Issue | Location |
|----|-------|----------|
| A11Y-09 | Image placeholder `—` has no screen-reader alternative | `product-card.tsx`, `cart-page-client.tsx` |
| A11Y-10 | Only one `aria-*` attribute in entire storefront src | Project-wide |
| A11Y-11 | No `sr-only` utility usage | Project-wide |
| A11Y-12 | Heart icons `♥`/`♡` not i18n (label exists but icon is visual) | `product-detail-actions.tsx` |

---

## Admin findings

### Strengths ✅

| Feature | Location |
|---------|----------|
| Login form labeled inputs | `apps/admin/src/app/page.tsx` |
| Blocks search engine indexing | `layout.tsx` (`robots: noindex`) |
| Semantic table structure | Orders, products, inventory pages |

### Critical issues 🔴 (RC1 blockers)

| ID | Issue | Location | WCAG | Fix |
|----|-------|----------|------|-----|
| A11Y-20 | Table checkboxes lack `aria-label` | `orders/page.tsx`, `catalog/products/page.tsx` | 4.1.2 | `aria-label="Select order {number}"` |
| A11Y-21 | Select-all checkbox lacks label | Same files | 4.1.2 | `aria-label="Select all orders"` |

### High issues 🟠

| ID | Issue | Location | WCAG |
|----|-------|----------|------|
| A11Y-22 | Table headers missing `scope="col"` | All admin tables | 1.3.1 |
| A11Y-23 | Sidebar `<nav>` lacks `aria-label` | `admin-shell.tsx` | 1.3.1 |
| A11Y-24 | Image uploader buttons ("Up", "Down", "Remove") lack `aria-label` | `product-image-uploader.tsx` | 4.1.2 |
| A11Y-25 | Variant editor inputs lack explicit `id`/`htmlFor` | `variant-editor.tsx` | 1.3.1 |
| A11Y-26 | Admin errors not `aria-live` announced | Multiple dashboard pages | 4.1.3 |

### Medium issues 🟡

| ID | Issue | Location |
|----|-------|----------|
| A11Y-27 | `lang="fr"` hardcoded on admin `<html>` | `layout.tsx` |
| A11Y-28 | Destructive actions use `confirm()` only | `catalog/products/page.tsx` |
| A11Y-29 | No keyboard trap management in modals (if added later) | — |

---

## RTL (Arabic) accessibility

| Check | Status |
|-------|--------|
| `dir="rtl"` on Arabic pages | ✅ |
| Logical CSS properties (`ms-`, `me-`) vs physical margins | 🔄 Mixed — review Tailwind classes |
| Arabic font loaded and readable | ⚠️ `Noto Sans Arabic` referenced in CSS but not loaded via `next/font` |
| Screen reader language detection | ✅ via `lang="ar"` |

---

## Keyboard navigation

| Flow | Tab order logical | All actions keyboard-accessible |
|------|-------------------|--------------------------------|
| Storefront browse | ✅ | ✅ |
| Add to cart | ✅ | ✅ |
| Checkout form | ✅ | 🔄 Radio grouping weak |
| Cart quantity change | ✅ | ⚠️ Buttons unlabeled for SR |
| Admin login | ✅ | ✅ |
| Admin tables + bulk actions | 🔄 | ⚠️ Checkboxes unlabeled |

---

## Remediation plan

### RC1 (required)

| Priority | Item | Effort |
|----------|------|--------|
| P0 | A11Y-01, A11Y-02, A11Y-20, A11Y-21 | 2–4 hours |
| P0 | A11Y-03 skip link | 1 hour |

### v1.1.0 (UX release)

| Priority | Item |
|----------|------|
| P1 | A11Y-04 through A11Y-08 |
| P1 | A11Y-22 through A11Y-26 |
| P1 | Load Arabic font via `next/font` |
| P2 | Full WCAG 2.1 AA audit with axe-core in CI |

### Testing approach

```bash
# Manual
# - NVDA/VoiceOver on checkout flow (ar + fr)
# - Keyboard-only navigation admin orders page

# Automated (recommended for v1.1.0)
# - @axe-core/playwright in E2E suite
# - eslint-plugin-jsx-a11y in frontend lint
```

---

## Score breakdown

| Area | Score | Weight |
|------|-------|--------|
| Perceivable | 60 | 25% |
| Operable | 55 | 25% |
| Understandable | 65 | 25% |
| Robust | 40 | 25% |
| **Weighted** | **55** | |

**RC1 target:** 80 — requires all P0 fixes + skip link + nav labels.

---

## Related documents

- [RELEASE_SCORE.md](./RELEASE_SCORE.md) — Accessibility category
- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) — LB-11
- [SEO_REPORT.md](./SEO_REPORT.md) — complementary discoverability
