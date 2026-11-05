<!--
Funcionalidad: Importación del currículo (local y producción)
Descripción: Cómo importar el currículo de prisma/curriculum/content con prisma/import-curriculum.ts: qué hace, garantías de idempotencia, uso en local y los comandos exactos para producción (pg_dump previo, simulación, aplicación, verificación y reversión). Los comandos de producción están preparados y NO se ejecutaron
Versión: 1.0
Autor: Marcela Mazo Castro
Proyecto: VentyLab
Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
Institución: Universidad del Valle
Contacto: marcela.mazo@correounivalle.edu.co
-->

# Importación del currículo

Estado: **preparado; en producción no se ejecutó**. Requiere la confirmación de Marcela y un `pg_dump` previo.

## Qué hace

`npx tsx prisma/import-curriculum.ts` lee el manifiesto (`src/features/curriculum/infrastructure/content-import/curriculum.manifest.ts`) y las 71 lecciones de `prisma/curriculum/content/`, valida cada una (estructura, puntos clave, errores frecuentes, referencias, diagramas, casos del simulador) y sincroniza la base:

| Elemento | Comportamiento |
|---|---|
| Secciones `mecanica` y `ventylab` | Se crean solo si faltan |
| 7 niveles | Upsert por id (ids de producción), con `sectionId` por track |
| 33 módulos y 71 lecciones | Upsert por id: ids de julio conservados para lo que sigue; UUID determinista para lo nuevo |
| 339 páginas | Upsert por id determinista. Los bloques se reemplazan **solo si cambió su contenido**; entonces sube `version` y se guarda una `PageRevision` |
| Prerrequisitos | Niveles: se agregan los que faltan. Módulos: cadena en Intermedio, Avanzado y VentyLab (se quitan solo los de los módulos gestionados) |
| Retirados (4 módulos, 8 lecciones) | `status = ARCHIVED`, `isActive = false`. **Nada se borra**; el progreso y las notas quedan |
| Páginas del editor dentro de un módulo gestionado | `--foreign-pages keep` (por defecto): se conservan y pasan después de las importadas. `--foreign-pages archive`: se archivan. La simulación las lista |
| Lecciones fuera del manifiesto dentro de un módulo gestionado | No se tocan; se listan |

Garantías: todo en **una transacción** (si algo falla, no queda nada a medias); una segunda ejecución no cambia ninguna fila (prueba `test/integration/content/curriculum-import.integration-spec.ts` y corrida local en `ventylab_b`); con problemas de contenido se niega a escribir; con `--apply` exige `--author <correo>` (autor de las páginas) y, si la base no es local, `--confirm-backup`.

Los diagramas son archivos de la web (`ventilab-web/public/learning/diagrams/*.svg`): **desplegar la web antes de importar**, o las figuras aparecen rotas hasta el despliegue.

## Local

```bash
cd ventylab-server
# después de §3.3 de LOCAL_STACK.md (prisma:seed + UPDATE de sectionId + demo:seed)
npx tsx prisma/import-curriculum.ts                                             # simulación
npx tsx prisma/import-curriculum.ts --apply --author ana.torres@ventylab.demo   # aplica
npx tsx prisma/import-curriculum.ts                                             # todo "unchanged"
npx tsx prisma/import-curriculum.ts --print-ids                                 # tabla de ids en Markdown
```

Verificado el 2026-11-04 en `ventylab_b`: primera corrida 9 módulos y 48 lecciones creados, 24 módulos y 23 lecciones actualizados, 4 módulos y 8 lecciones archivados, 339 páginas creadas; segunda corrida, todo sin cambios.

## Producción (preparado, NO ejecutado)

Desde una copia limpia de `main` del server **ya mergeado** (con el PR del Bloque B) y con la web ya desplegada. `PROD_DATABASE_URL` es la cadena de conexión **directa** (no la del pooler) de producción; nunca se escribe en el repo, en los docs ni en el chat.

```bash
cd ventylab-server
git checkout main && git pull --ff-only && npm ci

# 1. Respaldo (obligatorio). Formato custom, sin dueños.
STAMP=$(date +%Y%m%d-%H%M)
pg_dump "$PROD_DATABASE_URL" --format=custom --no-owner --no-privileges --file="ventylab-prod-$STAMP.dump"
pg_restore --list "ventylab-prod-$STAMP.dump" | head      # el respaldo se puede leer

# 2. Simulación: no escribe. Revisar el informe y, sobre todo, la lista de páginas del editor.
DATABASE_URL="$PROD_DATABASE_URL" npx tsx prisma/import-curriculum.ts --foreign-pages keep | tee "import-dry-run-$STAMP.txt"

# 3. Aplicar (una transacción). Autor: un usuario docente o administrador existente.
DATABASE_URL="$PROD_DATABASE_URL" npx tsx prisma/import-curriculum.ts --apply --author <correo-del-autor> --foreign-pages keep --confirm-backup | tee "import-apply-$STAMP.txt"

# 4. Verificar: una segunda simulación debe mostrar 0 creados, 0 actualizados y 0 archivados.
DATABASE_URL="$PROD_DATABASE_URL" npx tsx prisma/import-curriculum.ts
```

Decisión que necesita Marcela antes del paso 3: qué hacer con las páginas que el editor ya creó en producción dentro de los módulos gestionados (las lista el paso 2). `keep` las deja publicadas después de las nuevas; `archive` las oculta sin borrarlas.

### Reversión

Preferido (sin tocar producción a ciegas): restaurar el respaldo en una base nueva, comparar y luego decidir.

```bash
createdb "$RESTORE_TARGET_DB"                       # base vacía en el mismo servidor
pg_restore --no-owner --no-privileges --dbname="$RESTORE_TARGET_DB" "ventylab-prod-$STAMP.dump"
```

Reversión total sobre producción (borra lo que se haya escrito después del respaldo, también el progreso nuevo de los estudiantes):

```bash
pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$PROD_DATABASE_URL" "ventylab-prod-$STAMP.dump"
```

Reversión parcial sin restaurar: los retirados vuelven con `UPDATE modules SET status = 'PUBLISHED', "isActive" = true WHERE id IN (...)` (y lo mismo en `lessons`); las páginas nuevas se pueden archivar por la etiqueta `curriculo` (`UPDATE pages SET status = 'ARCHIVED', "isPublished" = false WHERE 'curriculo' = ANY(tags)`).
