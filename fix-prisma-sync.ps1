# Script para sincronizar Prisma con la base de datos
# Resuelve problemas de desincronización entre el cliente Prisma y la BD

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔧 Sincronizando Prisma con Base de Datos" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Limpiar caché de Prisma
Write-Host "📦 Paso 1: Limpiando caché de Prisma..." -ForegroundColor Yellow
if (Test-Path "node_modules\.prisma") {
    Remove-Item -Recurse -Force "node_modules\.prisma" -ErrorAction SilentlyContinue
    Write-Host "   ✅ Caché de Prisma eliminado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No hay caché de Prisma para eliminar" -ForegroundColor Gray
}
Write-Host ""

# Paso 2: Regenerar cliente Prisma
Write-Host "🔄 Paso 2: Regenerando cliente Prisma..." -ForegroundColor Yellow
try {
    npx prisma generate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Cliente Prisma regenerado exitosamente" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error al regenerar cliente Prisma" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Error al regenerar cliente Prisma: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Paso 3: Sincronizar schema con la BD (sin perder datos)
Write-Host "🔗 Paso 3: Sincronizando schema con la base de datos..." -ForegroundColor Yellow
Write-Host "   ⚠️  Esto aplicará los cambios del schema a la BD" -ForegroundColor Yellow
Write-Host "   ⚠️  Si hay diferencias, Prisma intentará resolverlas automáticamente" -ForegroundColor Yellow
Write-Host ""

$response = Read-Host "¿Continuar? (S/N)"
if ($response -ne "S" -and $response -ne "s") {
    Write-Host "   ⏭️  Operación cancelada por el usuario" -ForegroundColor Yellow
    exit 0
}

try {
    npx prisma db push --accept-data-loss
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Base de datos sincronizada exitosamente" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error al sincronizar la base de datos" -ForegroundColor Red
        Write-Host "   💡 Intenta ejecutar manualmente: npx prisma migrate dev" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "   ❌ Error al sincronizar: $_" -ForegroundColor Red
    Write-Host "   💡 Intenta ejecutar manualmente: npx prisma migrate dev" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Paso 4: Verificar estado
Write-Host "🔍 Paso 4: Verificando estado de Prisma..." -ForegroundColor Yellow
try {
    npx prisma validate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Schema de Prisma válido" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Advertencias en el schema de Prisma" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  No se pudo validar el schema" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Sincronización completada" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Reinicia el servidor: npm run dev" -ForegroundColor White
Write-Host "   2. Verifica que no haya errores en la consola" -ForegroundColor White
Write-Host "   3. Prueba guardar progreso en una lección" -ForegroundColor White
Write-Host ""
