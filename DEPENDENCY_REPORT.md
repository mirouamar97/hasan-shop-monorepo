# HASAN SHOP — Dependency Report

**Report date:** 2026-07-10  
**Package manager:** pnpm 9.15.4  
**Lockfile:** `pnpm-lock.yaml` (frozen in CI)  
**Audit command:** `pnpm audit`  
**Audit result:** ✅ **No known vulnerabilities found**

---

## Executive summary

| Metric | Value | Status |
|--------|-------|--------|
| Workspace packages | 11 | — |
| Direct production dependencies | ~35 unique externals | Lean |
| High vulnerabilities | 0 | ✅ |
| Moderate vulnerabilities | 0 | ✅ |
| pnpm overrides active | 3 | ✅ |
| `pnpm audit` in CI | No | ⚠️ Add to pipeline |
| SBOM generated | No | ⚠️ Recommended for GA |

**Dependency health grade:** **B+** — clean audit, good lockfile hygiene; gaps in CI enforcement and prod dep placement.

---

## Workspace inventory

| Package | Version | Type | External prod deps |
|---------|---------|------|-------------------|
| `hasan-shop` (root) | 0.1.0 | Orchestrator | turbo, prettier (dev) |
| `@hasan-shop/api` | 0.1.0 | Application | NestJS 11, bcrypt, ioredis, AWS SDK, helmet, otplib |
| `@hasan-shop/admin` | 0.1.0 | Application | Next 15, React 19, next-intl |
| `@hasan-shop/storefront` | 0.1.0 | Application | Next 15, React 19, next-intl, zustand |
| `@hasan-shop/database` | 0.1.0 | Library | drizzle-orm 0.45.2, postgres |
| `@hasan-shop/shared` | 0.1.0 | Library | zod |
| `@hasan-shop/carrier-adapters` | 0.1.0 | Library | None (workspace only) |
| `@hasan-shop/logger` | 0.1.0 | Library | pino, pino-pretty |
| `@hasan-shop/config-eslint` | 0.1.0 | Config | eslint plugins |
| `@hasan-shop/config-typescript` | 0.1.0 | Config | None |
| `@hasan-shop/e2e` | 0.1.0 | Test | @playwright/test |

---

## Security overrides (root `package.json`)

| Package | Override | Reason | Locked version |
|---------|----------|--------|----------------|
| `drizzle-orm` | `>=0.45.2` | GHSA-gpj5-g38j-94v9 (SQL identifier injection) | 0.45.2 |
| `postcss` | `>=8.5.10` | Transitive advisory | 8.5.16 |
| `esbuild` | `>=0.25.0` | Transitive via drizzle-kit | 0.25.12 / 0.28.1 |

---

## Key dependency versions (lockfile-resolved)

### API runtime

| Dependency | Declared | Locked | License |
|------------|----------|--------|---------|
| `@nestjs/common` | ^11.1.3 | 11.1.28 | MIT |
| `@nestjs/core` | ^11.1.3 | 11.1.28 | MIT |
| `bcrypt` | ^6.0.0 | 6.0.0 | MIT |
| `helmet` | ^8.1.0 | 8.2.0 | MIT |
| `ioredis` | ^5.6.1 | 5.11.1 | MIT |
| `@aws-sdk/client-s3` | ^3.826.0 | 3.1084.0 | Apache-2.0 |
| `drizzle-orm` | ^0.45.2 | 0.45.2 | Apache-2.0 |
| `class-validator` | ^0.14.2 | 0.14.4 | MIT |
| `otplib` | ^12.0.1 | 12.0.1 | MIT |

### Frontend runtime

| Dependency | Declared | Locked | License |
|------------|----------|--------|---------|
| `next` | ^15.3.3 | 15.5.20 | MIT |
| `react` / `react-dom` | ^19.1.0 | 19.2.7 | MIT |
| `next-intl` | ^4.1.0 | 4.13.1 | MIT |
| `zustand` | ^5.0.5 | 5.0.14 | MIT |
| `sharp` (transitive) | — | 0.34.5 | Apache-2.0 + LGPL-3.0-or-later |

### Test tooling

| Dependency | Locked | Scope |
|------------|--------|-------|
| `vitest` | 3.2.1 | API + packages |
| `@playwright/test` | 1.52.0 | E2E |
| `supertest` | 7.1.1 | API integration |
| `turbo` | 2.5.4 | Monorepo orchestration |

---

## Production vs development separation

### Correctly placed (devDependencies)

- `vitest`, `@vitest/coverage-v8`, `supertest`, `@nestjs/testing`, `@nestjs/cli`
- `eslint`, `typescript`, `tailwindcss`, `drizzle-kit`, `tsx`
- `@playwright/test` (e2e package only)
- `dotenv` (API — not needed at runtime if env injected)

### Concerns

| Issue | Severity | Package | Recommendation |
|-------|----------|---------|----------------|
| `pino-pretty` in production deps | Medium | `@hasan-shop/logger` | Move to `devDependencies` or `optionalDependencies` |
| ESLint plugins as prod deps | Low | `@hasan-shop/config-eslint` | Acceptable for config package; no runtime impact |
| Caret range drift | Low | `@aws-sdk/*` | Lockfile pins; review on `pnpm update` |
| No `pnpm audit` in CI | Medium | CI pipeline | Add `--audit-level=high` step |
| Dual validation (class-validator + Zod) | Low | API + shared | Maintain both; document boundary |

---

## Notable absences (intentional)

| Package | Alternative used |
|---------|------------------|
| `meilisearch` npm client | Native `fetch` to Meilisearch HTTP API |
| `typeorm` / `prisma` | Drizzle ORM |
| `axios` | Native `fetch` / NestJS HttpModule not used |
| `bull` / `bullmq` | Synchronous automation (job queue planned v1.2.0) |
| `jest` | Vitest |

---

## Transitive license notes

| Package | License | Enterprise concern |
|---------|---------|------------------|
| `sharp` / libvips | Apache-2.0 + LGPL-3.0 | Copyleft component in image pipeline — review for strict policies |
| NestJS ecosystem | MIT | None |
| AWS SDK | Apache-2.0 | None |
| Drizzle | Apache-2.0 | None |

---

## Recommendations

### Before RC1

| # | Action | Priority |
|---|--------|----------|
| 1 | Add `pnpm audit --audit-level=high` to CI (`run-ci.sh`, `ci.yml`) | P1 |
| 2 | Move `pino-pretty` to devDependencies | P1 |
| 3 | Reconcile `BUGS.md` BUG-030 (marked open; fixed at 0.45.2) | P1 |

### Before v1.0.0 GA

| # | Action | Priority |
|---|--------|----------|
| 4 | Generate SBOM (`pnpm licenses list` or CycloneDX) | P2 |
| 5 | Document third-party license NOTICE file | P2 |
| 6 | Pin critical framework versions if desired (`next@15.5.20` exact) | P3 |
| 7 | Schedule monthly `pnpm update --interactive` review | P3 |

---

## Audit history

| Date | High | Moderate | Low | Action |
|------|------|----------|-----|--------|
| 2026-07-10 (M3.5) | 1 → 0 | 2 → 0 | — | Overrides applied |
| 2026-07-10 (this report) | 0 | 0 | 0 | `pnpm audit` clean |

---

## Related documents

- [LICENSE_REPORT.md](./LICENSE_REPORT.md) — first-party and third-party licensing
- [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) — application security
- [RELEASE_SCORE.md](./RELEASE_SCORE.md) — Security category score
