# start-dev.ps1 — menjalankan backend (Go) & frontend (Vite) sekaligus.
# Jalankan dari folder d:\kostum :  powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
# Pastikan MySQL Laragon sudah berjalan.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

# Tambahkan Go & Node ke PATH bila belum ada.
if (-not (Get-Command go -ErrorAction SilentlyContinue))   { $env:Path = "C:\Program Files\Go\bin;"   + $env:Path }
if (-not (Get-Command npm -ErrorAction SilentlyContinue))  { $env:Path = "C:\Program Files\nodejs;"  + $env:Path }

Write-Host "==> Menjalankan backend Go (http://localhost:8080)..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit","-Command","cd '$root\backend'; go run ." -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "==> Menjalankan frontend React + Vite (http://localhost:5173)..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit","-Command","cd '$root\frontend'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "Frontend : http://localhost:5173" -ForegroundColor Green
Write-Host "Admin    : http://localhost:5173/admin  (admin / admin123)" -ForegroundColor Green
Write-Host "API      : http://localhost:8080/api" -ForegroundColor Green
