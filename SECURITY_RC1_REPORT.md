# HASAN SHOP — Security RC1 Report

**Last updated:** 2026-07-10  
**Sprint:** RC1 Stabilization  
**Verdict:** Security **code complete** for launch blockers LB-2, LB-4, LB-5, LB-10 — **production verification pending**

---

## Executive summary

RC1 closes four P0 security launch blockers in code and configuration templates. ClamAV replaces the development no-op virus scanner in production, webhook secrets support zero-downtime rotation, guest cookies enforce `secure: true` in production, and production env validation fails fast on missing secrets.

**Not verified in this sprint:** production deploy with real secrets, staging webhook traffic, ClamAV under load.

---

## ClamAV malware scanner (LB-2 / BUG-018)

### Implementation

| Component | Location |
|-----------|----------|
| Scanner service | `apps/api/src/infrastructure/security/clamav-virus-scanner.ts` |
| Factory binding | `apps/api/src/infrastructure/security/security.module.ts` |
| Compose service | `docker-compose.prod.yml` → `clamav:1.4` |
| Health probe | `apps/api/src/presentation/modules/health/health.controller.ts` → `services.clamav` |

### Behavior

- **Production (`NODE_ENV=production`)** or when `CLAMAV_HOST` is set → `ClamAvVirusScanner` is bound via `VIRUS_SCANNER` token
- **Development** without `CLAMAV_HOST` → `NoOpVirusScanner` (accepts all uploads)
- **Protocol:** clamd INSTREAM over TCP (default port 3310)
- **Failure mode:** When `CLAMAV_REQUIRED=true` (default in production) and scanner unavailable → upload rejected (`clean: false`, threat `scanner unavailable`)
- **Env validation:** `CLAMAV_HOST` required in production (`env.validation.ts`)

### BUG-018 resolution

| Before | After |
|--------|-------|
| `NoOpVirusScanner` always used in default config | Production binds `ClamAvVirusScanner` when `CLAMAV_HOST` set |
| No health reporting | `/api/v1/health` reports `clamav: up\|down` |
| No Compose service | `clamav` container with 2G memory, 120s start period |

**Status:** Fixed in code. Production upload path not load-tested in RC1 sprint.

---

## Webhook secret rotation (LB-4 / BUG-029)

### Implementation

| Component | Location |
|-----------|----------|
| Validation service | `apps/api/src/infrastructure/security/webhook-security.service.ts` |
| Yalidine adapter verify | `packages/carrier-adapters/src/yalidine/index.ts` |
| Env vars | `.env.example`, `.env.production.example` |

### Secret resolution order

1. `WEBHOOK_SECRET_{CARRIER}` (e.g. `WEBHOOK_SECRET_YALIDINE`)
2. Fallback: `WEBHOOK_SECRET_DEFAULT`

### Rotation (zero-downtime window)

During rotation, both current and previous secrets are accepted:

| Variable | Purpose |
|----------|---------|
| `WEBHOOK_SECRET_DEFAULT` | Current default secret |
| `WEBHOOK_SECRET_PREVIOUS_DEFAULT` | Previous default (rotation window) |
| `WEBHOOK_SECRET_YALIDINE` | Per-carrier current |
| `WEBHOOK_SECRET_PREVIOUS_YALIDINE` | Per-carrier previous |

`verifyWithRotation()` tries all resolved secrets with `timingSafeEqual` HMAC-SHA256 verification.

### Additional protections (pre-existing, verified in RC1)

- Timestamp validation (±300s clock skew)
- Redis nonce replay protection (600s TTL)
- Production rejects webhooks when no secret configured

### BUG-029 resolution

| Before | After |
|--------|-------|
| Carrier webhook unauthenticated | HMAC + timestamp + nonce enforced via `WebhookSecurityService` |
| Yalidine adapter missing verify | `verifyWebhookSignature` implemented using env secrets |
| No rotation support | `WEBHOOK_SECRET_PREVIOUS_*` vars accepted during rotation |

**Status:** Fixed in code. Production secrets and Yalidine `carrier_configs` DB credentials require ops configuration.

---

## Secure guest cookies (LB-10)

### Implementation

`apps/api/src/infrastructure/security/cookie.config.ts`

```typescript
function isSecureCookie(): boolean {
  return process.env.NODE_ENV === 'production';
}
```

| Cookie helper | Used by | Flags (production) |
|---------------|---------|-------------------|
| `getGuestCookieOptions` | Cart, engagement | `httpOnly`, `secure: true`, `sameSite: 'lax'` |
| `getSessionCookieOptions` | Admin session | `httpOnly`, `secure: true`, `sameSite: 'strict'` |
| `getCsrfCookieOptions` | CSRF token | `secure: true`, `sameSite: 'strict'` |

**Controllers updated:** `cart.controller.ts`, `engagement.controller.ts`, `auth.controller.ts`

**Status:** Fixed. Requires HTTPS in production for browsers to send `Secure` cookies (nginx TLS not configured in RC1 compose).

---

## Environment validation in production (LB-5)

### Files

- `.env.example` — development template with all RC1 variables
- `.env.production.example` — production template with `REPLACE_*` placeholders

### Production-only checks (`env.validation.ts`)

| Check | Error if violated |
|-------|-----------------|
| `AUTH_SECRET` | Missing, <32 chars, or contains `change-me` |
| `WEBHOOK_SECRET_DEFAULT` | Missing |
| `CLAMAV_HOST` | Missing |

### Required public URLs in templates

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_FROM_EMAIL`
- `WEBHOOK_SECRET_*` family

**Status:** Fixed in templates and validation. Actual secret store population is ops responsibility.

---

## Security regression tests

| Test file | Tests | Coverage |
|-----------|-------|----------|
| `apps/api/src/test/security/webhook-security.regression.test.ts` | 2 | Rejects invalid signature; accepts previous secret during rotation |
| `apps/api/src/infrastructure/security/webhook-security.service.test.ts` | 3 | Core validation paths |
| `apps/api/src/infrastructure/config/env.validation.test.ts` | 2 | Rejects insecure production `AUTH_SECRET` |
| `apps/api/src/infrastructure/security/file-validation.service.test.ts` | 2 | Scanner integration |
| `apps/api/src/infrastructure/security/csrf.guard.test.ts` | 2 | CSRF enforcement |
| `apps/api/src/infrastructure/security/csrf.service.test.ts` | 3 | Token generation/validation |
| `apps/api/src/infrastructure/security/login-protection.service.test.ts` | — | Lockout logic |

**Measured:** 220 API unit tests pass (includes 2 RC1 regression tests above).

---

## Launch blocker fixes summary

| ID | Item | RC1 fix | Verified in prod |
|----|------|---------|------------------|
| **LB-2** | Malware scanner | ClamAV container + `ClamAvVirusScanner` + health probe + env validation | ⬜ |
| **LB-4** | Carrier/webhook secrets | Rotation env vars + `WebhookSecurityService` + Yalidine verify | ⬜ |
| **LB-5** | Environment template | `.env.example` + `.env.production.example` + production validation | ⬜ |
| **LB-10** | Guest cookie security | `secure: true` when `NODE_ENV=production` | ⬜ |

---

## Remaining security gaps (honest)

| Item | Severity | Status |
|------|----------|--------|
| M3 mutations not audit-logged (BUG-031) | Medium | Open |
| 2FA setup endpoints (BUG-019) | Low | Open |
| Dedicated webhook rate limits | P1 | Not implemented |
| External penetration test | P2 | Not scheduled |
| HTTPS/TLS in RC1 compose | P0 ops | Not configured |
| ClamAV performance under concurrent uploads | Unknown | Not tested |

---

## Dependency audit

**Measured (2026-07-10):** `pnpm audit --audit-level=high` → **0 high vulnerabilities**

- `drizzle-orm` pinned to `>=0.45.2` via pnpm overrides (BUG-030 advisory patched)

---

## Related documents

- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) — LB-2, LB-4, LB-5, LB-10 status
- [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) — full M3.5 audit
- [DEPLOYMENT_VALIDATION.md](./DEPLOYMENT_VALIDATION.md) — ClamAV in Compose stack
