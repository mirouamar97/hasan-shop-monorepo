# HASAN SHOP — Cross-Package Coverage Report (M3.5)
# Runs Vitest coverage across testable packages and prints a summary table.

param(
  [string]$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path
)

$ErrorActionPreference = "Stop"

Set-Location $ProjectRoot

$packages = @(
  @{
    Name = "@hasan-shop/api"
    CoveragePath = "apps/api/coverage/coverage-summary.json"
    Target = 85
  },
  @{
    Name = "@hasan-shop/shared"
    CoveragePath = "packages/shared/coverage/coverage-summary.json"
    Target = 80
  },
  @{
    Name = "@hasan-shop/carrier-adapters"
    CoveragePath = "packages/carrier-adapters/coverage/coverage-summary.json"
    Target = 80
  }
)

$results = @()

function Get-CoveragePercent {
  param([string]$SummaryPath)

  if (-not (Test-Path $SummaryPath)) {
    return $null
  }

  $summary = Get-Content $SummaryPath -Raw | ConvertFrom-Json
  $total = $summary.total
  if ($null -eq $total -or $total.statements.total -eq 0) {
    return 0
  }
  return [math]::Round(($total.statements.pct), 1)
}

Write-Host "=== HASAN SHOP Coverage Report ===" -ForegroundColor Cyan
Write-Host "Project: $ProjectRoot"
Write-Host ""

foreach ($pkg in $packages) {
  Write-Host "Running $($pkg.Name) test:ci..." -ForegroundColor Yellow
  $prevErrorAction = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  pnpm --filter $pkg.Name test:ci 2>&1 | Out-Host
  $exitCode = $LASTEXITCODE
  $ErrorActionPreference = $prevErrorAction

  $coveragePct = $null
  if ($pkg.CoveragePath) {
    $fullPath = Join-Path $ProjectRoot $pkg.CoveragePath
    $coveragePct = Get-CoveragePercent -SummaryPath $fullPath
  }

  $status = if ($exitCode -eq 0) { "PASS" } else { "FAIL" }
  $targetMet = if ($null -ne $coveragePct) { $coveragePct -ge $pkg.Target } else { $null }

  $results += [PSCustomObject]@{
    Package = $pkg.Name
    Tests = $status
    Statements = if ($null -ne $coveragePct) { "$coveragePct%" } else { "n/a" }
    Target = "$($pkg.Target)%"
    'Target Met' = if ($null -eq $targetMet) { "n/a" } elseif ($targetMet) { "YES" } else { "NO" }
  }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize

$failedTests = $results | Where-Object { $_.Tests -eq "FAIL" }
$missedTargets = $results | Where-Object { $_.'Target Met' -eq "NO" }

if ($failedTests.Count -gt 0) {
  Write-Host "FAILED: One or more packages had test failures." -ForegroundColor Red
  exit 1
}

if ($missedTargets.Count -gt 0) {
  Write-Host "WARNING: Coverage targets not met for:" ($missedTargets.Package -join ", ") -ForegroundColor Yellow
}

$withCoverage = $results | Where-Object { $_.Statements -ne "n/a" }
if ($withCoverage.Count -gt 0) {
  $avg = ($withCoverage | ForEach-Object { [double]($_.Statements -replace '%', '') } | Measure-Object -Average).Average
  Write-Host ("Aggregate statement coverage (packages with reports): {0:N1}%" -f $avg) -ForegroundColor Green
}

Write-Host "Done." -ForegroundColor Green
exit 0
