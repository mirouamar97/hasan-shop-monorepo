# HASAN SHOP — License Report

**Report date:** 2026-07-10  
**Project:** HASAN SHOP (proprietary e-commerce platform)  
**Legal posture:** Private / commercial — not open source

---

## Executive summary

| Area | Status |
|------|--------|
| First-party license declaration | `UNLICENSED` on all workspace packages |
| Root LICENSE file | ❌ **Missing** — recommended for legal clarity |
| Third-party license compliance | Informal — no SBOM or NOTICE file |
| Copyleft exposure | `sharp`/libvips (LGPL-3.0-or-later) via Next.js image optimization |
| Risk level for private deploy | **Low** |
| Risk level for SaaS / redistribution | **Medium** — formal NOTICE recommended |

---

## First-party licensing

### Workspace packages

All application and library packages declare:

```json
"private": true,
"license": "UNLICENSED"
```

| Package | License field | LICENSE file |
|---------|---------------|--------------|
| `@hasan-shop/api` | UNLICENSED | None |
| `@hasan-shop/admin` | UNLICENSED | None |
| `@hasan-shop/storefront` | UNLICENSED | None |
| `@hasan-shop/database` | UNLICENSED | None |
| `@hasan-shop/shared` | UNLICENSED | None |
| `@hasan-shop/carrier-adapters` | UNLICENSED | None |
| `@hasan-shop/logger` | UNLICENSED | None |
| `@hasan-shop/config-eslint` | UNLICENSED | None |
| `@hasan-shop/config-typescript` | UNLICENSED | None |
| `@hasan-shop/e2e` | *(not declared)* | None |
| Root `hasan-shop` | *(not declared)* | None |

### Interpretation

`UNLICENSED` + `private: true` means:

- Code is **not** offered under an open-source license
- npm publish is blocked by `private: true`
- Legal rights remain with the copyright holder
- Contributors need explicit IP assignment or contractor agreement

### Recommendation

Add a root `LICENSE` or `COPYRIGHT` file stating proprietary terms, e.g.:

```
Copyright (c) 2026 [Entity Name]. All rights reserved.
This software is proprietary and confidential.
Unauthorized copying, distribution, or use is prohibited.
```

---

## Third-party dependency licenses

### Summary by license type (major dependencies)

| License | Packages | Copyleft? |
|---------|----------|-----------|
| MIT | NestJS, React, Next.js, bcrypt, ioredis, zod, vitest, playwright | No |
| Apache-2.0 | drizzle-orm, AWS SDK, reflect-metadata, rxjs | No |
| ISC | Various utilities | No |
| BSD-3-Clause | Some transitive deps | No |
| Apache-2.0 + LGPL-3.0-or-later | `sharp` (via Next.js) | **Partial** |

### High-attention dependencies

| Package | Version | License | Usage | Notes |
|---------|---------|---------|-------|-------|
| `next` | 15.5.20 | MIT | Admin + storefront | Standard |
| `react` | 19.2.7 | MIT | UI | Standard |
| `@nestjs/*` | 11.1.28 | MIT | API framework | Standard |
| `drizzle-orm` | 0.45.2 | Apache-2.0 | Database ORM | Standard |
| `@aws-sdk/client-s3` | 3.1084.0 | Apache-2.0 | Object storage | Standard |
| `sharp` | 0.34.5 | Apache-2.0 + LGPL-3.0 | Image optimization | **Review if distributing binaries** |
| `bcrypt` | 6.0.0 | MIT | Password hashing | Native bindings |
| `postgres` | 3.4.9 | MIT | DB driver | Standard |
| `pino` | 9.14.0 | MIT | Logging | Standard |
| `helmet` | 8.2.0 | MIT | Security headers | Standard |
| `@playwright/test` | 1.52.0 | Apache-2.0 | E2E (dev only) | Not shipped |

### LGPL consideration (`sharp`)

Next.js uses `sharp` for image optimization in production builds. The LGPL-3.0-or-later component (libvips) is:

- **Dynamically linked** in typical Node deployments
- **Not modified** in this project
- **Standard practice** for Next.js applications

**For private SaaS (HASAN SHOP hosted):** Generally acceptable — no binary redistribution to customers.

**If shipping on-premise binaries to clients:** Provide source offer for LGPL components per license terms.

---

## Infrastructure images (Docker)

| Image | License | Usage |
|-------|---------|-------|
| `postgres:16-alpine` | PostgreSQL License | Database |
| `redis:7-alpine` | BSD-3-Clause (Redis) / various | Cache |
| `getmeili/meilisearch:v1.14` | MIT | Search |
| `minio/minio:latest` | AGPL-3.0 | Object storage |

### MinIO AGPL note

MinIO server is **AGPL-3.0**. For production:

- **SaaS model** (users access via web, no MinIO binary distributed): Generally permitted under AGPL network use clause — **verify with legal counsel**
- **Alternative:** Cloudflare R2, AWS S3, or other S3-compatible service to avoid AGPL exposure

---

## Compliance checklist

| # | Item | Status | Action |
|---|------|--------|--------|
| 1 | First-party license declared on all packages | ✅ | — |
| 2 | Root proprietary LICENSE file | ❌ | Create before GA |
| 3 | Third-party NOTICE file | ❌ | Generate before GA |
| 4 | SBOM (Software Bill of Materials) | ❌ | `pnpm licenses list` or CycloneDX |
| 5 | Contributor license agreement | ❓ | If external contributors |
| 6 | MinIO AGPL review | ❓ | Legal sign-off for production |
| 7 | sharp/LGPL review | ✅ Low risk | Document in NOTICE |
| 8 | No GPL code in first-party source | ✅ | Verified |
| 9 | Dependency licenses compatible with commercial use | ✅ | MIT/Apache dominant |

---

## Recommendations

### Before RC1

No license blockers for internal RC1 deployment.

### Before v1.0.0 GA

| Priority | Action |
|----------|--------|
| P1 | Add root `LICENSE` (proprietary) or `COPYRIGHT` notice |
| P1 | Generate `NOTICE` file listing major third-party licenses |
| P1 | Legal review of MinIO AGPL in production architecture |
| P2 | Automate SBOM generation in CI |
| P2 | Evaluate S3/R2 migration to remove AGPL MinIO dependency |
| P3 | Contributor agreement template if open-sourcing any component |

---

## Commands for license audit

```bash
# List all dependency licenses
pnpm licenses list

# Export for legal review
pnpm licenses list --json > licenses.json
```

---

## Related documents

- [DEPENDENCY_REPORT.md](./DEPENDENCY_REPORT.md) — versions and security
- [RELEASE_SCORE.md](./RELEASE_SCORE.md) — Maintainability category
