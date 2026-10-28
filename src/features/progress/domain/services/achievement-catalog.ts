/*
 * Funcionalidad: Catálogo de logros
 * Descripción: Define las definiciones de logros con su código estable (clave única por usuario), condiciones y recompensas de XP, y la función pura que evalúa cada condición con las métricas del registro de actividad: lecciones y módulos completados, evaluaciones aprobadas y con puntaje perfecto (los antiguos logros de quiz), racha de días de America/Bogota y nivel calculado con la única fórmula de gamification-rules
 * Versión: 2.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { computeLevel } from "@/features/progress/domain/services/gamification-rules";

export type AchievementConditionType = "lessons_completed" | "modules_completed" | "evaluations_passed" | "perfect_score" | "streak_days" | "level_reached";

export const LESSONS_COMPLETED_CONDITION: AchievementConditionType = "lessons_completed";
export const MODULES_COMPLETED_CONDITION: AchievementConditionType = "modules_completed";
export const EVALUATIONS_PASSED_CONDITION: AchievementConditionType = "evaluations_passed";
export const PERFECT_SCORE_CONDITION: AchievementConditionType = "perfect_score";
export const STREAK_DAYS_CONDITION: AchievementConditionType = "streak_days";
export const LEVEL_REACHED_CONDITION: AchievementConditionType = "level_reached";

export interface AchievementDefinition {
  /** Stable key stored in achievements.code; never rename it, titles may change. */
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly condition: { readonly type: AchievementConditionType; readonly value: number };
  readonly xpReward: number;
}

export interface AchievementMetrics {
  readonly completedLessons: number;
  readonly completedModules: number;
  /** Distinct evaluations passed (EVALUATION_PASSED ledger entries). */
  readonly passedEvaluations: number;
  /** Distinct evaluations with a published attempt scoring the maximum. */
  readonly perfectEvaluations: number;
  /** Current streak of America/Bogota days with activity. */
  readonly currentStreak: number;
  /** Total XP of the activity ledger. */
  readonly xpTotal: number;
}

export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  {
    code: "first_lesson",
    title: "Primer Paso",
    description: "Completa tu primera lección",
    icon: "🎯",
    condition: { type: LESSONS_COMPLETED_CONDITION, value: 1 },
    xpReward: 50,
  },
  {
    code: "ten_lessons",
    title: "Aprendiz Dedicado",
    description: "Completa 10 lecciones",
    icon: "📚",
    condition: { type: LESSONS_COMPLETED_CONDITION, value: 10 },
    xpReward: 200,
  },
  {
    code: "fifty_lessons",
    title: "Estudiante Avanzado",
    description: "Completa 50 lecciones",
    icon: "🏆",
    condition: { type: LESSONS_COMPLETED_CONDITION, value: 50 },
    xpReward: 500,
  },
  {
    code: "first_module",
    title: "Módulo Completado",
    description: "Completa tu primer módulo",
    icon: "✅",
    condition: { type: MODULES_COMPLETED_CONDITION, value: 1 },
    xpReward: 300,
  },
  {
    code: "perfect_quiz",
    title: "Puntuación Perfecta",
    description: "Obtén el puntaje máximo en una evaluación",
    icon: "💯",
    condition: { type: PERFECT_SCORE_CONDITION, value: 1 },
    xpReward: 150,
  },
  {
    code: "quiz_master",
    title: "Maestro de Evaluaciones",
    description: "Aprueba 10 evaluaciones",
    icon: "🧠",
    condition: { type: EVALUATIONS_PASSED_CONDITION, value: 10 },
    xpReward: 400,
  },
  {
    code: "week_streak",
    title: "Racha Semanal",
    description: "Estudia 7 días consecutivos",
    icon: "🔥",
    condition: { type: STREAK_DAYS_CONDITION, value: 7 },
    xpReward: 250,
  },
  {
    code: "month_streak",
    title: "Racha Mensual",
    description: "Estudia 30 días consecutivos",
    icon: "⭐",
    condition: { type: STREAK_DAYS_CONDITION, value: 30 },
    xpReward: 1000,
  },
  {
    code: "level_10",
    title: "Nivel 10",
    description: "Alcanza el nivel 10",
    icon: "🎖️",
    condition: { type: LEVEL_REACHED_CONDITION, value: 10 },
    xpReward: 500,
  },
  {
    code: "level_25",
    title: "Nivel 25",
    description: "Alcanza el nivel 25",
    icon: "🌟",
    condition: { type: LEVEL_REACHED_CONDITION, value: 25 },
    xpReward: 1000,
  },
];

export function findAchievementDefinition(code: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find((definition: AchievementDefinition) => definition.code === code);
}

export function meetsAchievementCondition(definition: AchievementDefinition, metrics: AchievementMetrics): boolean {
  const target: number = definition.condition.value;

  switch (definition.condition.type) {
    case LESSONS_COMPLETED_CONDITION:
      return metrics.completedLessons >= target;
    case MODULES_COMPLETED_CONDITION:
      return metrics.completedModules >= target;
    case EVALUATIONS_PASSED_CONDITION:
      return metrics.passedEvaluations >= target;
    case PERFECT_SCORE_CONDITION:
      return metrics.perfectEvaluations >= target;
    case STREAK_DAYS_CONDITION:
      return metrics.currentStreak >= target;
    case LEVEL_REACHED_CONDITION:
      return computeLevel(metrics.xpTotal).level >= target;
    default:
      return false;
  }
}
