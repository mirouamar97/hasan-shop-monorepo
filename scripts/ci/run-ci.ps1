# Full CI pipeline for Windows (mirrors scripts/ci/run-ci.sh).
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $Root

$env:CI = 'true'
$env:NODE_ENV = 'test'
$env:DATABASE_URL = 'postgresql://hasan_shop:hasan_shop_dev@localhost:5433/hasan_shop'
$env:AUTH_SECRET = 'ci-github-actions-auth-secret-32chars-min'
$env:SEED_ADMIN_PASSWORD = 'DevOnly@HasanShop2026!Secure'
$env:NEXT_PUBLIC_API_URL = 'http://localhost:4000'
$env:CI_LOG_DIR = Join-Path $Root 'ci-logs'

function Wait-ForUrl {
    param([string]$Url, [int]$TimeoutSec = 120, [int]$IntervalSec = 2)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) {
                Write-Host "OK: $Url"
                return
            }
        } catch { }
        Start-Sleep -Seconds $IntervalSec
    }
    throw "TIMEOUT: $Url not healthy within ${TimeoutSec}s"
}

function Stop-CiStack {
    $logDir = $env:CI_LOG_DIR
    if (Test-Path $logDir) {
        Get-ChildItem "$logDir\*.pid" -ErrorAction SilentlyContinue | ForEach-Object {
            $pid = Get-Content $_.FullName
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    docker compose down --remove-orphans 2>$null
}

try {
    Write-Host '=== 1. Install dependencies ==='
    pnpm install --frozen-lockfile

    Write-Host '=== 2. Lint & typecheck ==='
    pnpm lint
    pnpm typecheck

    Write-Host '=== 3. Build all packages ==='
    pnpm build

    Write-Host '=== 4. Environment ==='
    if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env' }

    Write-Host '=== 5. Start Docker ==='
    docker compose up -d --wait --wait-timeout 180 postgres redis meilisearch minio

    Write-Host '=== 6. Verify infrastructure health ==='
    foreach ($svc in @('postgres', 'redis', 'meilisearch')) {
        $status = docker inspect --format='{{.State.Health.Status}}' "hasan-shop-$svc" 2>$null
        if ($status -ne 'healthy') { throw "Service hasan-shop-$svc is not healthy (status=$status)" }
        Write-Host "Docker healthy: $svc"
    }
    Wait-ForUrl 'http://localhost:7700/health' 60
    Wait-ForUrl 'http://localhost:9000/minio/health/live' 60

    Write-Host '=== 7. Migrate & seed ==='
    pnpm db:migrate
    pnpm db:seed

    Write-Host '=== 8. Start applications ==='
    New-Item -ItemType Directory -Force -Path $env:CI_LOG_DIR | Out-Null
    $api = Start-Process -FilePath 'pnpm' -ArgumentList '--filter','@hasan-shop/api','start' -RedirectStandardOutput "$env:CI_LOG_DIR\api.log" -RedirectStandardError "$env:CI_LOG_DIR\api.err.log" -PassThru -NoNewWindow
    $api.Id | Set-Content "$env:CI_LOG_DIR\api.pid"
    $admin = Start-Process -FilePath 'pnpm' -ArgumentList '--filter','@hasan-shop/admin','start' -RedirectStandardOutput "$env:CI_LOG_DIR\admin.log" -RedirectStandardError "$env:CI_LOG_DIR\admin.err.log" -PassThru -NoNewWindow
    $admin.Id | Set-Content "$env:CI_LOG_DIR\admin.pid"
    $sf = Start-Process -FilePath 'pnpm' -ArgumentList '--filter','@hasan-shop/storefront','start' -RedirectStandardOutput "$env:CI_LOG_DIR\storefront.log" -RedirectStandardError "$env:CI_LOG_DIR\storefront.err.log" -PassThru -NoNewWindow
    $sf.Id | Set-Content "$env:CI_LOG_DIR\storefront.pid"

    Write-Host '=== 9. Wait for application health ==='
    Wait-ForUrl 'http://localhost:4000/api/v1/health' 180
    $health = (Invoke-WebRequest -Uri 'http://localhost:4000/api/v1/health' -UseBasicParsing).Content
    if ($health -notmatch '"database":"up"' -or $health -notmatch '"redis":"up"') {
        throw "API health check failed: $health"
    }
    Wait-ForUrl 'http://localhost:3001' 180
    Wait-ForUrl 'http://localhost:3000/ar' 180

    Write-Host '=== 10. Unit tests + coverage ==='
    pnpm test:coverage

    Write-Host '=== 11. API integration tests ==='
    pnpm test:integration

    Write-Host '=== 12. Playwright E2E ==='
    pnpm --filter @hasan-shop/e2e exec playwright install --with-deps chromium
    pnpm test:e2e:ci

    Write-Host '=== CI pipeline completed successfully ==='
}
finally {
    Stop-CiStack
}
