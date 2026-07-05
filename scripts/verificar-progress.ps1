# =============================================================================
# Verificación final del sistema de progreso
# =============================================================================
# Ejecutar con el servidor corriendo (npm run dev)
# =============================================================================

$BASE = "http://localhost:3001"
$API = "$BASE/api"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Verificación del sistema de progreso" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Necesitas un token válido - obténlo haciendo login
Write-Host "IMPORTANTE: Necesitas un token JWT válido." -ForegroundColor Yellow
Write-Host "  option A: Hacer login en el frontend y copiar el token" -ForegroundColor Gray
Write-Host "  option B: Hacer POST a $API/auth/login con email/password" -ForegroundColor Gray
Write-Host ""

$token = $env:PROGRESS_TEST_TOKEN
if (-not $token) {
    Write-Host "Ejemplo manual:" -ForegroundColor Yellow
    Write-Host '  $token = "tu-jwt-aqui"' -ForegroundColor Gray
    Write-Host '  $headers = @{ Authorization = "Bearer $token"; "x-user-id" = "user-id-aqui" }' -ForegroundColor Gray
    Write-Host '  Invoke-RestMethod -Uri "$API/progress/lesson/cualquier-id" -Headers $headers' -ForegroundColor Gray
    Write-Host ""
    Write-Host "O exporta: `$env:PROGRESS_TEST_TOKEN = 'tu-token'" -ForegroundColor Gray
    Write-Host ""
}

# Si hay token, ejecutar pruebas
if ($token) {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    Write-Host "1. GET /api/progress/lesson/:id (debe devolver 200 siempre)" -ForegroundColor White
    try {
        $r = Invoke-WebRequest -Uri "$API/progress/lesson/test-lesson-id" -Headers $headers -UseBasicParsing
        if ($r.StatusCode -eq 200) {
            Write-Host "   OK - Status 200" -ForegroundColor Green
            Write-Host "   Response: $($r.Content)" -ForegroundColor Gray
        } else {
            Write-Host "   FALLO - Status $($r.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "   Error: $_" -ForegroundColor Red
    }
    Write-Host ""

    Write-Host "2. GET /api/progress/overview (debe devolver 200)" -ForegroundColor White
    try {
        $r = Invoke-WebRequest -Uri "$API/progress/overview" -Headers $headers -UseBasicParsing
        if ($r.StatusCode -eq 200) {
            Write-Host "   OK - Status 200" -ForegroundColor Green
        } else {
            Write-Host "   FALLO - Status $($r.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "   Error: $_" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Checklist de verificación manual" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[ ] No aparece '(not available)' en errores" -ForegroundColor White
Write-Host "[ ] No aparece 'progress' en logs de Prisma (solo learning_progress, lesson_progress)" -ForegroundColor White
Write-Host "[ ] Entrar a una lección crea progreso automáticamente" -ForegroundColor White
Write-Host "[ ] GET /api/progress/lesson/:id devuelve 200 siempre" -ForegroundColor White
Write-Host ""
