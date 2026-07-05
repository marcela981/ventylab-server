# ============================================
# Regenerate Prisma Client
# ============================================
# Run this script after restarting your IDE or terminal
# to complete the Prisma Client regeneration.
#
# The schema has been updated to:
# - Remove the deprecated `progress` relation from User model
# - Use ONLY `learningProgress` for all progress tracking
#
# This script will:
# 1. Stop any running Node processes
# 2. Remove old Prisma Client
# 3. Regenerate Prisma Client with new schema

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Regenerating Prisma Client" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill any running Node processes (optional safety measure)
Write-Host "Step 1: Checking for running Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node processes. Stopping them..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "✓ Stopped Node processes" -ForegroundColor Green
} else {
    Write-Host "✓ No Node processes running" -ForegroundColor Green
}
Write-Host ""

# Step 2: Remove old Prisma Client
Write-Host "Step 2: Removing old Prisma Client..." -ForegroundColor Yellow
$prismaPath = ".\node_modules\.prisma"
if (Test-Path $prismaPath) {
    Remove-Item -Recurse -Force $prismaPath -ErrorAction SilentlyContinue
    Write-Host "✓ Removed old Prisma Client" -ForegroundColor Green
} else {
    Write-Host "✓ No old Prisma Client found" -ForegroundColor Green
}
Write-Host ""

# Step 3: Regenerate Prisma Client
Write-Host "Step 3: Generating new Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "✓ SUCCESS: Prisma Client regenerated!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Start your backend server: npm run dev" -ForegroundColor White
    Write-Host "2. Test progress endpoints to confirm they work" -ForegroundColor White
    Write-Host "3. Enter a lesson in the frontend to verify 404 is fixed" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "✗ ERROR: Prisma Client generation failed" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try the following:" -ForegroundColor Yellow
    Write-Host "1. Close your IDE completely" -ForegroundColor White
    Write-Host "2. Restart your computer" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
}
