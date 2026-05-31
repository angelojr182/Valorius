# run.ps1 — Valorius Scraper
# Ejecutar desde la raiz del proyecto: .\scripts\run.ps1

$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host ""
Write-Host "=== VALORIUS SCRAPER ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Portal disponible: Rentify.hn" -ForegroundColor White
Write-Host ""
Write-Host "  [1] Rentify - Apartamentos" -ForegroundColor Green
Write-Host "  [2] Rentify - Casas" -ForegroundColor Green
Write-Host ""

$opcion = Read-Host "Elige una opcion (1-2)"

switch ($opcion) {
    "1" {
        Write-Host "`nIniciando scraper de APARTAMENTOS..." -ForegroundColor Cyan
        python scripts\rentify\apartamentos.py
    }
    "2" {
        Write-Host "`nIniciando scraper de CASAS..." -ForegroundColor Cyan
        python scripts\rentify\casas.py
    }
    default {
        Write-Host "Opcion invalida." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`nRevisa el CSV en: outputs\" -ForegroundColor Green
Start-Process explorer.exe "$root\outputs"
