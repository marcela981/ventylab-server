#!/usr/bin/env bash
# ============================================================================
# scripts/dev-up.sh
# ----------------------------------------------------------------------------
# Levanta el backend de VentyLab en modo desarrollo de forma idempotente.
#
# Pasos (fail-fast):
#   (a) Verifica variables de entorno requeridas (DATABASE_URL, NEXTAUTH_SECRET,
#       NEXTAUTH_URL, JWT_SECRET).
#   (b) Genera el cliente de Prisma si falta o está desactualizado.
#   (c) Aplica migraciones pendientes (prisma migrate deploy).
#   (d) Verifica que el puerto 4000 no esté ocupado por otro proceso, y arranca
#       el backend con `npm run dev`.
#
# Uso:
#   bash scripts/dev-up.sh                # arranque normal
#   SKIP_MIGRATIONS=1 bash scripts/dev-up.sh   # omitir migraciones
#   PORT=4001 bash scripts/dev-up.sh           # cambiar puerto
#
# Requisitos: bash, node, npm, npx, curl/nc opcional para la verificación
# de puerto. En Windows usa Git Bash o WSL.
# ============================================================================

set -euo pipefail

# --- Colores para output legible ---
if [[ -t 1 ]]; then
  RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'
  BLUE=$'\033[0;34m'; BOLD=$'\033[1m'; RESET=$'\033[0m'
else
  RED=""; GREEN=""; YELLOW=""; BLUE=""; BOLD=""; RESET=""
fi

log()   { echo "${BLUE}[dev-up]${RESET} $*"; }
ok()    { echo "${GREEN}[dev-up] ✓${RESET} $*"; }
warn()  { echo "${YELLOW}[dev-up] ⚠${RESET} $*"; }
fatal() { echo "${RED}${BOLD}[dev-up] ✗ $*${RESET}" >&2; exit 1; }

# ----------------------------------------------------------------------------
# 0. Resolver raíz del proyecto (script puede invocarse desde cualquier cwd)
# ----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"
log "Project root: $PROJECT_ROOT"

# ----------------------------------------------------------------------------
# (a) Verificar variables de entorno requeridas
# ----------------------------------------------------------------------------
# Política: única fuente de verdad → .env en la raíz del proyecto.
# No usar .env.development / .env.production en local.
log "Paso (a): verificando variables de entorno..."

ENV_FILE=".env"
if [[ ! -f "$ENV_FILE" ]]; then
  fatal "No se encontró .env en $PROJECT_ROOT.
       Crea uno con al menos: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, JWT_SECRET."
fi
ok "Archivo de entorno detectado: $ENV_FILE (única fuente de verdad)"

# Cargar el archivo en el entorno actual sin filtrar comentarios ni romper en
# valores con '=' embebido (e.g. JWT base64).
set -a
# shellcheck disable=SC1090
source <(grep -v '^[[:space:]]*#' "$ENV_FILE" | grep -E '^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*=' || true)
set +a

REQUIRED_VARS=(DATABASE_URL NEXTAUTH_SECRET NEXTAUTH_URL JWT_SECRET)
MISSING=()
for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    MISSING+=("$var")
  fi
done

if (( ${#MISSING[@]} > 0 )); then
  fatal "Variables de entorno faltantes en $ENV_FILE: ${MISSING[*]}"
fi
ok "Todas las variables requeridas están presentes (${REQUIRED_VARS[*]})"

# ----------------------------------------------------------------------------
# (b) Generar Prisma Client si falta o está desactualizado
# ----------------------------------------------------------------------------
log "Paso (b): verificando Prisma Client..."

if [[ ! -f "prisma/schema.prisma" ]]; then
  fatal "No se encontró prisma/schema.prisma. ¿Estás en el repo correcto?"
fi

PRISMA_CLIENT="node_modules/.prisma/client/index.js"
NEEDS_GENERATE=0
if [[ ! -f "$PRISMA_CLIENT" ]]; then
  NEEDS_GENERATE=1
  warn "Prisma Client no encontrado en $PRISMA_CLIENT"
elif [[ "prisma/schema.prisma" -nt "$PRISMA_CLIENT" ]]; then
  NEEDS_GENERATE=1
  warn "schema.prisma más reciente que el client generado"
fi

if (( NEEDS_GENERATE == 1 )); then
  log "Ejecutando: npx prisma generate"
  npx prisma generate || fatal "Falló 'prisma generate'. Revisa prisma/schema.prisma."
  ok "Prisma Client generado"
else
  ok "Prisma Client ya está actualizado (skip)"
fi

# ----------------------------------------------------------------------------
# (c) Aplicar migraciones pendientes
# ----------------------------------------------------------------------------
if [[ "${SKIP_MIGRATIONS:-0}" == "1" ]]; then
  warn "Paso (c): SKIP_MIGRATIONS=1 → omitiendo 'prisma migrate deploy'"
else
  log "Paso (c): aplicando migraciones pendientes (prisma migrate deploy)..."
  if [[ ! -d "prisma/migrations" ]]; then
    warn "No existe prisma/migrations/. Saltando 'migrate deploy'."
  else
    npx prisma migrate deploy || fatal "Falló 'prisma migrate deploy'. Revisa la conexión a la DB."
    ok "Migraciones aplicadas"
  fi
fi

# ----------------------------------------------------------------------------
# (d) Verificar que el puerto no esté ocupado y arrancar
# ----------------------------------------------------------------------------
PORT="${PORT:-4000}"
log "Paso (d): verificando que el puerto $PORT esté libre..."

port_in_use() {
  local p="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$p" -sTCP:LISTEN -Pn >/dev/null 2>&1 && return 0 || return 1
  fi
  if command -v ss >/dev/null 2>&1; then
    ss -ltn "( sport = :$p )" 2>/dev/null | tail -n +2 | grep -q . && return 0 || return 1
  fi
  if command -v netstat >/dev/null 2>&1; then
    netstat -ano 2>/dev/null | grep -E "[:.]$p[[:space:]].*LISTEN" >/dev/null && return 0 || return 1
  fi
  warn "No hay lsof/ss/netstat disponibles; no se puede verificar el puerto"
  return 1
}

if port_in_use "$PORT"; then
  if curl -fsS --max-time 3 "http://localhost:$PORT/health" >/dev/null 2>&1; then
    ok "Backend ya corriendo en puerto $PORT y respondiendo /health → 200. Nada que hacer."
    exit 0
  else
    fatal "Puerto $PORT ocupado pero /health no responde. Mata el proceso antes de relanzar.
       En Windows: netstat -ano | findstr :$PORT  →  taskkill /F /PID <pid>
       En macOS/Linux: lsof -iTCP:$PORT -sTCP:LISTEN -Pn  →  kill -9 <pid>"
  fi
fi
ok "Puerto $PORT libre"

# ----------------------------------------------------------------------------
# Arrancar el backend
# ----------------------------------------------------------------------------
log "Arrancando 'npm run dev'..."
exec npm run dev
