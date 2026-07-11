# HASAN SHOP

Production-grade dropshipping e-commerce platform for Algeria — COD checkout, admin operations, fulfillment, and shipping integrations.

## Architecture

| Layer | Technology |
|-------|------------|
| API | NestJS 11, PostgreSQL, Redis, Meilisearch, MinIO |
| Admin | Next.js 15 |
| Storefront | Next.js 15, next-intl (ar/fr) |
| Monorepo | pnpm workspaces + Turborepo |

## Quick start (development)

```bash
# Prerequisites: Node 20+, pnpm 9+, Docker Desktop

cp .env.example .env
docker compose up -d --wait postgres redis meilisearch minio
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev
```

| Service | URL |
|---------|-----|
| Storefront | http://localhost:3000/ar |
| Admin | http://localhost:3001 |
| API | http://localhost:4000/api/v1/health |

Default admin: `admin@hasan-shop.dz` / see `SEED_ADMIN_PASSWORD` in `.env`

## Production deployment (one command)

```bash
cp .env.production.example .env.production
# Edit ALL secrets in .env.production

pnpm deploy
# or: bash scripts/deploy/deploy.sh
```

This builds multi-stage Docker images, runs migrations, starts the full stack (API, Admin, Storefront, nginx, ClamAV, backups), and validates health.

See [DEPLOYMENT_VALIDATION.md](./DEPLOYMENT_VALIDATION.md) and [docker-compose.prod.yml](./docker-compose.prod.yml).

## CI / quality gates

```bash
pnpm ci          # Full pipeline (Docker + all tests)
pnpm test:coverage
pnpm test:integration
pnpm test:e2e:ci
pnpm audit
```

## Release cycle

| Version | Theme |
|---------|-------|
| **RC1** (current) | Production readiness stabilization |
| v1.0.0 | Production launch |
| v1.1.0 | UX improvements |
| v1.2.0 | Marketing & automation |

See [RELEASE_PLAN.md](./RELEASE_PLAN.md) and [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md).

## Documentation

| Document | Purpose |
|----------|---------|
| [RELEASE_PLAN.md](./RELEASE_PLAN.md) | Version roadmap |
| [RELEASE_SCORE.md](./RELEASE_SCORE.md) | Category scorecard |
| [CI_PIPELINE.md](./CI_PIPELINE.md) | CI steps |
| [TEST_STRATEGY.md](./TEST_STRATEGY.md) | Testing layers |
| [OPERATIONS.md](./OPERATIONS.md) | Ops runbook |
| [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) | DR procedures |
| [SECURITY_RC1_REPORT.md](./SECURITY_RC1_REPORT.md) | RC1 security |

## Kubernetes readiness

Production Compose uses named upstreams (`api`, `admin`, `storefront`) compatible with Kubernetes Services. Dockerfiles produce standalone images per app for K8s Deployment manifests (planned post-RC1).

## License

Proprietary — UNLICENSED. See [LICENSE_REPORT.md](./LICENSE_REPORT.md).
