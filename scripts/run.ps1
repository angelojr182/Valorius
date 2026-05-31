# run.ps1 — Valorius Scraper
# Ejecutar desde la raiz del proyecto: .\scripts\run.ps1

$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host "=== Valorius Scraper — Rentify.hn ===" -ForegroundColor Cyan
Write-Host "Iniciando..." -ForegroundColor Yellow

python scripts\scraper_rentify.py

Write-Host "`nRevisa el CSV en: outputs\" -ForegroundColor Green
Start-Process explorer.exe "$root\outputs"
