#!/usr/bin/env bash
set -euo pipefail
npm install -g pnpm@9.15.4
# Need devDependencies (typescript, tsconfig packages) for monorepo builds
pnpm install --no-frozen-lockfile --prod=false
pnpm --filter @hasan-shop/shared build
pnpm --filter @hasan-shop/logger build
pnpm --filter @hasan-shop/carrier-adapters build
pnpm --filter @hasan-shop/database build
pnpm --filter @hasan-shop/api build
