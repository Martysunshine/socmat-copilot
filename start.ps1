# SOCMAT Copilot Workbench — one-command startup
# Usage: Right-click > "Run with PowerShell"  OR  .\start.ps1 in terminal

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host ""
Write-Host "  SOCMAT Copilot Workbench" -ForegroundColor Cyan
Write-Host "  ─────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ── 1. Docker check ───────────────────────────────────────────────────────────
Write-Host "  Checking Docker..." -ForegroundColor Gray
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Write-Host ""
    Write-Host "  [ERROR] Docker Desktop is not running." -ForegroundColor Red
    Write-Host "  Start Docker Desktop and try again." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "  Press Enter to exit"
    exit 1
}
Write-Host "  Docker is running." -ForegroundColor Green

# ── 2. .env check ────────────────────────────────────────────────────────────
$envFile = Join-Path $root "services\api\.env"
$envExample = Join-Path $root "services\api\.env.example"

if (-not (Test-Path $envFile)) {
    Write-Host ""
    Write-Host "  [SETUP] No .env file found — creating from template." -ForegroundColor Yellow
    Copy-Item $envExample $envFile
    Write-Host "  Created: services\api\.env" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  The app will start in mock AI mode (no API key required)." -ForegroundColor Gray
    Write-Host "  To use Groq / Splunk / Elastic, edit services\api\.env and" -ForegroundColor Gray
    Write-Host "  re-run this script." -ForegroundColor Gray
    Write-Host ""
}

# ── 3. Start containers ───────────────────────────────────────────────────────
Write-Host "  [1/3] Building and starting containers..." -ForegroundColor Cyan
Push-Location $root
docker compose up --build -d
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host ""
    Write-Host "  [ERROR] docker compose failed. Check the output above." -ForegroundColor Red
    Write-Host "  Common fix: docker compose down, then re-run this script." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "  Press Enter to exit"
    exit 1
}
Pop-Location

# ── 4. Wait for backend ───────────────────────────────────────────────────────
Write-Host "  [2/3] Waiting for backend to be ready..." -ForegroundColor Cyan
$timeout = 90
$elapsed = 0
$healthy = $false

while (-not $healthy -and $elapsed -lt $timeout) {
    Start-Sleep -Seconds 3
    $elapsed += 3
    try {
        $resp = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 2 -ErrorAction Stop
        $healthy = $true
    } catch {
        Write-Host "  Waiting... ($elapsed s)" -ForegroundColor DarkGray
    }
}

if (-not $healthy) {
    Write-Host ""
    Write-Host "  [WARNING] Backend is taking longer than expected." -ForegroundColor Yellow
    Write-Host "  Check logs with: docker compose logs backend" -ForegroundColor Gray
} else {
    Write-Host "  Backend ready." -ForegroundColor Green
}

# ── 5. Open browser ───────────────────────────────────────────────────────────
Write-Host "  [3/3] Opening browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "  ─────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  SOCMAT Copilot is running!" -ForegroundColor Green
Write-Host ""
Write-Host "  App       http://localhost:5173" -ForegroundColor White
Write-Host "  API       http://localhost:8000" -ForegroundColor White
Write-Host "  API docs  http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "  To stop:  docker compose down" -ForegroundColor DarkGray
Write-Host "  Logs:     docker compose logs -f" -ForegroundColor DarkGray
Write-Host ""
