# HASAN SHOP — Stack Verification Script (M1.5)
# Verifies Docker services, migrations, seed, and API health.

param(
  [string]$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path
)

$ErrorActionPreference = "Stop"
$results = @()

function Add-Result($name, $ok, $detail) {
  $script:results += [PSCustomObject]@{ Check = $name; Status = $(if ($ok) { "PASS" } else { "FAIL" }); Detail = $detail }
}

Set-Location $ProjectRoot

# Docker
try {
  $dockerVersion = docker --version 2>&1
  Add-Result "Docker CLI" $true $dockerVersion
} catch {
  Add-Result "Docker CLI" $false "Docker not found. Install Docker Desktop."
  $results | Format-Table -AutoSize
  exit 1
}

Write-Host "Starting Docker Compose stack..."
$prevErrorAction = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
docker compose up -d 2>&1 | Out-Null
$ErrorActionPreference = $prevErrorAction

$services = @(
  @{ Name = "PostgreSQL"; Port = 5433 },
  @{ Name = "Redis"; Port = 6379 },
  @{ Name = "Meilisearch"; Port = 7700 },
  @{ Name = "MinIO"; Port = 9000 }
)

foreach ($svc in $services) {
  $deadline = (Get-Date).AddSeconds(60)
  $ok = $false
  while ((Get-Date) -lt $deadline) {
    $test = Test-NetConnection localhost -Port $svc.Port -WarningAction SilentlyContinue
    if ($test.TcpTestSucceeded) { $ok = $true; break }
    Start-Sleep -Seconds 2
  }
  Add-Result $svc.Name $ok $(if ($ok) { "Port $($svc.Port) open" } else { "Port $($svc.Port) not reachable" })
}

Write-Host "Running migrations..."
pnpm db:migrate 2>&1 | Out-Host
Add-Result "Migrations" ($LASTEXITCODE -eq 0) $(if ($LASTEXITCODE -eq 0) { "OK" } else { "Failed" })

Write-Host "Running seed..."
pnpm db:seed 2>&1 | Out-Host
Add-Result "Seed" ($LASTEXITCODE -eq 0) $(if ($LASTEXITCODE -eq 0) { "OK" } else { "Failed" })

# API health
Write-Host "Starting API for smoke test..."
$apiJob = Start-Job -ScriptBlock {
  Set-Location $using:ProjectRoot
  pnpm --filter @hasan-shop/api start 2>&1
}

Start-Sleep -Seconds 15
$healthOk = $false
$healthDetail = ''
for ($i = 0; $i -lt 5; $i++) {
  try {
    $health = Invoke-RestMethod -Uri "http://localhost:4000/api/v1/health" -TimeoutSec 10
    $healthDetail = $health | ConvertTo-Json -Compress
    $healthOk = ($health.services.database -eq "up") -and ($health.services.redis -eq "up")
    if ($healthOk) { break }
  } catch {
    $healthDetail = $_.Exception.Message
  }
  Start-Sleep -Seconds 3
}
Add-Result "API Health" $healthOk $healthDetail

Stop-Job $apiJob -ErrorAction SilentlyContinue
Remove-Job $apiJob -ErrorAction SilentlyContinue

Write-Host "`n=== Verification Summary ==="
$results | Format-Table -AutoSize

$failed = $results | Where-Object { $_.Status -eq "FAIL" }
if ($failed.Count -gt 0) { exit 1 }
exit 0
