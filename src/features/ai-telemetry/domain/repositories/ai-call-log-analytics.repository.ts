/*
 * Funcionalidad: Puerto de repositorio AI_CALL_LOG_ANALYTICS_REPOSITORY_TOKEN
 * Descripción: Define la interfaz IAiCallLogAnalyticsRepository de lecturas por lotes para analítica (uso de IA por usuario y caso de uso de varios usuarios a la vez: llamadas, tokens y latencia promedio), su modelo de lectura y su token de inyección
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiTelemetryUseCaseValue } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

export const AI_CALL_LOG_ANALYTICS_REPOSITORY_TOKEN: unique symbol = Symbol("AI_CALL_LOG_ANALYTICS_REPOSITORY_TOKEN");

export interface AiUserUseCaseUsage {
  readonly userId: string;
  readonly useCase: AiTelemetryUseCaseValue;
  readonly calls: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly averageLatencyMs: number | null;
}

export interface IAiCallLogAnalyticsRepository {
  getUsageForUsers(userIds: readonly string[], since?: Date): Promise<AiUserUseCaseUsage[]>;
}
