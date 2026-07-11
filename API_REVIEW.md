# HASAN SHOP — API Review

**Report date:** 2026-07-10  
**Framework:** NestJS 11  
**Base URL:** `/api/v1`  
**Controllers:** 23 (22 files)  
**Endpoints:** ~95  
**API score:** **86 / 100**

---

## Executive summary

The HASAN SHOP API is a **well-structured REST surface** with consistent versioning, global validation, RBAC on admin routes, and defense-in-depth security controls. Public storefront endpoints intentionally skip CSRF for guest sessions. Remaining gaps are operational configuration (webhook secrets, notification providers), validation edge cases, and incomplete audit coverage on M3 mutations.

---

## Architecture

| Layer | Path | Responsibility |
|-------|------|----------------|
| Presentation | `apps/api/src/presentation/` | Controllers, guards, filters, DTOs |
| Application | `apps/api/src/application/` | Business services |
| Domain | `apps/api/src/domain/` | Repository interfaces, state machines |
| Infrastructure | `apps/api/src/infrastructure/` | Drizzle repos, Redis, S3, Meilisearch |

**Module count:** 17 feature modules + global infrastructure (`app.module.ts`)

---

## Endpoint inventory

### Public — no authentication

| Module | Method | Path | Purpose |
|--------|--------|------|---------|
| Health | GET | `/health` | Service status (DB, Redis, Meilisearch) |
| Geo | GET | `/geo/wilayas` | Algeria wilayas list |
| Geo | GET | `/geo/wilayas/:code/communes` | Communes by wilaya |
| Products | GET | `/products` | Product list (paginated) |
| Products | GET | `/products/:slug` | Product detail |
| Categories | GET | `/categories` | Category list |
| Categories | GET | `/categories/:slug` | Category detail |
| Brands | GET | `/brands` | Brand list |
| Brands | GET | `/brands/:slug` | Brand detail |
| Search | GET | `/search/products` | Meilisearch query |
| Settings | GET | `/settings/public` | Public store settings |
| Cart | GET/POST/PATCH/DELETE | `/cart/*` | Guest cart CRUD |
| Checkout | POST | `/checkout/quote` | Shipping quote |
| Checkout | POST | `/checkout` | Place order |
| Checkout | POST | `/checkout/buy-now` | Direct purchase |
| Orders | GET | `/orders/track` | Public order tracking |
| Engagement | GET/POST/DELETE | `/engagement/*` | Favorites, recently viewed, recommendations |
| Webhooks | POST | `/webhooks/carriers/:slug` | Carrier status updates |

### Authenticated — session required

| Module | Method | Path | CSRF | RBAC |
|--------|--------|------|------|------|
| Auth | GET | `/auth/csrf` | N/A | No |
| Auth | POST | `/auth/login` | Skipped | No |
| Auth | POST | `/auth/logout` | Required | No |
| Auth | GET | `/auth/me` | N/A | No |

### Admin — session + RBAC

| Module | Base path | Permissions | Endpoints |
|--------|-----------|-------------|-----------|
| Admin products | `/admin/products` | `catalog:*` | 8 |
| Admin categories | `/admin/categories` | `catalog:*` | 5 |
| Admin brands | `/admin/brands` | `catalog:*` | 5 |
| Uploads | `/admin/uploads` | `catalog:write` | 1 (presign) |
| Admin orders | `/admin/orders` | `orders:*` | 10 |
| Notification templates | `/admin/notification-templates` | `settings:*` | 2 |
| Shipping | `/admin/shipping` | `shipping:*` | 6 |
| Fulfillment | `/admin/fulfillment` | `orders:*` | 5 |
| Inventory | `/admin/inventory` | `catalog:*` | 4 |
| Suppliers | `/admin/suppliers` | `suppliers:*` | 5 |
| CRM | `/admin/crm` | `customers:*` | 6 |
| Analytics | `/admin/analytics` | `analytics:read` | 7 |
| Settings | `/settings` | `settings:*` | 2 (GET/PUT) |

---

## Security controls

### Implemented ✅

| Control | Implementation |
|---------|----------------|
| Helmet + CSP (production) | `main.ts` |
| CORS (APP_URL + ADMIN_URL) | `main.ts` |
| Global validation pipe | whitelist + forbidNonWhitelisted |
| CSRF double-submit | `CsrfGuard` — admin mutations |
| Rate limiting | `ThrottlerGuard` — 10/s, 100/min, 1000/hr |
| Login lockout | Redis IP + DB account lockout |
| Password policy | bcrypt cost 12, complexity rules |
| Session security | httpOnly, sameSite strict, secure in prod |
| Webhook HMAC + replay | `WebhookSecurityService` |
| File upload validation | Extension, MIME, magic bytes, 5 MB cap |
| RBAC | `@RequirePermissions()` on all admin controllers |

### Gaps ⚠️

| Gap | Severity | Action |
|-----|----------|--------|
| `NoOpVirusScanner` | **P0** | Bind ClamAV or cloud scanner |
| Webhook secrets not in env template | **P0** | `WEBHOOK_SECRET_*` |
| Guest cart cookies lack `secure` in prod | **P0** | Align with session cookie config |
| M3 mutations not audit-logged | P1 | Extend `AuditService` |
| No dedicated `/orders/track` rate limit | P1 | Prevent enumeration |
| `pageSize` no max cap | P1 | DoS via large page requests |
| 2FA setup endpoints missing | P1 | TOTP columns exist, no enable API |
| MinIO not in `/health` | P2 | Storage blind spot |
| Env validation skips webhook secrets | P2 | Fail fast at boot |

---

## Error handling

**Filter:** `HttpExceptionFilter` — all exceptions

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "requestId": "uuid",
  "timestamp": "ISO-8601",
  "path": "/api/v1/..."
}
```

| Status | Behavior |
|--------|----------|
| 400 | Validation errors (flattened message) |
| 401 | Unauthenticated |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 429 | Rate limited |
| 500 | Generic message; stack logged server-side |

**XSS mitigation:** HTML escape in invoice/packing slip renders (`orders.service.ts`).

---

## Input validation

| Layer | Tool | Coverage |
|-------|------|----------|
| Controller DTOs | class-validator | Most endpoints |
| Business rules | Zod (`@hasan-shop/shared`) | Checkout phone, order schema |
| Service-level | Custom asserts | Fulfillment stages, order transitions |
| File uploads | `FileValidationService` | Images only |

### Weak points

| Endpoint | Issue |
|----------|-------|
| `POST /checkout` | Phone validated in service, weak at DTO |
| `POST /checkout/quote` | `subtotal` missing `@Min(0)` |
| `GET /engagement/*/:productId` | Path param not `@IsUUID()` |
| `POST /admin/inventory/.../adjust` | `movementType` free string |
| List endpoints | `pageSize` unbounded |

---

## Health endpoint

**GET `/api/v1/health`**

```json
{
  "status": "ok",
  "version": "0.1.0",
  "timestamp": "...",
  "services": {
    "database": "up",
    "redis": "up",
    "meilisearch": "up"
  }
}
```

**Missing:** MinIO/S3, external notification providers.

---

## Webhook API

**POST `/api/v1/webhooks/carriers/:slug`**

| Step | Validation |
|------|------------|
| 1 | Resolve carrier-specific secret from env |
| 2 | Verify HMAC-SHA256 signature |
| 3 | Check timestamp within ±300 s |
| 4 | Redis nonce NX (600 s TTL) — replay protection |
| 5 | Optional carrier adapter signature verifier (Yalidine) |

**Production:** Rejects if secret unset. **Development:** Allows unsigned when secret missing.

**Note:** `BUG-029` in BUGS.md is **resolved** in M3.5 — update bug register.

---

## Order workflow API

State machine: `apps/api/src/domain/orders/order-state-machine.ts`

| Transition | Validated | HTTP |
|------------|-----------|------|
| pending → confirmed | ✅ | `PATCH /admin/orders/:id/status` |
| confirmed → processing | ✅ | Same |
| → cancelled | ✅ | Inventory release via automation |
| Invalid transition | 400 Bad Request | Not 500 |

---

## Testing coverage

| Area | Unit tests | Integration tests |
|------|------------|-------------------|
| Auth | ✅ | ✅ |
| Catalog | ✅ | ✅ |
| Cart / checkout | ✅ | ✅ |
| Orders | ✅ | ✅ |
| Fulfillment / shipping | ✅ | ✅ (M3) |
| Webhooks | ✅ | — |
| Analytics / CRM | ✅ | Partial |
| Health | ✅ | ✅ |

**Line coverage:** 85.01%  
**Branch coverage:** 68.28% (improve toward 75%)

---

## API versioning strategy

| Version | Status | Notes |
|---------|--------|-------|
| `v1` | Current | URI versioning via NestJS `VersioningType.URI` |
| `v2` | Planned (v2.0.0 mobile) | Breaking changes with deprecation period |

No OpenAPI/Swagger spec generated — recommended for RC1 documentation.

---

## Recommendations

### RC1

| # | Action |
|---|--------|
| 1 | Configure webhook secrets in staging/production |
| 2 | Bind virus scanner |
| 3 | Fix guest cookie `secure` flag |
| 4 | Update BUGS.md BUG-029 status |
| 5 | Add `pageSize` `@Max(100)` on list DTOs |

### v1.0.0 GA

| # | Action |
|---|--------|
| 6 | Generate OpenAPI spec from decorators |
| 7 | Extend audit logging to M3 modules |
| 8 | Add MinIO probe to health |
| 9 | Dedicated rate limit on `/orders/track` |
| 10 | 2FA enrollment endpoints |

---

## Score breakdown

| Area | Score |
|------|-------|
| Design & consistency | 90 |
| Security | 78 |
| Validation | 82 |
| Error handling | 88 |
| Test coverage | 85 |
| Documentation (OpenAPI) | 60 |
| **Weighted** | **86** |

---

## Related documents

- [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) — detailed security audit
- [DATABASE_REVIEW.md](./DATABASE_REVIEW.md) — persistence layer
- [ORDER_WORKFLOW.md](./ORDER_WORKFLOW.md) — order state machine
- [RELEASE_SCORE.md](./RELEASE_SCORE.md) — Security and Testing categories
