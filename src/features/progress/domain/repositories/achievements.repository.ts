/*
 * Funcionalidad: Repositorio de logros
 * Descripción: Contrato de persistencia de los logros (tabla Achievement) y de las métricas de actividad que evalúan sus condiciones de desbloqueo
 * Versión: 1.0
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
  save(achievement: Achievement, transaction?: unknown): Promise<void>;
}
