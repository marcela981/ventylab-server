/*
 * Funcionalidad: Modelos de lectura de la telemetría de IA
 * Descripción: Tipos de la bitácora de llamadas de IA (entrada a registrar sin texto de prompt ni de respuesta, resumen de una llamada, fila exportable, consumo por usuario y estadísticas agregadas por día y por proveedor) y los valores de caso de uso y estado, incluida la referencia que marca las sondas de salud de los proveedores; v1.4: proveedor deterministic de las respuestas de respaldo sin IA; v1.5: idioma, motivo de fin, temperatura, máximo de tokens de salida, rastro de intentos e id de petición del proveedor en la entrada y en la fila exportable
 * Versión: 1.6 (casos de uso del simulador: interpretación del caso y ayuda de alarmas)
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
  | "MODULE_QA"
  | "FREE_CHAT"
  | "TOPIC_CHECK"
  | "SIM_ASSIST"
  | "SIM_CASE_INTERPRETATION"
  | "SIM_ALARM_HELP";

export const AI_TELEMETRY_USE_CASE_VALUES: readonly AiTelemetryUseCaseValue[] = [
  "GRADE_FEEDBACK",
  "NOTES_ANALYSIS",
  "PAGE_DEEPEN",
  "LESSON_QA",
  "MODULE_QA",
  "FREE_CHAT",
  "TOPIC_CHECK",
  "SIM_ASSIST",
  "SIM_CASE_INTERPRETATION",
  "SIM_ALARM_HELP",
] as const;

export type AiCallStatusValue = "SUCCESS" | "ERROR" | "FALLBACK" | "BLOCKED_OFFTOPIC" | "QUOTA_EXCEEDED" | "ABORTED";

// Calls that reached a provider (or its deterministic fallback); quota rejections and off-topic blocks never consume provider budget.
export const PROVIDER_REACHING_STATUSES: readonly AiCallStatusValue[] = ["SUCCESS", "FALLBACK", "ERROR", "ABORTED"] as const;

export const NO_PROVIDER: string = "none";

// Provider recorded for a consumer's deterministic (non-AI) fallback answer; it is not a real provider, so per-provider health ignores it.
export const DETERMINISTIC_PROVIDER: string = "deterministic";

// Provider health probes are logged as ordinary calls tagged with this refType; every usage, aggregate and export read excludes them so they never skew learning metrics or consume quota.
export const HEALTH_PROBE_REF_TYPE: string = "health_probe";

export interface AiCallAttemptTrailEntry {
  readonly provider: string;
  readonly model?: string;
  readonly outcome: string;
  readonly errorCode?: string;
  readonly latencyMs: number;
}

// Generation and outcome details added to the call log (all nullable columns).
export interface AiCallLogDetails {
  readonly language?: string;
  readonly finishReason?: string;
  readonly temperature?: number;
  readonly maxOutputTokens?: number;
  readonly attemptTrail?: readonly AiCallAttemptTrailEntry[];
  readonly providerRequestId?: string;
}

// Carries no prompt or response text: only the prompt hash is stored.
export interface AiCallLogEntry extends AiCallLogDetails {
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

export interface AiCallLogRow extends AiCallLogDetails {
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

export interface AiProviderTelemetry {
  readonly provider: string;
  readonly providerCalls: number;
  readonly errorCalls: number;
  readonly errorRate: number;
  readonly latencyP95Ms?: number;
}

export interface AiModelPrice {
  readonly inputPerMillionUsd: number;
  readonly outputPerMillionUsd: number;
}

// Keyed by "<provider>:<model>".
export type AiPriceTable = Readonly<Record<string, AiModelPrice>>;
