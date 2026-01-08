# Plan de Limpieza - Proyecto VentyLab (ventilab-web)

**Fecha de análisis:** $(date)
**Proyecto a limpiar:** ventilab-web (frontend)
**Proyecto destino:** ventylab-server (backend)

---

## RESUMEN EJECUTIVO

**Hallazgo principal:** El proyecto `ventilab-web` **NO tiene una carpeta backend separada**. Es un proyecto Next.js puro (frontend) sin backend independiente. Sin embargo, hay **servicios de IA** que fueron migrados al backend y que **pueden seguir siendo útiles en el frontend** para uso directo en el cliente.

**Conclusión:** **NO hay archivos backend obvios para eliminar**. Los servicios de IA pueden mantenerse en el frontend si se usan directamente en el cliente. Se requiere **revisión manual** para determinar si estos servicios se usan en el frontend.

---

## CATEGORÍA 1 - ELIMINAR: Archivos Backend Migrados Completamente

### ❌ NO HAY ARCHIVOS EN ESTA CATEGORÍA

**Razón:** El proyecto original no tiene backend separado. No existe carpeta `backend/` o `server/` en `ventilab-web`.

**Verificación:**
- ❌ No existe `ventilab-web/backend/`
- ❌ No existe `ventilab-web/server/`
- ❌ No hay archivos de controladores en el frontend
- ❌ No hay archivos de rutas de backend en el frontend
- ❌ No hay imports directos desde backend

**Total de archivos:** 0

---

## CATEGORÍA 2 - ELIMINAR: Carpetas Backend Completas

### ❌ NO HAY CARPETAS EN ESTA CATEGORÍA

**Razón:** El proyecto original no tiene backend separado.

**Verificación:**
- ❌ No existe `ventilab-web/backend/`
- ❌ No existe `ventilab-web/server/`
- ❌ No existe `ventilab-web/src/backend/`
- ❌ No existe `ventilab-web/src/server/`

**Total de carpetas:** 0

---

## CATEGORÍA 3 - MANTENER: Archivos que Deben Quedarse en Frontend

### Archivos de Servicios de API (Frontend)

**Ubicación:** `src/service/api/`

**Archivos a mantener:**
1. ✅ `src/service/api/httpClient.js`
   - **Razón:** Cliente HTTP para comunicarse con el backend Express
   - **Estado:** Necesario para todas las llamadas al backend

2. ✅ `src/service/api/progressService.js`
   - **Razón:** Servicio del frontend que consume endpoints del backend
   - **Estado:** Necesario para funcionalidad de progreso

3. ✅ `src/service/api/evaluationService.js`
   - **Razón:** Servicio del frontend que consume endpoints del backend
   - **Estado:** Necesario para funcionalidad de evaluación

**Total de archivos a mantener:** 3

---

### Archivos de Configuración

**Archivos a mantener:**
1. ✅ `next.config.ts`
   - **Razón:** Configuración de Next.js
   - **Estado:** Necesario para el frontend

2. ✅ `package.json`
   - **Razón:** Dependencias del frontend
   - **Estado:** Necesario para el frontend

3. ✅ `tsconfig.json`
   - **Razón:** Configuración de TypeScript
   - **Estado:** Necesario para el frontend

4. ✅ `vercel.json`
   - **Razón:** Configuración de Vercel
   - **Estado:** Necesario para deployment

**Total de archivos a mantener:** 4

---

### Archivos de Documentación

**Archivos a mantener:**
1. ✅ `FRONTEND_BACKEND_INTEGRATION.md`
   - **Razón:** Documentación de integración frontend-backend
   - **Estado:** Útil para referencia

2. ✅ `README.md`
   - **Razón:** Documentación del proyecto
   - **Estado:** Necesario

**Total de archivos a mantener:** 2

---

### Páginas Next.js

**Archivos a mantener:**
1. ✅ `pages/_app.js`
2. ✅ `pages/dashboard.js`
3. ✅ `pages/evaluation.js`
4. ✅ `pages/evaluation/[caseId].jsx`
5. ✅ `pages/flashcards.js`
6. ✅ `pages/index.js`
7. ✅ `pages/settings.js`
8. ✅ `pages/teaching.js`
9. ✅ `pages/teaching/[moduleId]/[lessonId].js`

**Total de archivos a mantener:** 9

---

### Componentes y Hooks

**Archivos a mantener:**
- ✅ Todos los archivos en `src/components/`
- ✅ Todos los archivos en `src/hooks/` (excepto los que usan servicios de IA migrados)
- ✅ Todos los archivos en `src/contexts/`
- ✅ Todos los archivos en `src/utils/`
- ✅ Todos los archivos en `src/data/`
- ✅ Todos los archivos en `src/constants/`
- ✅ Todos los archivos en `src/types/`
- ✅ Todos los archivos en `src/styles/`
- ✅ Todos los archivos en `src/theme/`

**Razón:** Son parte del frontend y no fueron migrados al backend.

---

## CATEGORÍA 4 - REVISAR MANUALMENTE: Archivos con Dependencias

### Servicios de IA (src/service/ai/)

**Ubicación:** `src/service/ai/`

**Archivos encontrados:**
1. ⚠️ `src/service/ai/AIServiceManager.js`
2. ⚠️ `src/service/ai/FallbackManager.js`
3. ⚠️ `src/service/ai/PromptTemplateManager.js`
4. ⚠️ `src/service/ai/ResponseParser.js`
5. ⚠️ `src/service/ai/providers/GeminiProvider.js`
6. ⚠️ `src/service/ai/providers/OpenAIProvider.js`
7. ⚠️ `src/service/ai/providers/ClaudeProvider.js`
8. ⚠️ `src/service/ai/providers/OllamaProvider.js`

**Estado:** ⚠️ **REQUIERE REVISIÓN MANUAL**

**Razón:**
- Estos servicios fueron migrados al backend (`ventylab-server/src/services/ai/`)
- PERO pueden seguir siendo útiles en el frontend si se usan directamente en el cliente
- Necesita verificarse si hay componentes o hooks que los usen

**Búsqueda de referencias:**
- ✅ `src/hooks/ai/useAIFeedback.js` - Usa `AIServiceManager`
- ⚠️ Necesita verificar si `useAIFeedback` se usa en componentes

**Recomendación:**
1. Buscar todas las referencias a estos servicios en el frontend
2. Si NO se usan, pueden eliminarse
3. Si se usan, mantenerlos (son servicios del cliente)

**Total de archivos a revisar:** 8

---

### Hooks de IA (src/hooks/ai/)

**Archivos encontrados:**
1. ⚠️ `src/hooks/ai/useAIFeedback.js`
2. ⚠️ `src/hooks/ai/useAIModels.js`
3. ⚠️ `src/hooks/ai/useLearningAnalytics.js`
4. ⚠️ `src/hooks/ai/usePromptManager.js`

**Estado:** ⚠️ **REQUIERE REVISIÓN MANUAL**

**Razón:**
- Estos hooks pueden usar servicios de IA del frontend
- Necesita verificarse si se usan en componentes
- Si la funcionalidad de IA se mueve completamente al backend, estos hooks pueden no ser necesarios

**Recomendación:**
1. Buscar referencias a estos hooks en componentes
2. Si NO se usan, pueden eliminarse
3. Si se usan, mantenerlos o actualizarlos para usar el backend

**Total de archivos a revisar:** 4

---

### Constantes de IA (src/constants/ai/)

**Archivos encontrados:**
1. ⚠️ `src/constants/ai/aiModelConfigs.js`
2. ⚠️ `src/constants/ai/feedbackCategories.js`
3. ⚠️ `src/constants/ai/medicalValidationRules.js`
4. ⚠️ `src/constants/ai/promptTemplates.js`

**Estado:** ⚠️ **REQUIERE REVISIÓN MANUAL**

**Razón:**
- Estas constantes pueden ser usadas por servicios de IA del frontend
- Pueden ser referenciadas por hooks o componentes
- Necesita verificarse si se usan

**Recomendación:**
1. Buscar referencias a estas constantes
2. Si NO se usan, pueden eliminarse
3. Si se usan, mantenerlas o migrarlas al backend si es apropiado

**Total de archivos a revisar:** 4

---

### Utilidades de IA (src/utils/ai/)

**Archivos encontrados:**
1. ⚠️ `src/utils/ai/feedbackFormatters.js`
2. ⚠️ `src/utils/ai/medicalTermsProcessor.js`
3. ⚠️ `src/utils/ai/promptBuilders.js`
4. ⚠️ `src/utils/ai/responseValidators.js`

**Estado:** ⚠️ **REQUIERE REVISIÓN MANUAL**

**Razón:**
- Estas utilidades pueden ser usadas por servicios de IA del frontend
- Pueden ser referenciadas por hooks o componentes
- Necesita verificarse si se usan

**Recomendación:**
1. Buscar referencias a estas utilidades
2. Si NO se usan, pueden eliminarse
3. Si se usan, mantenerlas o migrarlas al backend si es apropiado

**Total de archivos a revisar:** 4

---

## RESUMEN POR CATEGORÍA

### CATEGORÍA 1 - Eliminar (Backend migrado)
- **Total:** 0 archivos
- **Razón:** No hay backend en el proyecto original

### CATEGORÍA 2 - Eliminar (Carpetas backend)
- **Total:** 0 carpetas
- **Razón:** No hay carpetas backend en el proyecto original

### CATEGORÍA 3 - Mantener
- **Total:** 18+ archivos (servicios API, configuración, páginas, componentes)
- **Razón:** Son parte del frontend y son necesarios

### CATEGORÍA 4 - Revisar manualmente
- **Total:** 20 archivos
  - 8 archivos en `src/service/ai/`
  - 4 archivos en `src/hooks/ai/`
  - 4 archivos en `src/constants/ai/`
  - 4 archivos en `src/utils/ai/`

---

## ANÁLISIS DETALLADO DE REFERENCIAS

### Búsqueda de Referencias a Servicios de IA

**Patrones buscados:**
- `import.*AIServiceManager`
- `from.*service/ai`
- `useAIFeedback`
- `GeminiProvider`

**Resultados:**
- ✅ `src/hooks/ai/useAIFeedback.js` - Importa `AIServiceManager`
- ⚠️ Necesita verificar si `useAIFeedback` se usa en componentes

**Recomendación:** Ejecutar búsqueda exhaustiva antes de eliminar.

---

## SCRIPT DE LIMPIEZA

### Script Shell para Eliminación

**Archivo:** `cleanup-frontend.sh`

**Funcionalidad:**
- Modo `--dry-run` para simular sin eliminar
- Log de operaciones
- Verificación de referencias antes de eliminar
- Confirmación interactiva

**Nota:** Como no hay archivos obvios para eliminar, el script será principalmente para revisión manual.

---

## RECOMENDACIONES FINALES

### 🔴 Alta Prioridad

**Ninguna** - No hay archivos backend obvios para eliminar.

### 🟡 Media Prioridad

1. **Revisar servicios de IA del frontend**
   - Verificar si se usan en componentes
   - Si NO se usan, pueden eliminarse
   - Si se usan, mantenerlos o actualizarlos para usar el backend

2. **Revisar hooks de IA**
   - Verificar si se usan en componentes
   - Si NO se usan, pueden eliminarse
   - Si se usan, mantenerlos o actualizarlos

3. **Revisar constantes y utilidades de IA**
   - Verificar si se usan
   - Si NO se usan, pueden eliminarse
   - Si se usan, mantenerlas o migrarlas al backend

### 🟢 Baja Prioridad

4. **Limpiar archivos no utilizados**
   - Buscar archivos sin referencias
   - Eliminar archivos obsoletos
   - Actualizar documentación

---

## CONCLUSIÓN

**Estado General:** ⚠️ **REQUIERE REVISIÓN MANUAL**

El proyecto `ventilab-web` **NO tiene backend separado** para eliminar. Sin embargo, hay **servicios de IA** que fueron migrados al backend y que **pueden seguir siendo útiles en el frontend**.

**Próximos Pasos:**
1. Ejecutar búsqueda exhaustiva de referencias a servicios de IA
2. Determinar si los servicios de IA se usan en el frontend
3. Si NO se usan, eliminarlos
4. Si se usan, mantenerlos o actualizarlos para usar el backend

**No se recomienda eliminar archivos sin verificar referencias primero.**

