/*
 * Funcionalidad: Repositorio de la bitácora de llamadas de IA
 * Descripción: Contrato de persistencia de ai_call_logs: registrar una llamada, consumo de un usuario por caso de uso, agregados con percentiles (totales y por día), filas para exportar y resumen de una llamada
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type AiCallLogEntry,
  type AiCallLogRow,
  type AiCallStatusValue,
  type AiCallSummary,
  type AiTelemetryAggregate,
  type AiTelemetryDayAggregate,
  type AiTelemetryFilters,
  type AiTelemetryUseCaseValue,
  type AiUsage,
} from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

export const AI_CALL_LOGS_REPOSITORY_TOKEN: unique symbol = Symbol("AI_CALL_LOGS_REPOSITORY_TOKEN");

export interface IAiCallLogsRepository {
  create(entry: AiCallLogEntry): Promise<void>;
  getUsage(userId: string, useCase: AiTelemetryUseCaseValue, since: Date): Promise<AiUsage>;
  getAggregate(filters: AiTelemetryFilters): Promise<AiTelemetryAggregate>;
  getDailyAggregates(filters: AiTelemetryFilters): Promise<AiTelemetryDayAggregate[]>;
  getRows(filters: AiTelemetryFilters, limit: number): Promise<AiCallLogRow[]>;
  getById(id: string): Promise<AiCallSummary | undefined>;
  getLatestByRef(refType: string, refId: string, statuses: readonly AiCallStatusValue[]): Promise<AiCallSummary | undefined>;
}
