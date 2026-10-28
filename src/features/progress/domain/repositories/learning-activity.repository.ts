/*
 * Funcionalidad: Repositorio del registro de actividad
 * Descripción: Contrato de persistencia del registro de actividad de gamificación (learning_activity_events y user_activity_days): inserción idempotente que omite en conflicto y actualiza el día de actividad, totales de XP, días activos, calendario por rango, actividad reciente con títulos y relleno histórico idempotente con su marca de versión
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type ActivityDay,
  type LearningActivityTotals,
  type NewLearningActivity,
  type RecentActivityItem,
} from "@/features/progress/domain/read-models/gamification.read-model";
import { type LocalDate } from "@/features/progress/domain/services/activity-calendar";
import { type LearningActivityKindValue } from "@/features/progress/domain/value-objects/learning-activity-kind";

export const LEARNING_ACTIVITY_REPOSITORY_TOKEN: unique symbol = Symbol("LEARNING_ACTIVITY_REPOSITORY_TOKEN");

export interface LearningActivityBackfillOptions {
  readonly passingGrade: number;
}

export interface ILearningActivityRepository {
  /** Inserts the entry unless (userId, kind, refId) exists; returns true only when a row was inserted (and its day counted). */
  record(activity: NewLearningActivity, transaction?: unknown): Promise<boolean>;
  getTotals(userId: string, today: LocalDate): Promise<LearningActivityTotals>;
  getActiveDates(userId: string): Promise<LocalDate[]>;
  getActivityDays(userId: string, from: LocalDate, to: LocalDate): Promise<ActivityDay[]>;
  getRecent(userId: string, kinds: readonly LearningActivityKindValue[], limit: number): Promise<RecentActivityItem[]>;
  /** Inserts the historic entries derived from earlier tables (skip on conflict); returns the number of inserted entries. */
  backfill(options: LearningActivityBackfillOptions): Promise<number>;
  getBackfillVersion(): Promise<string | undefined>;
  setBackfillVersion(version: string): Promise<void>;
}
