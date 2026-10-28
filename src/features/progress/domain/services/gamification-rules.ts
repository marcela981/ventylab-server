/*
 * Funcionalidad: Reglas de gamificación
 * Descripción: Única fórmula de XP, nivel y racha del servidor (docs/bloque2/reglas-gamificacion.md): XP por tipo de actividad (página 5, lección 50, módulo 200, evaluación aprobada 100, logro su recompensa), nivel ⌊xp/500⌋+1 con XP dentro del nivel y umbral del siguiente, racha actual (días consecutivos de America/Bogota que terminan hoy o ayer) y racha más larga, y armado de las estadísticas de gamificación
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type GamificationStats,
  type LearningActivityTotals,
  type LevelProgress,
  type StreakSummary,
} from "@/features/progress/domain/read-models/gamification.read-model";
import { addDays, type LocalDate } from "@/features/progress/domain/services/activity-calendar";
import { ACHIEVEMENT_UNLOCKED_ACTIVITY, type LearningActivityKindValue } from "@/features/progress/domain/value-objects/learning-activity-kind";

export const XP_PER_FIRST_PAGE_VIEW: number = 5;
export const XP_PER_LESSON: number = 50;
export const XP_PER_MODULE: number = 200;
export const XP_PER_EVALUATION_PASSED: number = 100;
export const XP_PER_LEVEL: number = 500;

const FIXED_ACTIVITY_XP: Readonly<Record<LearningActivityKindValue, number>> = {
  PAGE_VIEWED: XP_PER_FIRST_PAGE_VIEW,
  LESSON_COMPLETED: XP_PER_LESSON,
  MODULE_COMPLETED: XP_PER_MODULE,
  EVALUATION_PASSED: XP_PER_EVALUATION_PASSED,
  ACHIEVEMENT_UNLOCKED: 0,
};

/** XP of one ledger entry; an unlocked achievement is worth its own reward. */
export function xpForActivity(kind: LearningActivityKindValue, achievementReward: number = 0): number {
  return kind === ACHIEVEMENT_UNLOCKED_ACTIVITY ? Math.max(0, Math.trunc(achievementReward)) : FIXED_ACTIVITY_XP[kind];
}

/** Level = ⌊xp / 500⌋ + 1; nextLevelXp is the total XP at which the next level starts. */
export function computeLevel(xpTotal: number): LevelProgress {
  const xp: number = Math.max(0, Math.trunc(xpTotal));
  const level: number = Math.floor(xp / XP_PER_LEVEL) + 1;

  return { level, xpIntoLevel: xp - (level - 1) * XP_PER_LEVEL, nextLevelXp: level * XP_PER_LEVEL };
}

/** XP needed to reach a level with the single level formula (level 10 → 4500). */
export function xpForLevel(level: number): number {
  return Math.max(0, level - 1) * XP_PER_LEVEL;
}

/**
 * Current streak: consecutive active days ending today or yesterday (a day without activity yet keeps yesterday's streak alive).
 * Longest streak: the longest run of consecutive active days. Days after `today` are ignored.
 */
export function computeStreaks(activeDates: Iterable<LocalDate>, today: LocalDate): StreakSummary {
  const days: LocalDate[] = Array.from(new Set(activeDates))
    .filter((date: LocalDate) => date <= today)
    .sort();

  let longest: number = 0;
  let run: number = 0;
  let previous: LocalDate | undefined;

  for (const day of days) {
    run = previous !== undefined && addDays(previous, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }

  const current: number = previous === today || previous === addDays(today, -1) ? run : 0;

  return { current, longest };
}

export function buildGamificationStats({
  totals,
  activeDates,
  today,
}: {
  totals: LearningActivityTotals;
  activeDates: Iterable<LocalDate>;
  today: LocalDate;
}): GamificationStats {
  const streaks: StreakSummary = computeStreaks(activeDates, today);

  return {
    xpTotal: totals.xpTotal,
    ...computeLevel(totals.xpTotal),
    streakDays: streaks.current,
    longestStreak: streaks.longest,
    xpToday: totals.xpToday,
  };
}
