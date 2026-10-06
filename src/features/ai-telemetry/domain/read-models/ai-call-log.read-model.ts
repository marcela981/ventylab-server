/*
 * Funcionalidad: Modelos de lectura de la telemetría de IA
 * Descripción: Tipos de la bitácora de llamadas de IA (entrada a registrar sin texto de prompt ni de respuesta, resumen de una llamada, fila exportable, consumo por usuario y estadísticas agregadas por día) y los valores de caso de uso y estado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type AiTelemetryUseCaseValue =
  | "GRADE_FEEDBACK"
  | "NOTES_ANALYSIS"
  | "PAGE_DEEPEN"
  | "LESSON_QA"
  | "FREE_CHAT"
  | "TOPIC_CHECK"
  | "SIM_ASSIST";

export const AI_TELEMETRY_USE_CASE_VALUES: readonly AiTelemetryUseCaseValue[] = [
  "GRADE_FEEDBACK",
  "NOTES_ANALYSIS",
  "PAGE_DEEPEN",
  "LESSON_QA",
  "FREE_CHAT",
  "TOPIC_CHECK",
  "SIM_ASSIST",
] as const;

export type AiCallStatusValue = "SUCCESS" | "ERROR" | "FALLBACK" | "BLOCKED_OFFTOPIC" | "QUOTA_EXCEEDED" | "ABORTED";

// Calls that reached a provider (or its deterministic fallback); quota rejections and off-topic blocks never consume provider budget.
export const PROVIDER_REACHING_STATUSES: readonly AiCallStatusValue[] = ["SUCCESS", "FALLBACK", "ERROR", "ABORTED"] as const;

export const NO_PROVIDER: string = "none";

// Carries no prompt or response text: only the prompt hash is stored.
export interface AiCallLogEntry {
  readonly id: string;
  readonly useCase: AiTelemetryUseCaseValue;
  readonly userId?: string;
  readonly provider?: string;
  readonly model?: string;
  readonly promptVersion: string;
  readonly promptHash: string;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly latencyMs: number;
  readonly ttftMs?: number;
  readonly status: AiCallStatusValue;
  readonly errorCode?: string;
  readonly attempts: number;
  readonly costEstimateUsd?: number;
  readonly refType?: string;
  readonly refId?: string;
  readonly createdAt?: Date;
}

export interface AiCallSummary {
  readonly id: string;
  readonly userId?: string;
  readonly useCase: AiTelemetryUseCaseValue;
  readonly provider: string;
  readonly model?: string;
  readonly promptVersion: string;
  readonly status: AiCallStatusValue;
  readonly createdAt: Date;
}

export interface AiCallLogRow {
  readonly id: string;
  readonly createdAt: Date;
  readonly useCase: AiTelemetryUseCaseValue;
  readonly provider: string;
  readonly model?: string;
  readonly promptVersion: string;
  readonly status: AiCallStatusValue;
  readonly errorCode?: string;
  readonly attempts: number;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly latencyMs: number;
  readonly ttftMs?: number;
  readonly costEstimateUsd?: number;
  readonly refType?: string;
  readonly refId?: string;
}

export interface AiUsage {
  readonly requests: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export interface AiTelemetryFilters {
  readonly from: Date;
  readonly to: Date;
  readonly useCase?: AiTelemetryUseCaseValue;
  readonly provider?: string;
  readonly model?: string;
}

export interface AiTelemetryAggregate {
  readonly calls: number;
  readonly providerCalls: number;
  readonly fallbackCalls: number;
  readonly errorCalls: number;
  readonly latencyP50Ms?: number;
  readonly latencyP95Ms?: number;
  readonly ttftP50Ms?: number;
  readonly ttftP95Ms?: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly costUsd: number;
}

export interface AiTelemetryDayAggregate extends AiTelemetryAggregate {
  readonly day: string;
}

export interface AiTelemetryMetrics extends AiTelemetryAggregate {
  readonly fallbackRate: number;
  readonly errorRate: number;
}

export interface AiTelemetryDayMetrics extends AiTelemetryMetrics {
  readonly day: string;
}

export interface AiTelemetryStats {
  readonly from: Date;
  readonly to: Date;
  readonly totals: AiTelemetryMetrics;
  readonly days: AiTelemetryDayMetrics[];
}

export interface AiModelPrice {
  readonly inputPerMillionUsd: number;
  readonly outputPerMillionUsd: number;
}

// Keyed by "<provider>:<model>".
export type AiPriceTable = Readonly<Record<string, AiModelPrice>>;
