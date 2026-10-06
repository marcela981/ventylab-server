/*
 * Funcionalidad: Proveedor de configuración del gateway de IA
 * Descripción: Implementa IAiSettingsProvider leyendo solo ConfigService: valores por defecto de cadena de proveedores, modelos, tiempos límite, tokens y temperatura por caso de uso, sobrescrituras JSON (AI_USE_CASE_SETTINGS, AI_QUOTAS, AI_PRICES) validadas al arrancar, cortocircuito y ajustes del tutor
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type FactoryProvider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import {
  AI_SETTINGS_PROVIDER_TOKEN,
  type AiBreakerSettings,
  type AiModelPrice,
  type AiQuotaLimit,
  type AiTutorSettings,
  type AiUseCaseSettings,
  type IAiSettingsProvider,
} from "@/features/ai/application/ports/ai-settings-provider.interface";
import { AI_USE_CASE_VALUES, type AiUseCaseValue, isAiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";

export const AI_RETRY_DELAY_MS: number = 500;

export const QUOTA_ANY_USE_CASE: string = "*";

const KNOWN_ROLES: readonly string[] = ["STUDENT", "TEACHER", "ADMIN"];

const DEFAULT_PROVIDER_CHAIN: readonly string[] = ["gemini", "openai", "anthropic", "custom"];

const DEFAULT_MODELS: Readonly<Record<string, string>> = {
  gemini: "gemini-2.5-flash",
  openai: "gpt-4o-mini",
  anthropic: "claude-opus-5-5",
  custom: "default",
};

const CHEAPEST_MODELS: Readonly<Record<string, string>> = {
  gemini: "gemini-2.0-flash",
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5",
  custom: "default",
};

const DEFAULT_USE_CASE_SETTINGS: Readonly<Record<AiUseCaseValue, AiUseCaseSettings>> = {
  GRADE_FEEDBACK: { providerChain: DEFAULT_PROVIDER_CHAIN, models: DEFAULT_MODELS, timeoutMs: 30000, maxOutputTokens: 2048, temperature: 0.4 },
  NOTES_ANALYSIS: { providerChain: DEFAULT_PROVIDER_CHAIN, models: DEFAULT_MODELS, timeoutMs: 30000, maxOutputTokens: 2048, temperature: 0.4 },
  PAGE_DEEPEN: { providerChain: DEFAULT_PROVIDER_CHAIN, models: DEFAULT_MODELS, timeoutMs: 30000, maxOutputTokens: 1536, temperature: 0.6 },
  LESSON_QA: { providerChain: DEFAULT_PROVIDER_CHAIN, models: DEFAULT_MODELS, timeoutMs: 30000, maxOutputTokens: 1024, temperature: 0.4 },
  FREE_CHAT: { providerChain: DEFAULT_PROVIDER_CHAIN, models: DEFAULT_MODELS, timeoutMs: 30000, maxOutputTokens: 1024, temperature: 0.6 },
  TOPIC_CHECK: { providerChain: DEFAULT_PROVIDER_CHAIN, models: CHEAPEST_MODELS, timeoutMs: 8000, maxOutputTokens: 64, temperature: 0 },
  SIM_ASSIST: { providerChain: DEFAULT_PROVIDER_CHAIN, models: DEFAULT_MODELS, timeoutMs: 20000, maxOutputTokens: 768, temperature: 0.4 },
};

const DEFAULT_QUOTAS: Readonly<Record<string, Readonly<Record<string, AiQuotaLimit>>>> = {
  STUDENT: { [QUOTA_ANY_USE_CASE]: { requestsPerDay: 100, tokensPerDay: 200000 } },
  TEACHER: { [QUOTA_ANY_USE_CASE]: { requestsPerDay: 300, tokensPerDay: 600000 } },
};

const DEFAULT_PRICES: Readonly<Record<string, Readonly<Record<string, AiModelPrice>>>> = {
  gemini: {
    "gemini-2.5-flash": { inputPer1kUsd: 0.0003, outputPer1kUsd: 0.0025 },
    "gemini-2.0-flash": { inputPer1kUsd: 0.0001, outputPer1kUsd: 0.0004 },
  },
  openai: {
    "gpt-4o-mini": { inputPer1kUsd: 0.00015, outputPer1kUsd: 0.0006 },
  },
  anthropic: {
    "claude-opus-5-5": { inputPer1kUsd: 0.004, outputPer1kUsd: 0.02 },
    "claude-haiku-4-5": { inputPer1kUsd: 0.001, outputPer1kUsd: 0.005 },
  },
};

export interface AiSettingsSnapshot {
  readonly useCases: Readonly<Record<AiUseCaseValue, AiUseCaseSettings>>;
  readonly quotas: Readonly<Record<string, Readonly<Record<string, AiQuotaLimit>>>>;
  readonly prices: Readonly<Record<string, Readonly<Record<string, AiModelPrice>>>>;
  readonly breaker: AiBreakerSettings;
  readonly tutor: AiTutorSettings;
  readonly retryDelayMs: number;
}

export interface AiSettingsSource {
  readonly useCaseSettingsJson?: string;
  readonly quotasJson?: string;
  readonly pricesJson?: string;
  readonly breakerFailureThreshold: number;
  readonly breakerOpenSeconds: number;
  readonly tutorHistoryWindow: number;
  readonly tutorContextTokenBudget: number;
}

class AiSettingsConfigError extends Error {
  public constructor(variable: string, detail: string) {
    super(`Invalid environment configuration:\n  - ${variable}: ${detail}`);
    this.name = AiSettingsConfigError.name;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseObject(variable: string, json: string | undefined): Record<string, unknown> {
  if (json === undefined || json.trim() === "") {
    return {};
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new AiSettingsConfigError(variable, "must be valid JSON");
  }

  if (!isPlainObject(parsed)) {
    throw new AiSettingsConfigError(variable, "must be a JSON object");
  }

  return parsed;
}

function readPositiveNumber(variable: string, path: string, value: unknown, allowZero: boolean = false): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) {
    throw new AiSettingsConfigError(variable, `${path} must be a ${allowZero ? "non-negative" : "positive"} number`);
  }

  return value;
}

function readStringRecord(variable: string, path: string, value: unknown): Record<string, string> | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isPlainObject(value) || Object.values(value).some((entry: unknown) => typeof entry !== "string" || entry.trim() === "")) {
    throw new AiSettingsConfigError(variable, `${path} must be an object of non-empty strings`);
  }

  return value as Record<string, string>;
}

function readProviderChain(variable: string, path: string, value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.length === 0 || value.some((entry: unknown) => typeof entry !== "string" || entry.trim() === "")) {
    throw new AiSettingsConfigError(variable, `${path} must be a non-empty array of provider ids`);
  }

  return value as string[];
}

function parseUseCaseSettings(json: string | undefined): Record<AiUseCaseValue, AiUseCaseSettings> {
  const variable: string = "AI_USE_CASE_SETTINGS";
  const overrides: Record<string, unknown> = parseObject(variable, json);
  const result: Record<AiUseCaseValue, AiUseCaseSettings> = { ...DEFAULT_USE_CASE_SETTINGS };

  for (const [useCase, override] of Object.entries(overrides)) {
    if (!isAiUseCaseValue(useCase)) {
      throw new AiSettingsConfigError(variable, `unknown use case "${useCase}" (expected one of ${AI_USE_CASE_VALUES.join(", ")})`);
    }

    if (!isPlainObject(override)) {
      throw new AiSettingsConfigError(variable, `${useCase} must be an object`);
    }

    const base: AiUseCaseSettings = DEFAULT_USE_CASE_SETTINGS[useCase];
    const temperature: number | undefined = readPositiveNumber(variable, `${useCase}.temperature`, override.temperature, true);

    if (temperature !== undefined && temperature > 2) {
      throw new AiSettingsConfigError(variable, `${useCase}.temperature must be between 0 and 2`);
    }

    result[useCase] = {
      providerChain: readProviderChain(variable, `${useCase}.providerChain`, override.providerChain) ?? base.providerChain,
      models: { ...base.models, ...readStringRecord(variable, `${useCase}.models`, override.models) },
      timeoutMs: readPositiveNumber(variable, `${useCase}.timeoutMs`, override.timeoutMs) ?? base.timeoutMs,
      maxOutputTokens: readPositiveNumber(variable, `${useCase}.maxOutputTokens`, override.maxOutputTokens) ?? base.maxOutputTokens,
      temperature: temperature ?? base.temperature,
    };
  }

  return result;
}

function parseQuotaLimit(variable: string, path: string, value: unknown): AiQuotaLimit {
  if (!isPlainObject(value)) {
    throw new AiSettingsConfigError(variable, `${path} must be an object`);
  }

  return {
    requestsPerDay: readPositiveNumber(variable, `${path}.requestsPerDay`, value.requestsPerDay, true),
    tokensPerDay: readPositiveNumber(variable, `${path}.tokensPerDay`, value.tokensPerDay, true),
  };
}

function parseQuotas(json: string | undefined): Record<string, Record<string, AiQuotaLimit>> {
  const variable: string = "AI_QUOTAS";

  if (json === undefined || json.trim() === "") {
    return { ...DEFAULT_QUOTAS };
  }

  const overrides: Record<string, unknown> = parseObject(variable, json);
  const result: Record<string, Record<string, AiQuotaLimit>> = {};

  for (const [role, perUseCase] of Object.entries(overrides)) {
    if (!KNOWN_ROLES.includes(role)) {
      throw new AiSettingsConfigError(variable, `unknown role "${role}" (expected one of ${KNOWN_ROLES.join(", ")})`);
    }

    if (!isPlainObject(perUseCase)) {
      throw new AiSettingsConfigError(variable, `${role} must be an object`);
    }

    result[role] = {};

    for (const [useCase, limit] of Object.entries(perUseCase)) {
      if (useCase !== QUOTA_ANY_USE_CASE && !isAiUseCaseValue(useCase)) {
        throw new AiSettingsConfigError(variable, `${role}.${useCase} is not a known use case or "${QUOTA_ANY_USE_CASE}"`);
      }

      result[role][useCase] = parseQuotaLimit(variable, `${role}.${useCase}`, limit);
    }
  }

  return result;
}

function parsePrices(json: string | undefined): Record<string, Record<string, AiModelPrice>> {
  const variable: string = "AI_PRICES";
  const overrides: Record<string, unknown> = parseObject(variable, json);
  const result: Record<string, Record<string, AiModelPrice>> = Object.fromEntries(
    Object.entries(DEFAULT_PRICES).map(([provider, models]: [string, Readonly<Record<string, AiModelPrice>>]) => [provider, { ...models }]),
  );

  for (const [provider, models] of Object.entries(overrides)) {
    if (!isPlainObject(models)) {
      throw new AiSettingsConfigError(variable, `${provider} must be an object`);
    }

    result[provider] = result[provider] ?? {};

    for (const [model, price] of Object.entries(models)) {
      if (!isPlainObject(price)) {
        throw new AiSettingsConfigError(variable, `${provider}.${model} must be an object`);
      }

      const inputPer1kUsd: number | undefined = readPositiveNumber(variable, `${provider}.${model}.inputPer1kUsd`, price.inputPer1kUsd, true);
      const outputPer1kUsd: number | undefined = readPositiveNumber(variable, `${provider}.${model}.outputPer1kUsd`, price.outputPer1kUsd, true);

      if (inputPer1kUsd === undefined || outputPer1kUsd === undefined) {
        throw new AiSettingsConfigError(variable, `${provider}.${model} needs inputPer1kUsd and outputPer1kUsd`);
      }

      result[provider][model] = { inputPer1kUsd, outputPer1kUsd };
    }
  }

  return result;
}

export function buildAiSettingsSnapshot(source: AiSettingsSource): AiSettingsSnapshot {
  return {
    useCases: parseUseCaseSettings(source.useCaseSettingsJson),
    quotas: parseQuotas(source.quotasJson),
    prices: parsePrices(source.pricesJson),
    breaker: { failureThreshold: source.breakerFailureThreshold, openSeconds: source.breakerOpenSeconds },
    tutor: { historyWindow: source.tutorHistoryWindow, contextTokenBudget: source.tutorContextTokenBudget },
    retryDelayMs: AI_RETRY_DELAY_MS,
  };
}

export class ConfigAiSettingsProvider implements IAiSettingsProvider {
  public constructor(private readonly _snapshot: AiSettingsSnapshot) {}

  public getUseCaseSettings(useCase: AiUseCaseValue): AiUseCaseSettings {
    return this._snapshot.useCases[useCase];
  }

  public getBreakerSettings(): AiBreakerSettings {
    return this._snapshot.breaker;
  }

  public getRetryDelayMs(): number {
    return this._snapshot.retryDelayMs;
  }

  public getQuota(role: string, useCase: AiUseCaseValue): AiQuotaLimit | undefined {
    const perUseCase: Readonly<Record<string, AiQuotaLimit>> | undefined = this._snapshot.quotas[role];

    return perUseCase?.[useCase] ?? perUseCase?.[QUOTA_ANY_USE_CASE];
  }

  public getTutorSettings(): AiTutorSettings {
    return this._snapshot.tutor;
  }

  public getPrice(provider: string, model: string): AiModelPrice | undefined {
    return this._snapshot.prices[provider]?.[model];
  }
}

export function readAiSettingsSource(configService: ConfigService<EnvironmentVariables, true>): AiSettingsSource {
  return {
    useCaseSettingsJson: configService.get("AI_USE_CASE_SETTINGS", { infer: true }),
    quotasJson: configService.get("AI_QUOTAS", { infer: true }),
    pricesJson: configService.get("AI_PRICES", { infer: true }),
    breakerFailureThreshold: configService.get("AI_BREAKER_FAILURE_THRESHOLD", { infer: true }),
    breakerOpenSeconds: configService.get("AI_BREAKER_OPEN_SECONDS", { infer: true }),
    tutorHistoryWindow: configService.get("AI_TUTOR_HISTORY_WINDOW", { infer: true }),
    tutorContextTokenBudget: configService.get("AI_TUTOR_CONTEXT_TOKEN_BUDGET", { infer: true }),
  };
}

export const AI_SETTINGS_PROVIDER: FactoryProvider<IAiSettingsProvider> = {
  provide: AI_SETTINGS_PROVIDER_TOKEN,
  inject: [ConfigService],
  useFactory: (configService: ConfigService<EnvironmentVariables, true>): IAiSettingsProvider =>
    new ConfigAiSettingsProvider(buildAiSettingsSnapshot(readAiSettingsSource(configService))),
};
