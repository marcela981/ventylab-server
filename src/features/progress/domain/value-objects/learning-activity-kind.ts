/*
 * Funcionalidad: Tipos de actividad del registro de gamificación
 * Descripción: Enumera los hechos de aprendizaje que otorgan XP en el registro de actividad (primera vista de página, lección completada, módulo completado, evaluación aprobada y logro desbloqueado) y los que se muestran en la actividad reciente
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type LearningActivityKindValue = "PAGE_VIEWED" | "LESSON_COMPLETED" | "MODULE_COMPLETED" | "EVALUATION_PASSED" | "ACHIEVEMENT_UNLOCKED";

export const PAGE_VIEWED_ACTIVITY: LearningActivityKindValue = "PAGE_VIEWED";

export const LESSON_COMPLETED_ACTIVITY: LearningActivityKindValue = "LESSON_COMPLETED";

export const MODULE_COMPLETED_ACTIVITY: LearningActivityKindValue = "MODULE_COMPLETED";

export const EVALUATION_PASSED_ACTIVITY: LearningActivityKindValue = "EVALUATION_PASSED";

export const ACHIEVEMENT_UNLOCKED_ACTIVITY: LearningActivityKindValue = "ACHIEVEMENT_UNLOCKED";

export const LEARNING_ACTIVITY_KIND_VALUES: readonly LearningActivityKindValue[] = [
  PAGE_VIEWED_ACTIVITY,
  LESSON_COMPLETED_ACTIVITY,
  MODULE_COMPLETED_ACTIVITY,
  EVALUATION_PASSED_ACTIVITY,
  ACHIEVEMENT_UNLOCKED_ACTIVITY,
] as const;

// The recent activity feed lists milestones only: page views would drown them out.
export const RECENT_ACTIVITY_KINDS: readonly LearningActivityKindValue[] = [
  LESSON_COMPLETED_ACTIVITY,
  MODULE_COMPLETED_ACTIVITY,
  EVALUATION_PASSED_ACTIVITY,
  ACHIEVEMENT_UNLOCKED_ACTIVITY,
] as const;
