<!--
  Funcionalidad: Reglas de gamificación
  Descripción: Fórmula única de XP, nivel y racha del servidor (Bloque 2): registro de actividad idempotente, tabla de XP por evento, nivel, días en America/Bogota, racha, calendario, endpoints y relleno histórico con sus límites conocidos
  Versión: 0.1
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# Reglas de gamificación

Estas reglas son la **única fórmula** de XP, nivel y racha de VentyLab. Las calcula el servidor; el cliente nunca suma XP por su cuenta. El código vive en `src/features/progress/domain/services/gamification-rules.ts` y `activity-calendar.ts`.

## 1. Registro de actividad

Cada hecho de aprendizaje que da XP se guarda una sola vez en `learning_activity_events`:

| Columna | Contenido |
|---|---|
| `user_id` | Estudiante |
| `kind` | `PAGE_VIEWED`, `LESSON_COMPLETED`, `MODULE_COMPLETED`, `EVALUATION_PASSED`, `ACHIEVEMENT_UNLOCKED` |
| `ref_id` | Página, lección, módulo, evaluación o código del logro |
| `xp` | XP de ese hecho (se guarda, no se recalcula) |
| `occurred_at` | Instante del hecho |
| `local_date` | Día calendario de `occurred_at` en America/Bogota |

- **Idempotencia:** `(user_id, kind, ref_id)` es único. Cada inserción es una sola sentencia `INSERT … ON CONFLICT DO NOTHING` encadenada con el conteo del día. Un evento repetido (reintento, doble clic, dos pestañas o dos manejadores a la vez) no suma XP ni cuenta el día dos veces.
- **Días de actividad:** `user_activity_days(user_id, local_date, event_count)` se actualiza en la misma sentencia y solo cuando la fila del registro se insertó.

## 2. XP por evento

| Evento | XP | Origen |
|---|---|---|
| Primera vista de una página | 5 | `PageViewedEvent` con `firstView` |
| Lección completada | 50 | `LessonCompletedEvent` |
| Módulo completado | 200 | `LessonCompletedEvent` con `moduleCompleted` (referencia: el módulo) |
| Evaluación aprobada (primera vez) | 100 | `EvaluationGradePublishedEvent` con `passed` |
| Logro desbloqueado | Su recompensa (`xpReward`) | `AchievementUnlockedEvent` |

**Evaluación aprobada.** `passed` es verdadero cuando la nota publicada es mayor o igual que la nota mínima aprobatoria (`evaluation.passingGrade`, 0 a 5, por defecto 3,0; editable en los ajustes de plataforma). La referencia es la evaluación, así que solo la primera aprobación da XP: aprobar de nuevo otro intento no suma.

## 3. Nivel

- `nivel = ⌊xp / 500⌋ + 1`
- `xpIntoLevel = xp − (nivel − 1) × 500` (de 0 a 499)
- `nextLevelXp = nivel × 500`: XP total en que empieza el nivel siguiente

| XP | Nivel | XP dentro del nivel | Siguiente nivel en |
|---|---|---|---|
| 0 | 1 | 0 | 500 |
| 499 | 1 | 499 | 500 |
| 500 | 2 | 0 | 1000 |
| 4500 | 10 | 0 | 5000 |

## 4. Días y racha (America/Bogota)

- **Día local:** Colombia usa UTC−05:00 sin horario de verano, así que el día se calcula con un desfase fijo. No depende de la zona horaria del servidor. Ejemplo: 23:59 del 27 de octubre en Bogotá es 04:59 UTC del 28, y cuenta como 27.
- **Racha actual (`streakDays`):** días consecutivos con al menos un evento que terminan **hoy o ayer**. Un día sin actividad todavía no rompe la racha hasta que termina.
- **Racha más larga (`longestStreak`):** la serie de días consecutivos más larga de toda la historia.
- **XP de hoy (`xpToday`):** suma del XP del día local de hoy.

## 5. Endpoints (estudiante, `progress:read_own`, solo datos propios)

| Ruta | Respuesta (`data`) |
|---|---|
| `GET /api/progress/gamification` | `{ xpTotal, level, xpIntoLevel, nextLevelXp, streakDays, longestStreak, xpToday }` |
| `GET /api/progress/activity?from&to` | `{ days: [{ date, count, xp }] }`, fechas `YYYY-MM-DD` inclusivas, como máximo 366 días; sin parámetros, los 366 días que terminan hoy. Los días sin actividad no se listan |
| `GET /api/progress/activity/recent?limit` | `[{ id, kind, refId, xp, occurredAt, title }]`, más reciente primero, de 1 a 50 (10 por defecto). Solo hitos: lecciones, módulos, evaluaciones y logros (no vistas de página) |
| `GET /api/progress/overview` | `stats.xpTotal`, `stats.level`, `stats.nextLevelXp` y `stats.streakDays` salen de la misma fórmula |

## 6. Relleno histórico

Al arrancar, `LearningActivityBackfillService` ejecuta una pasada idempotente (una vez por versión; la versión aplicada queda en `app_settings`, clave `learning_activity_backfill_version`). Toma:

| Fuente | Tipo | Fecha usada |
|---|---|---|
| `page_progress` | `PAGE_VIEWED` | `createdAt` (primera vista) |
| `lesson_completions` completadas | `LESSON_COMPLETED` | `completedAt` |
| `user_progress` con módulo completado | `MODULE_COMPLETED` | `completedAt` |
| Intentos con nota publicada ≥ nota mínima | `EVALUATION_PASSED` | primera `grade_published_at` por evaluación |
| `achievements` | `ACHIEVEMENT_UNLOCKED` | `unlockedAt` |

**Por qué un servicio de arranque y no SQL en la migración:** la regla de aprobado depende de la nota mínima vigente (variable de entorno más el ajuste editable por un administrador), que una migración SQL no puede leer. El servicio sigue el patrón de `ClinicalCasesBootstrapService` (inserta sin actualizar, un fallo no impide el arranque) y cada pasada es segura de repetir. Para volver a ejecutarla, se borra la fila de `app_settings` o se sube `LEARNING_ACTIVITY_BACKFILL_VERSION`.

**Límite conocido:** antes del Bloque 2 no había historia por día. Solo se conoce la primera vista de cada página y la fecha de cada completitud, no cada día en que el estudiante estudió. Por eso **la racha y el calendario históricos quedan subestimados**. Desde el despliegue, cada día con actividad queda registrado.
