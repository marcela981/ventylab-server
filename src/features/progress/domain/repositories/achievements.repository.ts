/*
 * Funcionalidad: Repositorio de logros
 * Descripción: Contrato de persistencia de los logros (tabla Achievement) y de las métricas de actividad que evalúan sus condiciones de desbloqueo; el guardado de un logro nuevo omite en conflicto por (usuario, código) e indica si lo insertó
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Achievement } from "@/features/progress/domain/entities/achievement.entity";
import { type AchievementMetrics } from "@/features/progress/domain/services/achievement-catalog";

export const ACHIEVEMENTS_REPOSITORY_TOKEN: unique symbol = Symbol("ACHIEVEMENTS_REPOSITORY_TOKEN");

export interface IAchievementsRepository {
  getByUserId(userId: string, transaction?: unknown): Promise<Achievement[]>;
  getMetrics(userId: string): Promise<AchievementMetrics>;
  /** Inserts the unlock unless the user already has that code (concurrent unlocks); returns true only when it was inserted. */
  insertIfAbsent(achievement: Achievement, transaction?: unknown): Promise<boolean>;
}
