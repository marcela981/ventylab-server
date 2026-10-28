/*
 * Funcionalidad: Modelos de lectura de gamificación
 * Descripción: Define la entrada del registro de actividad, los totales de XP, las estadísticas de gamificación (XP, nivel, racha), los días del calendario de actividad y los elementos de la actividad reciente
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LocalDate } from "@/features/progress/domain/services/activity-calendar";
import { type LearningActivityKindValue } from "@/features/progress/domain/value-objects/learning-activity-kind";

export interface NewLearningActivity {
  readonly userId: string;
  readonly kind: LearningActivityKindValue;
  readonly refId: string;
  readonly xp: number;
  readonly occurredAt: Date;
  readonly localDate: LocalDate;
}

export interface LearningActivityTotals {
  readonly xpTotal: number;
  readonly xpToday: number;
}

export interface LevelProgress {
  readonly level: number;
  readonly xpIntoLevel: number;
  readonly nextLevelXp: number;
}

export interface StreakSummary {
  readonly current: number;
  readonly longest: number;
}

export interface GamificationStats extends LevelProgress {
  readonly xpTotal: number;
  readonly streakDays: number;
  readonly longestStreak: number;
  readonly xpToday: number;
}

export interface ActivityDay {
  readonly date: LocalDate;
  readonly count: number;
  readonly xp: number;
}

export interface RecentActivityItem {
  readonly id: string;
  readonly kind: LearningActivityKindValue;
  readonly refId: string;
  readonly xp: number;
  readonly occurredAt: Date;
  readonly title: string | null;
}
