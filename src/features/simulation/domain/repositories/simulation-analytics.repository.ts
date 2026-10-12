/*
 * Funcionalidad: Puerto de repositorio SIMULATION_ANALYTICS_REPOSITORY_TOKEN
 * Descripción: Define la interfaz ISimulationAnalyticsRepository de lecturas por lotes para analítica (conteo, puntaje promedio y tiempo promedio de estabilización por usuario, tomados del resumen persistido de cada sesión, y sesiones de un usuario iniciadas en un rango), sus modelos de lectura y su token de inyección
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type SimulationModeValue, type SimulationSessionStatusValue } from "@/features/simulation/domain/value-objects/simulation-session-values";

export const SIMULATION_ANALYTICS_REPOSITORY_TOKEN: unique symbol = Symbol("SIMULATION_ANALYTICS_REPOSITORY_TOKEN");

export interface SimulationUserSessionStats {
  readonly userId: string;
  readonly sessionCount: number;
  readonly scoredCount: number;
  readonly averageScore: number | null;
  readonly stabilizedCount: number;
  readonly averageTimeToStabilizeSeconds: number | null;
}

export interface SimulationSessionActivityView {
  readonly sessionId: string;
  readonly caseId: string;
  readonly mode: SimulationModeValue;
  readonly status: SimulationSessionStatusValue;
  readonly startedAt: Date;
  readonly endedAt?: Date;
  readonly score?: number;
}

export interface ISimulationAnalyticsRepository {
  getSessionStatsForUsers(userIds: readonly string[]): Promise<SimulationUserSessionStats[]>;
  getSessionActivityOfUser(userId: string, from: Date, to: Date, limit: number): Promise<SimulationSessionActivityView[]>;
}
