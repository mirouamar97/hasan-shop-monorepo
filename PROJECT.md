# HASAN SHOP — Project Overview

## Vision

HASAN SHOP is a **single-merchant, production-grade dropshipping platform** purpose-built for the Algerian e-commerce market. The goal is to provide a trustworthy online shopping experience with fast nationwide delivery, transparent pricing in Algerian Dinar (DZD), and payment methods Algerian customers actually use — primarily **Cash on Delivery (COD)**.

Unlike generic international SaaS storefronts, HASAN SHOP encodes Algeria-specific realities: 58 wilayas, commune-level addressing, Yalidine and local carrier APIs, bilingual Arabic/French UX, and an order-confirmation culture where phone verification reduces refusal rates and shipping costs.

---

## Business Model

### Dropshipping (Local-First)

| Aspect | Approach |
|--------|----------|
| **Inventory** | Products sourced from local and (optionally) international suppliers |
| **Fulfillment** | Merchant confirms order → supplier ships or merchant forwards → carrier delivers |
| **Revenue** | Retail margin between `cost_price` and `price` per SKU |
| **Payment** | COD collected by carrier; reconciled against expected amounts |
| **Risk** | Refusals and returns managed via confirmation workflow and status tracking |

### Single Merchant

This is **not** a multi-vendor marketplace. One brand (HASAN SHOP), one catalog, one operations team. The admin dashboard serves internal staff with role-based access — catalog managers, fulfillment agents, support agents, and analysts.

### Unit Economics (Target)

- **Gross margin**: 25–45% on consumer goods (category-dependent)
- **Shipping**: Passed to customer or subsidized above free-shipping threshold (default 10,000 DZD)
- **COD fee**: Absorbed or partially passed via carrier commission reconciliation
- **Confirmation cost**: Internal labor; ROI measured by reduced refusal rate

---

## Algeria Market Context

### Why COD Dominates

- Low credit/debit card penetration compared to MENA averages
- Customer trust barrier for new online shops — pay when you receive
- CIB, Edahabia, and BaridiMob exist but adoption is growing; platform supports them behind feature flags

### Geography

- **58 wilayas** (provinces) with distinct shipping rates and delivery times
- **Communes** (municipalities) required for accurate carrier routing
- **Stop Desk** vs **Home delivery** — Yalidine and peers offer bureau pickup; checkout must support both

### Language & Culture

- **Arabic** (RTL) is the default storefront locale — largest addressable audience
- **French** (LTR) serves educated urban buyers and aligns with admin tooling conventions
- Product content, SEO meta, and UI strings are fully translated; URLs are locale-prefixed

### Competition Landscape

- Facebook/Instagram shops and informal WhatsApp selling remain dominant
- Differentiation: professional UX, reliable tracking, structured returns, and searchable catalog
- SEO for Arabic and French product queries is a growth lever

### Regulatory Considerations

- Consumer protection and e-commerce regulations evolving in Algeria
- Invoice/receipt expectations for B2C sales
- Data residency: primary hosting should prefer EU/MENA regions with acceptable latency to Algeria

---

## Product Scope

### In Scope (MVP → M7)

1. Product catalog with variants, images, categories, brands
2. Guest and registered checkout with wilaya/commune selection
3. COD checkout flow with order confirmation queue
4. Yalidine shipment creation, label printing, tracking webhooks
5. Admin dashboard: catalog CRUD, order pipeline, basic analytics
6. Meilisearch-powered product search
7. AR/FR storefront with RTL support

### Out of Scope (Initial Releases)

- Multi-vendor marketplace
- Native mobile apps (planned post-M7)
- International cross-border checkout
- Complex subscription/recurring billing

---

## Technical Architecture Summary

### Stack

| Layer | Technology |
|-------|------------|
| Storefront & Admin | Next.js 15, React 19, Tailwind CSS 4 |
| API | NestJS 11, class-validator DTOs |
| ORM | Drizzle ORM on PostgreSQL 16 |
| Cache / Sessions | Redis 7 |
| Search | Meilisearch 1.14 |
| Object Storage | S3-compatible (MinIO dev, Cloudflare R2 prod) |
| Monorepo | Turborepo + pnpm workspaces |
| i18n | next-intl |

### Layered API Design (NestJS)

```
presentation/   → Controllers, guards, filters, interceptors
application/      → Use cases and orchestration services
domain/         → Business rules (password hashing, pricing logic)
infrastructure/ → Database, Redis, external APIs
```

### Data Flow: Order Lifecycle

```
Customer places order (COD)
        ↓
Status: pending → awaiting_confirmation
        ↓
Agent confirms via phone/WhatsApp
        ↓
Status: confirmed → processing
        ↓
Shipment created (Yalidine API)
        ↓
Status: shipped → out_for_delivery → delivered
        ↓
COD remittance reconciled
        ↓
Status: paid
```

Alternative paths: `refused`, `returned`, `cancelled` at confirmation or delivery.

### Integration Points

| Service | Purpose |
|---------|---------|
| Yalidine API | Parcel creation, rates, tracking, stop desks |
| Resend | Transactional email |
| SMS provider (TBD) | OTP and order notifications |
| Payment gateway (feature-flagged) | CIB / Edahabia / BaridiMob |

---

## Stakeholders

| Role | Needs |
|------|-------|
| **Store owner** | Revenue visibility, margin control, brand consistency |
| **Catalog manager** | Fast product publishing, import tools, SEO fields |
| **Fulfillment agent** | Order queue, label printing, bulk status updates |
| **Support agent** | Customer lookup, confirmation logging, order notes |
| **Customer** | Simple checkout, order tracking, Arabic/French UX |
| **Developer** | Typed monorepo, migrations, CI, clear API contracts |

---

## Success Metrics

| Metric | Target (6 months post-launch) |
|--------|-------------------------------|
| Order confirmation rate | ≥ 75% of placed orders |
| Delivery success rate | ≥ 85% of confirmed orders |
| Refusal rate | ≤ 12% |
| Storefront LCP (mobile) | < 2.5s on 4G |
| API p95 latency | < 300ms for catalog reads |
| Uptime | 99.5% monthly |

---

## Brand Identity

- **Name**: HASAN SHOP (حسان شوب)
- **Positioning**: Trusted local online shop — quality products, nationwide delivery, pay on delivery
- **Primary color**: `#1a56db` (configurable via store settings)
- **Accent**: `#f59e0b`
- **Tone**: Professional, warm, reassuring — especially around delivery and payment

---

## Related Documents

- Requirements: [SRS.md](./SRS.md)
- Data model: [DATABASE.md](./DATABASE.md)
- API contract: [API.md](./API.md)
- Delivery plan: [ROADMAP.md](./ROADMAP.md)
