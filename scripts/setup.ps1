# setup.ps1 — Valorius Scraper Setup
# Ejecutar una sola vez para instalar dependencias

Write-Host "=== Valorius Scraper — Setup ===" -ForegroundColor Cyan

Write-Host "`nInstalando dependencias Python..." -ForegroundColor Yellow
pip install -r "$PSScriptRoot\requirements.txt"

Write-Host "`nInstalando Playwright Chromium..." -ForegroundColor Yellow
playwright install chromium

Write-Host "`nSetup completado." -ForegroundColor Green
Write-Host "Para correr el scraper: .\scripts\run.ps1" -ForegroundColor Cyan
