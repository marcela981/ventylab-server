# Script para regenerar Prisma Client
# Ejecutar este script después de detener el servidor
# También sincroniza el schema con la base de datos si es necesario

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔄 Regenerando Prisma Client" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Limpiar cliente anterior
Write-Host "📦 Limpiando caché de Prisma..." -ForegroundColor Yellow
if (Test-Path "node_modules\.prisma") {
    Remove-Item -Recurse -Force "node_modules\.prisma" -ErrorAction SilentlyContinue
    Write-Host "   ✅ Caché eliminado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No hay caché para eliminar" -ForegroundColor Gray
}
Write-Host ""

# Regenerar cliente
Write-Host "🔄 Generando nuevo cliente Prisma..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Prisma Client regenerado exitosamente!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error al regenerar Prisma Client" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Si el error menciona columnas inexistentes, ejecuta:" -ForegroundColor Yellow
    Write-Host "   .\fix-prisma-sync.ps1" -ForegroundColor White
    exit 1
}
Write-Host ""

# Validar schema
Write-Host "🔍 Validando schema..." -ForegroundColor Yellow
npx prisma validate
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Schema válido" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Advertencias en el schema" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Proceso completado" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Si aún tienes errores de columnas inexistentes:" -ForegroundColor Yellow
Write-Host "   Ejecuta: .\fix-prisma-sync.ps1" -ForegroundColor White
Write-Host ""
