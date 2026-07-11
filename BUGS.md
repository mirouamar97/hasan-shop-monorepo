# HASAN SHOP — Bug Register (M3)

**Last Updated**: 2026-07-11  
**Severity**: Critical / High / Medium / Low  
**Status**: Open / Fixed

---

## Summary

| Severity | Open | Fixed |
|----------|------|-------|
| Critical | 0 | 0 |
| High | 0 | 9 |
| Medium | 0 | 9 |
| Low | 2 | 7 |
| **Total** | **2** | **25** |

---

## Fixed in RC1

### BUG-018 — Virus scanner no-op by default
- **Status**: Fixed  
- **Result**: `ClamAvVirusScanner` bound in production via `CLAMAV_HOST`; ClamAV container in `docker-compose.prod.yml`; health probe at `/api/v1/health`; `CLAMAV_HOST` required in production env validation.

### BUG-022 — MinIO not in API health check
- **Status**: Fixed  
- **Result**: `checkStorage()` via S3 `HeadBucketCommand` reported as `services.storage` in `/api/v1/health`.

### BUG-029 — Carrier webhook unauthenticated
- **Status**: Fixed  
- **Result**: `WebhookSecurityService` enforces HMAC-SHA256, timestamp window, Redis nonce replay protection. Yalidine adapter implements `verifyWebhookSignature`. Secret rotation via `WEBHOOK_SECRET_PREVIOUS_*`. Regression tests in `webhook-security.regression.test.ts`.

### BUG-030 — drizzle-orm SQL identifier injection advisory
- **Status**: Fixed  
- **Result**: `drizzle-orm` upgraded to `>=0.45.2` via pnpm overrides. `pnpm audit --audit-level=high`: 0 high vulnerabilities (2026-07-10).

---

## Fixed in M1.5

### BUG-003 — Seed admin password hardcoded
- **Status**: Fixed  
- **Result**: `SEED_ADMIN_PASSWORD` env var; no password logged.

### BUG-004 — CSRF not implemented
- **Status**: Fixed  
- **Result**: Global `CsrfGuard` + `/api/v1/auth/csrf` + frontend header flow.

### BUG-006 — Audit logs unused
- **Status**: Fixed  
- **Result**: Audit on auth, product mutations, settings updates.

### BUG-007 — Session not rotated on login
- **Status**: Fixed  

### BUG-008 — CSP disabled
- **Status**: Fixed  

### BUG-010 — ESLint / NestJS DI type import conflicts
- **Status**: Fixed  
- **Result**: `@Inject()` on controllers; eslint `disallowTypeAnnotations: false` for API.

### BUG-014 — Local stack not verified
- **Status**: Fixed  
- **Result**: `verify:stack` passes — Docker, migrations, seed, API health.

### BUG-015 — Integration tests skip without DB
- **Status**: Fixed (with `.env`)  
- **Result**: 5/5 integration tests pass when `DATABASE_URL` is set (default in `.env`).

### BUG-016 — `OTEL_ENABLED` env validation test failure
- **Status**: Fixed  
- **Result**: `toBoolean` transform; all 15 API tests pass.

### BUG-024 — Missing account lockout
- **Status**: Fixed  

### BUG-025 — Missing password policy
- **Status**: Fixed  

### BUG-026 — Weak upload validation
- **Status**: Fixed (baseline)  

### BUG-027 — NestJS controller DI undefined under Vitest
- **Status**: Fixed  
- **Result**: Explicit `@Inject()` on all controller service dependencies.

### BUG-028 — AuthGuard module wiring
- **Status**: Fixed  
- **Result**: `AuthModule` exported and imported in Settings/Catalog modules.

---

## Open Bugs

### BUG-019 — 2FA setup endpoints missing
| Field | Value |
|-------|-------|
| Severity | Low |
| Component | Auth API |
| Status | Open |

### BUG-020 — E2E coverage incomplete for business flows
| Field | Value |
|-------|-------|
| Severity | Low |
| Component | `e2e` suite |
| Status | Open (smoke tests pass) |

3/3 smoke tests pass; full admin CRUD and checkout flows not yet covered.

### BUG-021 — Storefront placeholder images log Next.js SVG warnings
| Field | Value |
|-------|-------|
| Severity | Low |
| Component | Storefront product cards |
| Status | Fixed |

Seed uses `picsum.photos` raster images; legacy `placehold.co` URLs use `unoptimized` on `Image`.

---

## Open Bugs (M3)

### BUG-031 — M3 mutations not audit-logged
| Field | Value |
|-------|-------|
| Severity | Medium |
| Component | Fulfillment, shipping, inventory, suppliers |
| Status | Fixed |

Admin mutations in fulfillment, suppliers, inventory, and shipping controllers now call `AuditService`.

### BUG-032 — No HTTP endpoint for supplier auto-assign
| Field | Value |
|-------|-------|
| Severity | Low |
| Component | `SupplierService.autoAssignProduct` |
| Status | Fixed |

`POST /admin/suppliers/products/:productId/auto-assign` exposes auto-assign.

### BUG-033 — Admin shipping quote diverges from checkout quote
| Field | Value |
|-------|-------|
| Severity | Low |
| Component | `DrizzleShippingRepository` vs `ShippingService` |
| Status | Open (by design) |

Checkout uses flat rates; admin quote uses carrier adapters. Prices may differ until unified.

### BUG-034 — API dev startup fails (Nest DI type imports)
| Field | Value |
|-------|-------|
| Severity | High |
| Component | `ClamAvVirusScanner`, `ShippingService`, `AutomationService` |
| Status | Fixed |

`import { type ConfigService }` and `import { type XxxService }` erased runtime metadata; Nest could not resolve constructor deps (`Function at index [n]`). Fixed by using value imports for all `@Injectable()` constructor parameters.

### BUG-035 — carrier-adapters package exports raw TypeScript
| Field | Value |
|-------|-------|
| Severity | High |
| Component | `packages/carrier-adapters/package.json` |
| Status | Fixed |

`exports` pointed to `./src/*.ts`; Node ESM at API runtime failed with `ERR_MODULE_NOT_FOUND`. Exports now target compiled `dist/*.js`.

### BUG-036 — Newsletter signup UI-only (no persistence)
| Field | Value |
|-------|-------|
| Severity | Medium |
| Component | `newsletter-signup.tsx`, API |
| Status | Fixed |

Added `newsletter_subscribers` table (migration `0004`), `POST /api/v1/newsletter/subscribe`, Drizzle repository, and wired storefront form with error handling.
