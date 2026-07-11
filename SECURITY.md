# Security

**Project**: HASAN SHOP  
**Standard**: OWASP Top 10 (2021) + Algeria e-commerce best practices  
**Last Review**: July 2026

---

## Security Principles

1. **Defense in depth** — Multiple layers: network, application, data
2. **Least privilege** — RBAC with granular permissions; no shared admin accounts
3. **Secure defaults** — COD-only payments, strict cookies, validation on all inputs
4. **Fail securely** — Generic error messages to clients; detailed logs server-side
5. **Audit everything sensitive** — Login, permission changes, order status, settings updates

---

## OWASP Top 10 Implementation

### A01: Broken Access Control

| Control | Implementation |
|---------|----------------|
| RBAC | Permissions in `packages/shared/src/permissions`; enforced via `AuthGuard` + `@Permissions()` decorator |
| Resource ownership | Customers access only own orders; admin endpoints check permission per action |
| IDOR prevention | UUIDs for all resources; authorization check before any read/update |
| Admin route protection | Next.js middleware validates session via `/auth/me` before rendering dashboard |
| Default deny | All API routes require explicit `@Public()` decorator or auth guard |

### A02: Cryptographic Failures

| Control | Implementation |
|---------|----------------|
| Password hashing | bcrypt with cost factor 12 (`packages/database/src/seed.ts`, `domain/auth/password.service.ts`) |
| Secrets management | `.env` for all secrets; `.env.example` with placeholders only; never commit `.env` |
| `AUTH_SECRET` | Minimum 64 random characters in production (`openssl rand -hex 32`) |
| TLS | HTTPS enforced in production; HSTS header via reverse proxy |
| TOTP secrets | Stored encrypted; not returned in API responses |
| Carrier credentials | `carrier_configs.credentials` JSONB — encrypt at application layer before M4 |
| Database | SSL connection to PostgreSQL in production (`?sslmode=require`) |

### A03: Injection

| Control | Implementation |
|---------|----------------|
| SQL injection | Drizzle ORM parameterized queries exclusively; no raw SQL with user input |
| NoSQL injection | N/A (PostgreSQL only) |
| Command injection | No shell execution with user input |
| Input validation | NestJS `ValidationPipe`: `whitelist: true`, `forbidNonWhitelisted: true` |
| Search | Meilisearch queries sanitized; filter values allowlisted |

### A04: Insecure Design

| Control | Implementation |
|---------|----------------|
| Threat modeling | Order fraud, coupon abuse, confirmation bypass reviewed in SRS |
| Rate limiting | Login (5/15min), checkout (10/hr), search (60/min) per IP |
| Business logic | Inventory reservation on checkout; coupon usage limits; idempotent webhooks |
| COD workflow | Orders require confirmation before shipment creation |

### A05: Security Misconfiguration

| Control | Implementation |
|---------|----------------|
| Helmet | Enabled on API (`apps/api/src/main.ts`) with production-tuned CSP |
| Default credentials | Seed admin password must be changed on first login |
| Docker | Non-root containers in production Dockerfiles |
| Error pages | No stack traces in production responses |
| Dependency audit | `pnpm audit` in CI; Dependabot enabled |
| Meilisearch | Master key required; not exposed publicly |

### A06: Vulnerable and Outdated Components

| Control | Implementation |
|---------|----------------|
| Lockfile | `pnpm-lock.yaml` committed; `--frozen-lockfile` in CI |
| CI scanning | `pnpm audit --audit-level=high` fails build on high/critical |
| Node.js | LTS version (22 in CI); engines field in `package.json` |
| Base images | Pin Docker image versions (`postgres:16-alpine`, `redis:7-alpine`) |

### A07: Identification and Authentication Failures

| Control | Implementation |
|---------|----------------|
| Session management | Server-side sessions in `sessions` table; token in HTTP-only cookie |
| Cookie flags | `httpOnly`, `secure` (prod), `sameSite: strict`, scoped `path: /` |
| Session expiry | `AUTH_SESSION_EXPIRY_HOURS`; expired sessions rejected |
| Password policy | Minimum 12 characters; complexity enforced in validation |
| 2FA | TOTP optional per admin user; required for `super_admin` in production |
| Brute force | Rate limit on login; account lockout after 10 failures (planned M3) |
| Logout | Server-side session deletion + cookie clear |

### A08: Software and Data Integrity Failures

| Control | Implementation |
|---------|----------------|
| CI/CD | GitHub Actions with branch protection on `main` |
| Webhook verification | Yalidine webhooks validated via HMAC signature |
| Package integrity | pnpm lockfile + npm registry only |
| CSRF | Double-submit cookie pattern for admin mutations |

### A09: Security Logging and Monitoring Failures

| Control | Implementation |
|---------|----------------|
| Structured logging | Pino JSON logs via `@hasan-shop/logger` |
| Request ID | `RequestIdInterceptor` — `X-Request-ID` on every request |
| Audit log | `audit_logs` table for sensitive actions |
| Log fields | timestamp, level, requestId, userId, method, path, statusCode, durationMs |
| Sensitive data | Passwords, tokens, full card numbers never logged |
| Alerting | Error rate and failed login spikes (OTEL + Grafana planned) |

### A10: Server-Side Request Forgery (SSRF)

| Control | Implementation |
|---------|----------------|
| External URLs | Allowlist for carrier API endpoints only |
| Webhook callbacks | Validate callback URLs if user-configurable (not in MVP) |
| Image URLs | Product images uploaded to S3; URL validation on import |

---

## Cross-Site Scripting (XSS)

| Layer | Control |
|-------|---------|
| React | JSX auto-escaping; no `dangerouslySetInnerHTML` without sanitization |
| CSP | Content-Security-Policy on storefront and admin (see below) |
| API | `Content-Type: application/json`; no reflected HTML |
| Rich text | Product descriptions sanitized with DOMPurify before render (M3) |
| Cookies | `httpOnly` prevents session theft via XSS |

### Content Security Policy (Production)

```
default-src 'self';
script-src 'self' 'nonce-{nonce}';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https://*.hasan-shop.dz https://*.r2.cloudflarestorage.com;
connect-src 'self' https://api.hasan-shop.dz;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

---

## Cross-Site Request Forgery (CSRF)

| Context | Protection |
|---------|------------|
| Admin API | `X-CSRF-Token` header required on POST/PUT/PATCH/DELETE |
| Cookie model | CSRF token in non-httpOnly cookie; validated against header |
| SameSite | `strict` on session cookie prevents cross-origin submission |
| Storefront checkout | SameSite cookies + origin validation |

---

## CORS Configuration

```typescript
// apps/api/src/main.ts
origin: [APP_URL, ADMIN_URL],
credentials: true,
methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token'],
```

- No wildcard `*` origin with credentials
- Production origins explicitly listed in environment

---

## Data Protection

### PII Inventory

| Data | Classification | Retention |
|------|----------------|-----------|
| Customer phone, name, address | PII | Account lifetime + 2 years |
| Admin email | PII | Employment duration |
| Order snapshots | PII | 7 years (tax/audit) |
| IP addresses in logs | PII | 90 days |
| Payment gateway tokens | Sensitive | Per gateway policy |

### Encryption

| State | Method |
|-------|--------|
| In transit | TLS 1.2+ |
| At rest (DB) | Provider-managed disk encryption (RDS/Supabase) |
| At rest (S3) | Server-side encryption (SSE-S3 or SSE-KMS) |
| Backups | Encrypted backup storage |

### Data Minimization

- Guest checkout requires only fulfillment-necessary fields
- Admin users see customer PII only with `customers:read`
- Export functions audit-logged

---

## API Security Checklist

- [x] Global validation pipe with whitelist
- [x] Helmet security headers
- [x] CORS restricted origins
- [x] HTTP-only session cookies
- [x] Request ID correlation
- [x] Structured error responses (no stack traces)
- [ ] Rate limiting middleware (M2)
- [ ] Account lockout (M3)
- [ ] API key for webhook-only endpoints (M3)
- [ ] OpenAPI security schemes documented (M3)

---

## Infrastructure Security

### Network

- API and admin not publicly exposed except via reverse proxy (Nginx/Caddy)
- PostgreSQL, Redis, Meilisearch on private network only
- SSH disabled on app servers; deploy via CI/CD

### Docker

- Run containers as non-root user
- Read-only filesystem where possible
- Secrets via Docker secrets or orchestrator env injection
- No `latest` tags in production compose

### Secrets Rotation

| Secret | Rotation Frequency |
|--------|-------------------|
| `AUTH_SECRET` | Annually or on compromise |
| Database password | Quarterly |
| Yalidine API token | On staff departure |
| Meilisearch master key | Annually |
| S3 access keys | Quarterly |

---

## Incident Response

1. **Detect** — Monitoring alerts, customer report, audit log anomaly
2. **Contain** — Revoke sessions, rotate compromised secrets, disable affected accounts
3. **Investigate** — Query audit logs by `request_id` and time range
4. **Recover** — Restore from backup if data integrity affected
5. **Notify** — Affected customers if PII breach (per applicable law)
6. **Post-mortem** — Document root cause and preventive controls

**Security contact**: security@hasan-shop.dz

---

## Pre-Production Security Gate

Before go-live, verify:

1. All default passwords changed
2. `AUTH_SECRET` is cryptographically random (64+ chars)
3. HTTPS with valid certificate
4. `.env` not in repository; secrets in vault
5. Database not publicly accessible
6. Rate limiting enabled
7. 2FA enabled for all `super_admin` users
8. Backup restore tested successfully
9. `pnpm audit` shows no high/critical vulnerabilities
10. Penetration test or OWASP ZAP scan completed

---

## Related Documents

- [ADMIN.md](./ADMIN.md) — RBAC roles and permissions
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Infrastructure hardening
- [API.md](./API.md) — Authentication endpoints
