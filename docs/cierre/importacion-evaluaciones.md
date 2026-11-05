<!--
Funcionalidad: Importación de las evaluaciones alineadas con el currículo
Descripción: Procedimiento para importar en local y en producción las evaluaciones de julio vinculadas al currículo del Bloque B y las evaluaciones nuevas del Bloque C (ajustes C3) con prisma/import-evaluations.ts: requisitos, respaldo previo con pg_dump, corrida en seco, importación, verificación y reversión
Versión: 1.0
Autor: Marcela Mazo Castro
Proyecto: VentyLab
Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
Institución: Universidad del Valle
Contacto: marcela.mazo@correounivalle.edu.co
-->

# Importación de las evaluaciones alineadas con el currículo

`prisma/import-evaluations.ts` deja en la base:

- Las **41 evaluaciones de julio** (`prisma/seed-data/evaluation/**`) con su módulo y nivel del currículo vigente (`_coord/curriculo-ids.md`, Bloque B). Si una falta, la crea con los mismos ids que la migración `20261007120000_evaluation_feature`; si existe, **solo** cambia `module_id` y `level_id` (nunca el contenido, que pudo editar un docente).
- Las **13 evaluaciones nuevas** del Bloque C (`prisma/seed-data/evaluation-curriculum/c3-*.json`): un QUIZ por cada módulo sin quiz de julio, el taller y el examen final de Prerrequisitos. Se crean, o se sincronizan solo mientras no tengan intentos.
- Una **pregunta SIMULATION** en cada examen final de julio (`july-exam-simulation-questions.json`), solo si el examen no tiene intentos: agregar una pregunta cambiaría notas ya calculadas.

Todo queda en `READY` y **sin asignar** (el docente las asigna desde el constructor). Nunca borra filas. El contenido está pendiente de validación experta: [validacion-contenido.md](validacion-contenido.md#bloque-c).

Requisitos:

- El servidor con la migración `20261105130000_evaluation_results_release` (PR de C1) ya desplegado: la política de liberación de resultados debe estar activa antes de que existan evaluaciones nuevas en READY.
- El currículo del Bloque B importado (`prisma/import-curriculum.ts`). Sin sus módulos, el importador se detiene con el id del módulo que falta.

## Local

```bash
cd ventylab-server
npx tsx prisma/import-evaluations.ts            # corrida en seco: lista lo que crearía o vincularía
npx tsx prisma/import-evaluations.ts --apply    # escribe
npx tsx prisma/import-evaluations.ts --apply    # segunda vez: 0 creadas, 41 sin cambios (idempotente)
```

## Producción (no ejecutado: lo confirma Marcela)

Las variables se toman del entorno de la sesión y no se escriben en ningún archivo. `PROD_DIRECT_URL` es la cadena de conexión directa (no la del pooler) de la base de producción.

1. **Respaldo** (obligatorio, antes de cualquier escritura):

   ```bash
   pg_dump "$PROD_DIRECT_URL" --format=custom --no-owner --no-privileges \
     --file "ventylab-prod-$(date -u +%Y%m%dT%H%M%SZ)-pre-evaluaciones-c3.dump"
   pg_restore --list ventylab-prod-*-pre-evaluaciones-c3.dump | head    # comprobar que el archivo se lee
   ```

2. **Corrida en seco** contra producción (solo lee):

   ```bash
   DATABASE_URL="$PROD_DIRECT_URL" DIRECT_URL="$PROD_DIRECT_URL" npx tsx prisma/import-evaluations.ts
   ```

   Revisar el resumen: `July: 0 created, 41 linked …` si las evaluaciones de julio ya están migradas; `Block C: 13 created`; `SIMULATION: 6 added` (o `skipped (with attempts)` para los exámenes que ya tienen intentos). Cualquier error de módulo faltante indica que falta la importación del currículo del Bloque B.

3. **Importación:**

   ```bash
   DATABASE_URL="$PROD_DIRECT_URL" DIRECT_URL="$PROD_DIRECT_URL" npx tsx prisma/import-evaluations.ts --apply
   ```

4. **Verificación** (solo lectura):

   ```bash
   psql "$PROD_DIRECT_URL" -c "SELECT type, count(*) FROM evaluations WHERE id LIKE 'c3-%' GROUP BY type"   # QUIZ 11, WORKSHOP 1, EXAM 1
   psql "$PROD_DIRECT_URL" -c "SELECT count(*) FROM evaluation_assignments a JOIN evaluations e ON e.id = a.evaluation_id WHERE e.id LIKE 'c3-%'"   # 0
   psql "$PROD_DIRECT_URL" -c "SELECT m.id FROM modules m WHERE m.\"isActive\" AND NOT EXISTS (SELECT 1 FROM evaluations e WHERE e.module_id = m.id AND e.type = 'QUIZ' AND e.status = 'READY')"   # sin filas
   ```

## Reversión

El importador no borra ni reescribe contenido existente, así que la reversión selectiva es posible mientras las evaluaciones nuevas no tengan intentos:

```sql
-- Solo si ninguna evaluación c3-* tiene intentos ni asignaciones
DELETE FROM evaluations WHERE id LIKE 'c3-%';                              -- en cascada: escenarios, preguntas, opciones
DELETE FROM evaluation_questions WHERE id LIKE '%:c3-simulation';          -- preguntas SIMULATION agregadas a julio
```

El vínculo de módulo y nivel de las evaluaciones de julio se restaura desde el respaldo del paso 1 (`pg_restore --data-only --table=evaluations` en una base temporal y `UPDATE` de `module_id`/`level_id`). Ante cualquier duda, restaurar el respaldo completo.
