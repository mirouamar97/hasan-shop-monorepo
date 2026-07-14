#!/usr/bin/env bash
set -euo pipefail
npm install -g pnpm@9.15.4
pnpm install --no-frozen-lockfile
pnpm --filter @hasan-shop/shared build
pnpm --filter @hasan-shop/admin build
mkdir -p apps/admin/.next/standalone/apps/admin/.next
cp -R apps/admin/.next/static apps/admin/.next/standalone/apps/admin/.next/static || true
cp -R apps/admin/public apps/admin/.next/standalone/apps/admin/public || true
