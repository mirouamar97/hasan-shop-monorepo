# Software Requirements Specification (SRS)

**Project**: HASAN SHOP  
**Version**: 1.0  
**Status**: Active  
**Last Updated**: July 2026

---

## 1. Introduction

### 1.1 Purpose

This document specifies functional and non-functional requirements for HASAN SHOP — a single-merchant dropshipping e-commerce platform targeting the Algerian market.

### 1.2 Scope

The system comprises three client applications (storefront, admin dashboard, REST API) and supporting infrastructure (PostgreSQL, Redis, Meilisearch, object storage, carrier integrations).

### 1.3 Definitions

| Term | Definition |
|------|------------|
| **COD** | Cash on Delivery — customer pays carrier at delivery |
| **Wilaya** | Algerian province (58 total) |
| **Commune** | Municipality within a wilaya |
| **Stop Desk** | Carrier pickup point (bureau) |
| **Confirmation** | Pre-fulfillment phone/WhatsApp verification of order intent |
| **RBAC** | Role-Based Access Control for admin users |

### 1.4 References

- [PROJECT.md](./PROJECT.md) — Business context
- [DATABASE.md](./DATABASE.md) — Data model
- [API.md](./API.md) — API specification

---

## 2. Overall Description

### 2.1 User Classes

| User Class | Description |
|------------|-------------|
| **Guest customer** | Browses and checks out without account |
| **Registered customer** | Account with order history, addresses, wishlist |
| **Support agent** | Confirms orders, updates customer records |
| **Fulfillment agent** | Processes shipments, prints labels |
| **Catalog manager** | Manages products, categories, brands |
| **Super admin** | Full system access including users and settings |

### 2.2 Operating Environment

- Web browsers (Chrome, Safari, Firefox, Edge — last 2 versions)
- Mobile browsers (primary traffic channel in Algeria)
- Server: Node.js 20+ on Linux containers
- Database: PostgreSQL 16
- Target region: Algeria (Africa/Algiers timezone)

### 2.3 Constraints

- COD must remain the default and always-available payment method
- Shipping address must include valid wilaya and commune codes
- All prices displayed in DZD with two decimal places
- Arabic and French locales required at launch

---

## 3. Functional Requirements

### 3.1 Storefront — Catalog

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CAT-01 | Display active products with name, price, images, and short description in user's locale | Must |
| FR-CAT-02 | Support product variants (size, color, etc.) with independent SKU and optional price override | Must |
| FR-CAT-03 | Browse products by category hierarchy (parent/child categories) | Must |
| FR-CAT-04 | Filter products by brand, price range, and category | Should |
| FR-CAT-05 | Full-text search via Meilisearch with Arabic and French analyzers | Must |
| FR-CAT-06 | Product detail page with image gallery, specifications, and reviews | Must |
| FR-CAT-07 | Display compare-at price (strikethrough) when `compare_at_price` is set | Should |
| FR-CAT-08 | Show stock availability when `track_inventory` is enabled | Must |
| FR-CAT-09 | SEO: localized meta title, description, and canonical URLs per product | Must |
| FR-CAT-10 | Featured products section on homepage | Should |

### 3.2 Storefront — Cart & Checkout

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CHK-01 | Add/remove/update cart items; persist cart for guests (session) and customers (account) | Must |
| FR-CHK-02 | Apply coupon codes with percentage or fixed discount | Must |
| FR-CHK-03 | Checkout form: name, phone, wilaya, commune, address, landmark, delivery type | Must |
| FR-CHK-04 | Wilaya dropdown loads all 58 wilayas; commune dropdown filters by selected wilaya | Must |
| FR-CHK-05 | Support home delivery and stop desk delivery types | Must |
| FR-CHK-06 | Calculate shipping cost based on wilaya, weight, and carrier rates (Yalidine) | Must |
| FR-CHK-07 | Apply free shipping when subtotal ≥ configured threshold | Must |
| FR-CHK-08 | Default payment method: COD; online payment options when feature flag enabled | Must |
| FR-CHK-09 | Order summary shows subtotal, shipping, discount, and total before submit | Must |
| FR-CHK-10 | Phone number validation (Algerian mobile format) | Must |
| FR-CHK-11 | Guest checkout without mandatory account creation | Must |
| FR-CHK-12 | Optional customer account registration with phone as primary identifier | Should |

### 3.3 Storefront — Customer Account

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CUS-01 | View order history with status and tracking link | Must |
| FR-CUS-02 | Manage saved delivery addresses | Should |
| FR-CUS-03 | Wishlist: add/remove products | Should |
| FR-CUS-04 | Submit product reviews (post-delivery, one per product) | Should |
| FR-CUS-05 | Locale preference persisted on profile | Should |

### 3.4 Storefront — Internationalization

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-I18N-01 | URL-based locale routing: `/ar/...` and `/fr/...` | Must |
| FR-I18N-02 | Arabic UI renders RTL; French renders LTR | Must |
| FR-I18N-03 | Product and category content served from translation tables | Must |
| FR-I18N-04 | Language switcher preserves current page context | Must |
| FR-I18N-05 | Default locale: Arabic (`ar`) | Must |

### 3.5 Admin — Authentication & Authorization

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-01 | Admin login with email and password | Must |
| FR-AUTH-02 | Optional TOTP-based 2FA per user | Must |
| FR-AUTH-03 | Session-based auth with HTTP-only secure cookies | Must |
| FR-AUTH-04 | RBAC: permissions enforced on every protected endpoint and UI route | Must |
| FR-AUTH-05 | Session invalidation on logout | Must |
| FR-AUTH-06 | Audit log for login, logout, and sensitive actions | Must |

### 3.6 Admin — Catalog Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ADM-CAT-01 | CRUD products with AR/FR translations, images, variants, inventory | Must |
| FR-ADM-CAT-02 | Product statuses: draft, active, archived | Must |
| FR-ADM-CAT-03 | CRUD categories with hierarchy and translations | Must |
| FR-ADM-CAT-04 | CRUD brands | Must |
| FR-ADM-CAT-05 | Assign supplier to product | Must |
| FR-ADM-CAT-06 | Bulk CSV import (permission: `catalog:import`) | Should |
| FR-ADM-CAT-07 | Image upload to S3-compatible storage | Must |
| FR-ADM-CAT-08 | Sync product index to Meilisearch on create/update/delete | Must |

### 3.7 Admin — Order Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ADM-ORD-01 | Order list with filters: status, date range, wilaya, payment method | Must |
| FR-ADM-ORD-02 | Order detail: items, customer, address snapshot, status history | Must |
| FR-ADM-ORD-03 | Status transitions with audit trail (`order_status_history`) | Must |
| FR-ADM-ORD-04 | Confirmation workflow: log attempts (phone, WhatsApp, SMS) with outcome | Must |
| FR-ADM-ORD-05 | Internal notes on orders (not visible to customer) | Must |
| FR-ADM-ORD-06 | Export orders to CSV (permission: `orders:export`) | Should |
| FR-ADM-ORD-07 | Cancel order with reason (permission: `orders:cancel`) | Must |

### 3.8 Admin — Shipping

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ADM-SHP-01 | Create Yalidine shipment from confirmed order | Must |
| FR-ADM-SHP-02 | Print shipping label (PDF/URL from carrier) | Must |
| FR-ADM-SHP-03 | Display tracking events from carrier webhooks/polling | Must |
| FR-ADM-SHP-04 | Configure carrier credentials (permission: `shipping:configure`) | Must |
| FR-ADM-SHP-05 | Support multiple carriers: Yalidine (default), ZR Express, Ecotrack, Noest | Should |

### 3.9 Admin — Payments & COD Reconciliation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ADM-PAY-01 | View payment records per order | Must |
| FR-ADM-PAY-02 | COD reconciliation: expected vs received amount from carrier | Must |
| FR-ADM-PAY-03 | Mark reconciliation as received or disputed | Must |
| FR-ADM-PAY-04 | Online payment gateway integration behind feature flag | Could |

### 3.10 Admin — Analytics & Settings

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ADM-AN-01 | Dashboard: orders today, revenue, confirmation rate, top products | Must |
| FR-ADM-AN-02 | Reports by wilaya, product, and date range | Should |
| FR-ADM-SET-01 | Store branding: name, logo, colors, contact info, social links | Must |
| FR-ADM-SET-02 | SEO defaults per locale | Must |
| FR-ADM-SET-03 | Feature flags: international suppliers, online payments, WhatsApp | Must |
| FR-ADM-SET-04 | Free shipping threshold and default carrier | Must |

### 3.11 API — Public & Authenticated Endpoints

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-API-01 | REST API versioned at `/api/v1` | Must |
| FR-API-02 | Standard response envelope with `success`, `data`, `error` | Must |
| FR-API-03 | Pagination on list endpoints (`page`, `pageSize`, `sortBy`, `sortOrder`) | Must |
| FR-API-04 | Health check endpoint reporting DB, Redis, Meilisearch status | Must |
| FR-API-05 | Geography endpoints for wilayas and communes | Must |
| FR-API-06 | Rate limiting on auth and checkout endpoints | Must |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-PERF-01 | Storefront product listing TTFB | < 500ms p95 |
| NFR-PERF-02 | API catalog read endpoints | < 300ms p95 |
| NFR-PERF-03 | Search results | < 200ms p95 |
| NFR-PERF-04 | Checkout order creation | < 2s p95 |
| NFR-PERF-05 | Support 500 concurrent storefront users | Minimum |
| NFR-PERF-06 | Database queries use indexes; N+1 queries prohibited in hot paths | Must |

### 4.2 Security

| ID | Requirement | Reference |
|----|-------------|-----------|
| NFR-SEC-01 | OWASP Top 10 mitigations implemented | [SECURITY.md](./SECURITY.md) |
| NFR-SEC-02 | Passwords hashed with bcrypt (cost ≥ 12) | Must |
| NFR-SEC-03 | HTTPS only in production | Must |
| NFR-SEC-04 | CSRF protection on state-changing admin requests | Must |
| NFR-SEC-05 | Input validation on all API endpoints (whitelist DTOs) | Must |
| NFR-SEC-06 | Secrets in environment variables, never in source | Must |
| NFR-SEC-07 | Carrier credentials encrypted at rest in `carrier_configs` | Should |

### 4.3 Reliability & Availability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-REL-01 | Monthly uptime | 99.5% |
| NFR-REL-02 | Automated daily database backups with 30-day retention | Must |
| NFR-REL-03 | Graceful degradation if Meilisearch unavailable (fallback to DB search) | Should |
| NFR-REL-04 | Idempotent webhook handlers for carrier status updates | Must |

### 4.4 Scalability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SCAL-01 | Stateless API instances behind load balancer | Must |
| NFR-SCAL-02 | Redis for session and cache layer | Must |
| NFR-SCAL-03 | Object storage for media (not filesystem on app servers) | Must |
| NFR-SCAL-04 | Horizontal scaling of API and Next.js apps | Should |

### 4.5 Maintainability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-MAIN-01 | TypeScript strict mode across monorepo | Must |
| NFR-MAIN-02 | Drizzle schema as single source of truth for DB | Must |
| NFR-MAIN-03 | CI: lint, typecheck, test, build on every PR | Must |
| NFR-MAIN-04 | Structured JSON logging with request IDs | Must |

### 4.6 Usability & Accessibility

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-UX-01 | Mobile-first responsive design | Must |
| NFR-UX-02 | WCAG 2.1 AA compliance for storefront | Should |
| NFR-UX-03 | Touch targets ≥ 44×44px on mobile | Must |
| NFR-UX-04 | RTL layout correctness for Arabic | Must |

### 4.7 Compliance & Privacy

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-PRIV-01 | Customer PII accessible only to authorized admin roles | Must |
| NFR-PRIV-02 | Audit trail for data modifications | Must |
| NFR-PRIV-03 | Customer data export on request | Could |
| NFR-PRIV-04 | Right to deletion for customer accounts | Should |

---

## 5. External Interface Requirements

### 5.1 Yalidine API

- Parcel creation, rate calculation, stop desk listing, tracking
- Webhook or polling for status updates mapped to `shipment_events`

### 5.2 Email (Resend)

- Order confirmation, shipping notification, password reset

### 5.3 SMS (Future)

- OTP verification, order status SMS

### 5.4 Payment Gateway (Feature-Flagged)

- CIB, Edahabia, BaridiMob redirect/callback flows

---

## 6. Acceptance Criteria (MVP)

1. Customer can browse products in Arabic and French, add to cart, and complete COD checkout with wilaya/commune.
2. Order appears in admin with `pending` status.
3. Agent can confirm order and create Yalidine shipment with tracking number.
4. Customer can view order status on storefront.
5. Admin roles restrict access per permission matrix.
6. CI pipeline passes on `main` branch.
7. All NFR-SEC requirements from SECURITY.md verified before production launch.

---

## 7. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | July 2026 | HASAN SHOP Team | Initial SRS |
