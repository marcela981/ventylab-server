#!/bin/bash

# =============================================================================
# Script de Limpieza del Frontend - VentyLab
# =============================================================================
# 
# Este script elimina archivos del proyecto frontend (ventilab-web) que fueron
# migrados al backend (ventylab-server).
#
# IMPORTANTE: Este script NO elimina archivos por defecto. Usa --dry-run para
# simular o --execute para eliminar realmente.
#
# Uso:
#   ./cleanup-frontend.sh --dry-run    # Simular sin eliminar
#   ./cleanup-frontend.sh --execute    # Eliminar realmente
#
# =============================================================================

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
DRY_RUN=true
LOG_FILE="cleanup-log-$(date +%Y%m%d-%H%M%S).txt"
FRONTEND_DIR="../ventilab-web"
FILES_DELETED=0
FILES_SKIPPED=0
ERRORS=0

# =============================================================================
# Funciones de utilidad
# =============================================================================

log() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    ((ERRORS++))
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Verificar si un archivo tiene referencias en el proyecto
check_references() {
    local file_path="$1"
    local file_name=$(basename "$file_path")
    local file_name_no_ext="${file_name%.*}"
    
    # Buscar referencias al archivo
    local references=$(grep -r "$file_name_no_ext\|$file_name" "$FRONTEND_DIR/src" \
        --exclude-dir=node_modules \
        --exclude-dir=.next \
        --exclude="$file_path" 2>/dev/null | wc -l)
    
    if [ "$references" -gt 0 ]; then
        return 1  # Tiene referencias
    else
        return 0  # No tiene referencias
    fi
}

# Eliminar archivo o directorio
delete_item() {
    local item_path="$1"
    local item_type="$2"  # "file" o "directory"
    local reason="$3"
    
    # Verificar que el item existe
    if [ ! -e "$item_path" ]; then
        warn "El item no existe: $item_path"
        ((FILES_SKIPPED++))
        return
    fi
    
    # Verificar referencias si es un archivo
    if [ "$item_type" = "file" ]; then
        if check_references "$item_path"; then
            warn "El archivo tiene referencias, se omite: $item_path"
            ((FILES_SKIPPED++))
            return
        fi
    fi
    
    if [ "$DRY_RUN" = true ]; then
        log "[DRY-RUN] Se eliminaría: $item_path ($reason)"
        ((FILES_DELETED++))
    else
        if [ "$item_type" = "directory" ]; then
            if rm -rf "$item_path" 2>/dev/null; then
                success "Eliminado directorio: $item_path ($reason)"
                ((FILES_DELETED++))
            else
                error "Error al eliminar directorio: $item_path"
            fi
        else
            if rm -f "$item_path" 2>/dev/null; then
                success "Eliminado archivo: $item_path ($reason)"
                ((FILES_DELETED++))
            else
                error "Error al eliminar archivo: $item_path"
            fi
        fi
    fi
}

# =============================================================================
# Verificación de argumentos
# =============================================================================

if [ "$1" = "--execute" ]; then
    DRY_RUN=false
    log "Modo EXECUTE: Se eliminarán archivos realmente"
    read -p "¿Estás seguro de continuar? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log "Operación cancelada por el usuario"
        exit 0
    fi
elif [ "$1" = "--dry-run" ] || [ -z "$1" ]; then
    DRY_RUN=true
    log "Modo DRY-RUN: Simulación sin eliminar archivos"
else
    echo "Uso: $0 [--dry-run|--execute]"
    echo "  --dry-run   Simular sin eliminar (por defecto)"
    echo "  --execute   Eliminar realmente"
    exit 1
fi

# =============================================================================
# Verificación de directorio frontend
# =============================================================================

if [ ! -d "$FRONTEND_DIR" ]; then
    error "Directorio frontend no encontrado: $FRONTEND_DIR"
    error "Asegúrate de ejecutar este script desde ventylab-server/"
    exit 1
fi

log "Directorio frontend: $FRONTEND_DIR"
log "Log file: $LOG_FILE"
log ""

# =============================================================================
# CATEGORÍA 1: Archivos Backend Migrados Completamente
# =============================================================================

log "=========================================="
log "CATEGORÍA 1: Archivos Backend Migrados"
log "=========================================="

# NOTA: No hay archivos en esta categoría porque el proyecto original
# no tiene backend separado. Esta sección está vacía intencionalmente.

log "No hay archivos backend para eliminar (el proyecto original no tiene backend)"
log ""

# =============================================================================
# CATEGORÍA 2: Carpetas Backend Completas
# =============================================================================

log "=========================================="
log "CATEGORÍA 2: Carpetas Backend Completas"
log "=========================================="

# NOTA: No hay carpetas en esta categoría porque el proyecto original
# no tiene backend separado. Esta sección está vacía intencionalmente.

log "No hay carpetas backend para eliminar (el proyecto original no tiene backend)"
log ""

# =============================================================================
# CATEGORÍA 4: Archivos que Requieren Revisión Manual
# =============================================================================

log "=========================================="
log "CATEGORÍA 4: Archivos que Requieren Revisión"
log "=========================================="
log ""
log "ADVERTENCIA: Estos archivos pueden estar en uso en el frontend."
log "Se recomienda revisar manualmente antes de eliminar."
log ""

# Servicios de IA
log "--- Servicios de IA (src/service/ai/) ---"
AI_SERVICE_FILES=(
    "$FRONTEND_DIR/src/service/ai/AIServiceManager.js"
    "$FRONTEND_DIR/src/service/ai/FallbackManager.js"
    "$FRONTEND_DIR/src/service/ai/PromptTemplateManager.js"
    "$FRONTEND_DIR/src/service/ai/ResponseParser.js"
    "$FRONTEND_DIR/src/service/ai/providers/GeminiProvider.js"
    "$FRONTEND_DIR/src/service/ai/providers/OpenAIProvider.js"
    "$FRONTEND_DIR/src/service/ai/providers/ClaudeProvider.js"
    "$FRONTEND_DIR/src/service/ai/providers/OllamaProvider.js"
)

for file in "${AI_SERVICE_FILES[@]}"; do
    if [ -f "$file" ]; then
        warn "Revisar manualmente: $file"
        warn "  - Verificar si se usa en componentes del frontend"
        warn "  - Si NO se usa, puede eliminarse"
        warn "  - Si se usa, mantenerlo o actualizarlo para usar el backend"
        log ""
    fi
done

# Hooks de IA
log "--- Hooks de IA (src/hooks/ai/) ---"
AI_HOOK_FILES=(
    "$FRONTEND_DIR/src/hooks/ai/useAIFeedback.js"
    "$FRONTEND_DIR/src/hooks/ai/useAIModels.js"
    "$FRONTEND_DIR/src/hooks/ai/useLearningAnalytics.js"
    "$FRONTEND_DIR/src/hooks/ai/usePromptManager.js"
)

for file in "${AI_HOOK_FILES[@]}"; do
    if [ -f "$file" ]; then
        warn "Revisar manualmente: $file"
        warn "  - Verificar si se usa en componentes del frontend"
        warn "  - Si NO se usa, puede eliminarse"
        warn "  - Si se usa, mantenerlo o actualizarlo para usar el backend"
        log ""
    fi
done

# Constantes de IA
log "--- Constantes de IA (src/constants/ai/) ---"
AI_CONSTANT_FILES=(
    "$FRONTEND_DIR/src/constants/ai/aiModelConfigs.js"
    "$FRONTEND_DIR/src/constants/ai/feedbackCategories.js"
    "$FRONTEND_DIR/src/constants/ai/medicalValidationRules.js"
    "$FRONTEND_DIR/src/constants/ai/promptTemplates.js"
)

for file in "${AI_CONSTANT_FILES[@]}"; do
    if [ -f "$file" ]; then
        warn "Revisar manualmente: $file"
        warn "  - Verificar si se usa en componentes del frontend"
        warn "  - Si NO se usa, puede eliminarse"
        warn "  - Si se usa, mantenerlo o migrarlo al backend si es apropiado"
        log ""
    fi
done

# Utilidades de IA
log "--- Utilidades de IA (src/utils/ai/) ---"
AI_UTIL_FILES=(
    "$FRONTEND_DIR/src/utils/ai/feedbackFormatters.js"
    "$FRONTEND_DIR/src/utils/ai/medicalTermsProcessor.js"
    "$FRONTEND_DIR/src/utils/ai/promptBuilders.js"
    "$FRONTEND_DIR/src/utils/ai/responseValidators.js"
)

for file in "${AI_UTIL_FILES[@]}"; do
    if [ -f "$file" ]; then
        warn "Revisar manualmente: $file"
        warn "  - Verificar si se usa en componentes del frontend"
        warn "  - Si NO se usa, puede eliminarse"
        warn "  - Si se usa, mantenerlo o migrarlo al backend si es apropiado"
        log ""
    fi
done

# =============================================================================
# Búsqueda de Referencias
# =============================================================================

log "=========================================="
log "Búsqueda de Referencias"
log "=========================================="
log ""

# Buscar referencias a AIServiceManager
log "Buscando referencias a AIServiceManager..."
AI_REFS=$(grep -r "AIServiceManager" "$FRONTEND_DIR/src" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude="*.md" 2>/dev/null | wc -l)

if [ "$AI_REFS" -gt 0 ]; then
    warn "Se encontraron $AI_REFS referencias a AIServiceManager"
    log "Archivos que referencian AIServiceManager:"
    grep -r "AIServiceManager" "$FRONTEND_DIR/src" \
        --exclude-dir=node_modules \
        --exclude-dir=.next \
        --exclude="*.md" 2>/dev/null | head -10 | tee -a "$LOG_FILE"
else
    success "No se encontraron referencias a AIServiceManager"
fi
log ""

# Buscar referencias a useAIFeedback
log "Buscando referencias a useAIFeedback..."
HOOK_REFS=$(grep -r "useAIFeedback" "$FRONTEND_DIR/src" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude="*.md" 2>/dev/null | wc -l)

if [ "$HOOK_REFS" -gt 0 ]; then
    warn "Se encontraron $HOOK_REFS referencias a useAIFeedback"
    log "Archivos que referencian useAIFeedback:"
    grep -r "useAIFeedback" "$FRONTEND_DIR/src" \
        --exclude-dir=node_modules \
        --exclude-dir=.next \
        --exclude="*.md" 2>/dev/null | head -10 | tee -a "$LOG_FILE"
else
    success "No se encontraron referencias a useAIFeedback"
fi
log ""

# =============================================================================
# Resumen Final
# =============================================================================

log "=========================================="
log "Resumen Final"
log "=========================================="
log ""

if [ "$DRY_RUN" = true ]; then
    log "Modo: DRY-RUN (simulación)"
    log "Para eliminar realmente, ejecuta: $0 --execute"
else
    log "Modo: EXECUTE (eliminación real)"
fi

log ""
log "Estadísticas:"
log "  - Archivos eliminados: $FILES_DELETED"
log "  - Archivos omitidos: $FILES_SKIPPED"
log "  - Errores: $ERRORS"
log ""
log "Log guardado en: $LOG_FILE"
log ""

if [ "$FILES_DELETED" -eq 0 ] && [ "$FILES_SKIPPED" -eq 0 ]; then
    warn "No se encontraron archivos para eliminar."
    warn "El proyecto original no tiene backend separado."
    warn "Los servicios de IA requieren revisión manual."
fi

log "=========================================="
log "Operación completada"
log "=========================================="

exit 0

