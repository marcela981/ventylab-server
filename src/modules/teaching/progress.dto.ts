/**
 * =============================================================================
 * VentyLab — Progress DTO Contract
 * =============================================================================
 *
 * Canonical shape returned by GET /api/progress/overview.
 *
 * The frontend MUST consume `modules[]` as the single source of truth for
 * module-level progress in the dashboard. Each item exposes:
 *
 *   - moduleId        : DB Module.id (stable identifier across migrations).
 *   - lessonsTotal    : count of active lessons in the module.
 *   - lessonsCompleted: count of LessonCompletion rows with isCompleted=true.
 *   - percent         : integer 0..100, derived from UserProgress.progressPercentage
 *                       (or computed live when no record exists yet).
 *
 * Legacy aliases (totalLessons / completedLessons / percentComplete /
 * progress / id / completed) are also emitted by the service for backwards
 * compatibility with older components, but new code MUST use the canonical
 * fields above.
 *
 * Module: src/modules/teaching/progress.dto.ts
 * =============================================================================
 */

/** Canonical, contract-stable item inside `modules[]`. */
export interface ProgressOverviewModuleDTO {
  moduleId: string;
  lessonsTotal: number;
  lessonsCompleted: number;
  /** Integer percent (0..100). */
  percent: number;
}

/** Top-level response of GET /api/progress/overview. */
export interface ProgressOverviewDTO {
  modules: ProgressOverviewModuleDTO[];
}

/**
 * Strict mapper that projects an arbitrary overview row down to the
 * contract-stable shape. Used by the controller to guarantee that the
 * canonical fields are always present, regardless of any internal
 * representation drift in `overviewProgress.service.ts`.
 */
export function toProgressOverviewModuleDTO(row: {
  moduleId?: string;
  id?: string;
  totalLessons?: number;
  lessonsTotal?: number;
  completedLessons?: number;
  lessonsCompleted?: number;
  percentComplete?: number;
  progress?: number;
  percent?: number;
}): ProgressOverviewModuleDTO {
  const moduleId = row.moduleId ?? row.id ?? '';
  const lessonsTotal = row.lessonsTotal ?? row.totalLessons ?? 0;
  const lessonsCompleted = row.lessonsCompleted ?? row.completedLessons ?? 0;
  const rawPercent = row.percent ?? row.percentComplete ?? row.progress ?? 0;
  const percent = Math.max(0, Math.min(100, Math.round(rawPercent)));

  return { moduleId, lessonsTotal, lessonsCompleted, percent };
}
