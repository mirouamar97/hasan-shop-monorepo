#!/usr/bin/env bash
set -euo pipefail
npm install -g pnpm@9.15.4
pnpm install --no-frozen-lockfile
pnpm --filter @hasan-shop/shared build
pnpm --filter @hasan-shop/logger build
pnpm --filter @hasan-shop/carrier-adapters build
pnpm --filter @hasan-shop/database build
pnpm --filter @hasan-shop/api build
