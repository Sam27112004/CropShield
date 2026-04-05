param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"

function Assert-Condition {
    param(
        [bool]$Condition,
        [string]$Message
    )
    if (-not $Condition) {
        throw $Message
    }
}

function Assert-LastExitCode {
    param([string]$Step)
    if ($LASTEXITCODE -ne 0) {
        throw "$Step failed with exit code $LASTEXITCODE"
    }
}

Write-Host "[1/8] Checking required frontend API client..."
$apiClientPath = Join-Path $RepoRoot "frontend/src/lib/api.ts"
Assert-Condition (Test-Path $apiClientPath) "Missing required file: $apiClientPath"

Write-Host "[2/8] Checking migration chain (head/current)..."
Push-Location (Join-Path $RepoRoot "backend")
& ".\.venv\Scripts\python.exe" -m alembic heads
Assert-LastExitCode "alembic heads"
& ".\.venv\Scripts\python.exe" -m alembic current
Assert-LastExitCode "alembic current"
Pop-Location

Write-Host "[3/8] Checking tracked .env files..."
Push-Location $RepoRoot
$trackedEnv = git ls-files ".env*"
Pop-Location
Assert-Condition ([string]::IsNullOrWhiteSpace(($trackedEnv -join ""))) "Tracked env files found:`n$($trackedEnv -join "`n")"

Write-Host "[4/8] Checking backend entry import/syntax..."
Push-Location (Join-Path $RepoRoot "backend")
& ".\.venv\Scripts\python.exe" -m py_compile app/main.py
Assert-LastExitCode "py_compile app/main.py"
Pop-Location

Write-Host "[5/8] Checking frontend TypeScript..."
Push-Location (Join-Path $RepoRoot "frontend")
npx tsc --noEmit
Assert-LastExitCode "frontend tsc"
Pop-Location

Write-Host "[6/8] Checking frontend lint..."
Push-Location (Join-Path $RepoRoot "frontend")
npm run -s lint
Assert-LastExitCode "frontend lint"
Pop-Location

Write-Host "[7/8] Checking backend tests..."
Push-Location (Join-Path $RepoRoot "backend")
& ".\.venv\Scripts\python.exe" -m pytest -q
Assert-LastExitCode "backend tests"
Pop-Location

Write-Host "[8/8] Checking for debug print/log leftovers..."
$frontendRoot = Join-Path $RepoRoot "frontend/src"
$backendRoot = Join-Path $RepoRoot "backend/app"
$patterns = @("console\.log\(", "print\(")

$matches = @()
if (Test-Path $frontendRoot) {
    $matches += Get-ChildItem -Path $frontendRoot -Recurse -File |
        Select-String -Pattern $patterns -AllMatches -CaseSensitive:$false
}
if (Test-Path $backendRoot) {
    $matches += Get-ChildItem -Path $backendRoot -Recurse -File |
        Select-String -Pattern $patterns -AllMatches -CaseSensitive:$false
}

Assert-Condition ($matches.Count -eq 0) "Debug statements found:`n$($matches | ForEach-Object { \"$($_.Path):$($_.LineNumber): $($_.Line.Trim())\" } | Out-String)"

Write-Host "Health check passed."
