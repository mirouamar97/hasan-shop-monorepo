#!/usr/bin/env bash
set -euo pipefail
npm install -g pnpm@9.15.4
pnpm install --no-frozen-lockfile
pnpm --filter @hasan-shop/shared build
pnpm --filter @hasan-shop/storefront build
# Standalone server expects assets next to it
mkdir -p apps/storefront/.next/standalone/apps/storefront/.next
cp -R apps/storefront/.next/static apps/storefront/.next/standalone/apps/storefront/.next/static || true
cp -R apps/storefront/public apps/storefront/.next/standalone/apps/storefront/public || true
