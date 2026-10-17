/*
 * Funcionalidad: Tipos de valores de la configuración de la plataforma
 * Descripción: Categorías, claves y tipo del valor de cada ajuste editable (IA, evaluación, analítica, simulación, reservas, telemetría y comandos del ventilador), tipos de valor que describen la forma de cada ajuste a un formulario genérico, esquema de claves de los ajustes con forma de mapa (etiqueta, claves permitidas, tipo y límites del valor, mapa anidado), origen del valor efectivo y la forma de una fila guardada (sobrescritura o marca de restablecimiento que conserva la versión)
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";

export type PlatformSettingCategoryValue = "ai" | "evaluation" | "analytics" | "simulation" | "reservations" | "telemetry" | "commands";

export const PLATFORM_SETTING_CATEGORY_VALUES: readonly PlatformSettingCategoryValue[] = [
  "ai",
  "evaluation",
  "analytics",
  "simulation",
  "reservations",
  "telemetry",
  "commands",
] as const;

export type PlatformSettingValueTypeValue = "integer" | "number" | "boolean" | "string" | "string-list" | "integer-list" | "map" | "object";

export const PLATFORM_SETTING_VALUE_TYPE_VALUES: readonly PlatformSettingValueTypeValue[] = [
  "integer",
  "number",
  "boolean",
  "string",
  "string-list",
  "integer-list",
  "map",
  "object",
] as const;

export interface PlatformSettingKeySchema {
  readonly path: string | null;
  readonly keyLabel: string;
  readonly allowedKeys: readonly string[] | null;
  readonly valueType: PlatformSettingValueTypeValue;
  readonly valueLimits: Readonly<Record<string, unknown>> | null;
  readonly valueKeySchema: PlatformSettingKeySchema | null;
}

export type PlatformSettingOriginValue = "DEFAULT" | "OVERRIDE";

export const PLATFORM_SETTING_ORIGIN_VALUES: readonly PlatformSettingOriginValue[] = ["DEFAULT", "OVERRIDE"] as const;

export interface AiUseCaseSettingValue {
  readonly providerChain: readonly string[];
  readonly models: Readonly<Record<string, string>>;
  readonly timeoutMs: number;
  readonly maxOutputTokens: number;
  readonly temperature: number;
}

export interface AiQuotaLimitValue {
  readonly requestsPerDay?: number;
  readonly tokensPerDay?: number;
}

// Role -> AI use case (or "*") -> daily limits.
export type AiQuotasSettingValue = Readonly<Record<string, Readonly<Record<string, AiQuotaLimitValue>>>>;

export interface AiModelPriceValue {
  readonly inputPer1kUsd: number;
  readonly outputPer1kUsd: number;
}

// Provider -> model -> price per 1k tokens.
export type AiPricesSettingValue = Readonly<Record<string, Readonly<Record<string, AiModelPriceValue>>>>;

export interface SimulationRubricThresholdsValue {
  readonly targetsReached: number;
  readonly timeToStabilizeSeconds: number;
  readonly timeInRangePercent: number;
  readonly safetyToleranceSeconds: number;
}

export type AiUseCaseSettingKey = `ai.useCase.${AiUseCaseValue}`;

type AiUseCaseSettingValues = { readonly [K in AiUseCaseValue as `ai.useCase.${K}`]: AiUseCaseSettingValue };

export type PlatformSettingValues = AiUseCaseSettingValues & {
  readonly "ai.quotas": AiQuotasSettingValue;
  readonly "ai.prices": AiPricesSettingValue;
  readonly "ai.tutor.topicCheck.enabled": boolean;
  readonly "evaluation.passingGrade": number;
  readonly "evaluation.submitGraceSeconds": number;
  readonly "analytics.risk.maxFailedEvaluations": number;
  readonly "analytics.risk.minProgressPct": number;
  readonly "analytics.risk.inactivityDays": number;
  readonly "simulation.rubric.defaultThresholds": SimulationRubricThresholdsValue;
  readonly "simulation.allowedTimeMultipliers": readonly number[];
  readonly "simulation.abandonAfterMinutes": number;
  readonly "reservations.maxDurationMinutes": number;
  readonly "reservations.slotMinutes": number;
  readonly "reservations.maxAdvanceDays": number;
  readonly "reservations.maxUpcomingPerStudent": number;
  readonly "reservations.maxUpcomingPerGroup": number;
  readonly "telemetry.flushIntervalMs": number;
  readonly "telemetry.staleAfterMs": number;
  readonly "telemetry.recordingHz": number;
  readonly "telemetry.recordingFlushSeconds": number;
  readonly "commands.ratePerSecond": number;
  readonly "commands.ackTimeoutMs": number;
  readonly "commands.safety.maxPeep": number;
  readonly "commands.safety.maxPressureLimit": number;
  readonly "commands.safety.maxTidalVolume": number;
  readonly "commands.safety.maxRespiratoryRate": number;
  readonly "commands.safety.maxIeRatio": number;
};

export type PlatformSettingKey = Extract<keyof PlatformSettingValues, string>;

export interface PlatformSettingOverride {
  readonly key: string;
  readonly value: unknown;
  readonly version: number;
  readonly updatedById?: string;
  readonly updatedAt: Date;
}

// A reset keeps the row with a null value so the version keeps growing and a stale version is never accepted again.
export const RESET_PLATFORM_SETTING_VALUE: null = null;

export function isResetPlatformSetting(row: PlatformSettingOverride): boolean {
  return row.value === RESET_PLATFORM_SETTING_VALUE;
}

export const PLATFORM_SETTINGS_AUDIT_TARGET: string = "platform_settings";

export const SETTINGS_CHANGED_AUDIT_ACTION: string = "SETTINGS_CHANGED";
