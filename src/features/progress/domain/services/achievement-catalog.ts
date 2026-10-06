/*
 * Funcionalidad: Catálogo de logros
 * Descripción: Define las definiciones de logros con sus condiciones y recompensas de XP, y las funciones puras que calculan racha de días, XP total y el cumplimiento de cada condición
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type AchievementConditionType =
  | "lessons_completed"
  | "modules_completed"
  | "quizzes_passed"
  | "perfect_score"
  | "streak_days"
  | "xp_reached";

export const LESSONS_COMPLETED_CONDITION: AchievementConditionType = "lessons_completed";
export const MODULES_COMPLETED_CONDITION: AchievementConditionType = "modules_completed";
export const QUIZZES_PASSED_CONDITION: AchievementConditionType = "quizzes_passed";
export const PERFECT_SCORE_CONDITION: AchievementConditionType = "perfect_score";
export const STREAK_DAYS_CONDITION: AchievementConditionType = "streak_days";
export const XP_REACHED_CONDITION: AchievementConditionType = "xp_reached";

export interface AchievementDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly condition: { readonly type: AchievementConditionType; readonly value: number };
  readonly xpReward: number;
}

export interface AchievementMetrics {
  readonly completedLessons: number;
  readonly completedModules: number;
  readonly passedQuizzes: number;
  readonly perfectQuizzes: number;
  readonly activityDates: Date[];
}

export const XP_PER_LESSON: number = 50;
export const XP_PER_MODULE: number = 200;
export const XP_PER_QUIZ: number = 100;

export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  {
    id: "first_lesson",
    title: "Primer Paso",
    description: "Completa tu primera lección",
    icon: "🎯",
    condition: { type: LESSONS_COMPLETED_CONDITION, value: 1 },
    xpReward: 50,
  },
  {
    id: "ten_lessons",
    title: "Aprendiz Dedicado",
    description: "Completa 10 lecciones",
    icon: "📚",
    condition: { type: LESSONS_COMPLETED_CONDITION, value: 10 },
    xpReward: 200,
  },
  {
    id: "fifty_lessons",
    title: "Estudiante Avanzado",
    description: "Completa 50 lecciones",
    icon: "🏆",
    condition: { type: LESSONS_COMPLETED_CONDITION, value: 50 },
    xpReward: 500,
  },
  {
    id: "first_module",
    title: "Módulo Completado",
    description: "Completa tu primer módulo",
    icon: "✅",
    condition: { type: MODULES_COMPLETED_CONDITION, value: 1 },
    xpReward: 300,
  },
  {
    id: "perfect_quiz",
    title: "Puntuación Perfecta",
    description: "Obtén 100% en un quiz",
    icon: "💯",
    condition: { type: PERFECT_SCORE_CONDITION, value: 1 },
    xpReward: 150,
  },
  {
    id: "quiz_master",
    title: "Maestro de Quizzes",
    description: "Pasa 10 quizzes",
    icon: "🧠",
    condition: { type: QUIZZES_PASSED_CONDITION, value: 10 },
    xpReward: 400,
  },
  {
    id: "week_streak",
    title: "Racha Semanal",
    description: "Estudia 7 días consecutivos",
    icon: "🔥",
    condition: { type: STREAK_DAYS_CONDITION, value: 7 },
    xpReward: 250,
  },
  {
    id: "month_streak",
    title: "Racha Mensual",
    description: "Estudia 30 días consecutivos",
    icon: "⭐",
    condition: { type: STREAK_DAYS_CONDITION, value: 30 },
    xpReward: 1000,
  },
  {
    id: "level_10",
    title: "Nivel 10",
    description: "Alcanza el nivel 10",
    icon: "🎖️",
    condition: { type: XP_REACHED_CONDITION, value: 5000 },
    xpReward: 500,
  },
  {
    id: "level_25",
    title: "Nivel 25",
    description: "Alcanza el nivel 25",
    icon: "🌟",
    condition: { type: XP_REACHED_CONDITION, value: 31250 },
    xpReward: 1000,
  },
];

export function getAchievementXPReward(title: string): number {
  return ACHIEVEMENT_DEFINITIONS.find((definition: AchievementDefinition) => definition.title === title)?.xpReward ?? 0;
}

export function calculateAchievementXP(unlockedTitles: Iterable<string>): number {
  let total: number = 0;

  for (const title of unlockedTitles) {
    total += getAchievementXPReward(title);
  }

  return total;
}

export function calculateTotalXP(metrics: AchievementMetrics, unlockedTitles: Iterable<string>): number {
  return (
    metrics.completedLessons * XP_PER_LESSON +
    metrics.completedModules * XP_PER_MODULE +
    metrics.passedQuizzes * XP_PER_QUIZ +
    calculateAchievementXP(unlockedTitles)
  );
}

function startOfDay(date: Date): number {
  const day: Date = new Date(date);

  day.setHours(0, 0, 0, 0);

  return day.getTime();
}

export function calculateCurrentStreak(activityDates: Date[], today: Date): number {
  if (activityDates.length === 0) {
    return 0;
  }

  const days: Set<number> = new Set(activityDates.map((date: Date) => startOfDay(date)));
  const latestDay: number = Math.max(...days);
  const todayStart: number = startOfDay(today);
  const cursor: Date = new Date(todayStart);

  cursor.setDate(cursor.getDate() - 1);

  if (latestDay === cursor.getTime()) {
    cursor.setDate(cursor.getDate() - 1);
  } else if (latestDay !== todayStart) {
    return 0;
  }

  let streak: number = 1;

  while (days.has(cursor.getTime())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function meetsAchievementCondition(
  definition: AchievementDefinition,
  metrics: AchievementMetrics,
  unlockedTitles: Iterable<string>,
  today: Date,
): boolean {
  const target: number = definition.condition.value;

  switch (definition.condition.type) {
    case LESSONS_COMPLETED_CONDITION:
      return metrics.completedLessons >= target;
    case MODULES_COMPLETED_CONDITION:
      return metrics.completedModules >= target;
    case QUIZZES_PASSED_CONDITION:
      return metrics.passedQuizzes >= target;
    case PERFECT_SCORE_CONDITION:
      return metrics.perfectQuizzes >= target;
    case STREAK_DAYS_CONDITION:
      return calculateCurrentStreak(metrics.activityDates, today) >= target;
    case XP_REACHED_CONDITION:
      return calculateTotalXP(metrics, unlockedTitles) >= target;
    default:
      return false;
  }
}
