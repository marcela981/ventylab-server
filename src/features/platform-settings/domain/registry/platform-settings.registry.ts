/*
 * Funcionalidad: Registro de ajustes de la plataforma
 * Descripción: Define en código cada ajuste editable por un administrador (categoría, descripción, validación de tipo y forma y límites duros que ni un administrador puede superar): cadena de proveedores y modelos, tiempo límite, tokens y temperatura por caso de uso de IA, cuotas, precios y verificación de tema del tutor; nota aprobatoria y gracia de entrega de evaluaciones; umbrales de riesgo del panel docente (evaluaciones reprobadas toleradas, progreso mínimo y días de inactividad, 0 desactiva las dos últimas); umbrales de la rúbrica por defecto, multiplicadores de tiempo y abandono de simulaciones; reglas de reservas; intervalos de telemetría; frecuencia, tiempo de acuse y límites de seguridad de los comandos (dentro de VENTILATOR_PARAMETER_LIMITS). Cada ajuste valida (parse) y además ajusta un valor al válido más cercano (sanitize), con lo que se resuelven al arrancar los valores por defecto de la configuración (resolvePlatformSettingDefault)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type VentilatorParameterLimit, VENTILATOR_PARAMETER_LIMITS } from "@/common/domain/ventilator/ventilator-limits";
import { AI_USE_CASE_VALUES, type AiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";
import { PlatformSettingNotFoundError } from "@/features/platform-settings/domain/platform-settings.errors";
import { type NumberLimits, PlatformSettingValueReader } from "@/features/platform-settings/domain/registry/platform-setting-value-reader";
import {
  type AiModelPriceValue,
  type AiPricesSettingValue,
  type AiQuotaLimitValue,
  type AiQuotasSettingValue,
  type AiUseCaseSettingKey,
  type AiUseCaseSettingValue,
  type PlatformSettingCategoryValue,
  type PlatformSettingKey,
  type PlatformSettingValues,
  type SimulationRubricThresholdsValue,
} from "@/features/platform-settings/domain/registry/platform-setting-values";
import { TIME_MULTIPLIER_VALUES } from "@/features/simulation/domain/value-objects/simulation-session-values";
import { USER_ROLE_VALUES } from "@/features/users/domain/value-objects/user-role";

export type PlatformSettingLimits = Readonly<Record<string, unknown>>;

export interface PlatformSettingDefinition<K extends PlatformSettingKey = PlatformSettingKey> {
  readonly key: K;
  readonly category: PlatformSettingCategoryValue;
  readonly description: string;
  readonly limits: PlatformSettingLimits;
  readonly parse: (value: unknown) => PlatformSettingValues[K];
  readonly sanitize: (value: unknown) => PlatformSettingValues[K];
}

export interface PlatformSettingDefaultResolution {
  readonly value: unknown;
  readonly issue?: string;
}

type SettingReadFn<V> = (reader: PlatformSettingValueReader, value: unknown) => V;

export type PlatformSettingsRegistry = { readonly [K in PlatformSettingKey]: PlatformSettingDefinition<K> };

type NumberSettingKey = { [K in PlatformSettingKey]: PlatformSettingValues[K] extends number ? K : never }[PlatformSettingKey];

export const AI_QUOTA_ANY_USE_CASE: string = "*";

const VALUE_PATH: string = "value";
const MAX_PROVIDER_CHAIN_LENGTH: number = 8;
const MAX_IDENTIFIER_LENGTH: number = 100;
const MAX_MODEL_NAME_LENGTH: number = 200;
const AI_TIMEOUT_LIMITS: NumberLimits = { min: 1000, max: 120_000, integer: true };
const AI_MAX_OUTPUT_TOKENS_LIMITS: NumberLimits = { min: 1, max: 32_768, integer: true };
const AI_TEMPERATURE_LIMITS: NumberLimits = { min: 0, max: 2, integer: false };
const AI_REQUESTS_PER_DAY_LIMITS: NumberLimits = { min: 0, max: 100_000, integer: true };
const AI_TOKENS_PER_DAY_LIMITS: NumberLimits = { min: 0, max: 100_000_000, integer: true };
const AI_PRICE_PER_1K_LIMITS: NumberLimits = { min: 0, max: 1, integer: false };
const REQUIRED_TIME_MULTIPLIER: number = 1;

const RUBRIC_THRESHOLD_LIMITS: Readonly<Record<keyof SimulationRubricThresholdsValue, NumberLimits>> = {
  targetsReached: { min: 0.01, max: 1, integer: false },
  timeToStabilizeSeconds: { min: 1, max: 3600, integer: false },
  timeInRangePercent: { min: 1, max: 100, integer: false },
  safetyToleranceSeconds: { min: 0, max: 600, integer: false },
};

function safetyLimits(parameter: VentilatorParameterLimit): NumberLimits {
  return { min: parameter.min, max: parameter.max, integer: false };
}

function setting<K extends PlatformSettingKey>(
  key: K,
  category: PlatformSettingCategoryValue,
  description: string,
  limits: PlatformSettingLimits,
  read: SettingReadFn<PlatformSettingValues[K]>,
): PlatformSettingDefinition<K> {
  return {
    key,
    category,
    description,
    limits,
    parse: (value: unknown): PlatformSettingValues[K] => read(new PlatformSettingValueReader(key), value),
    sanitize: (value: unknown): PlatformSettingValues[K] => read(new PlatformSettingValueReader(key, true), value),
  };
}

function numberSetting<K extends NumberSettingKey>(key: K, category: PlatformSettingCategoryValue, description: string, limits: NumberLimits): PlatformSettingDefinition<K> {
  return setting(key, category, description, { ...limits }, (reader: PlatformSettingValueReader, value: unknown): PlatformSettingValues[K] =>
    reader.number(VALUE_PATH, value, limits) as PlatformSettingValues[K],
  );
}

function readAiUseCase(reader: PlatformSettingValueReader, value: unknown): AiUseCaseSettingValue {
  const record: Record<string, unknown> = reader.object(VALUE_PATH, value, ["providerChain", "models", "timeoutMs", "maxOutputTokens", "temperature"]);
  const providerChain: string[] = reader
    .array("providerChain", record.providerChain, 1, MAX_PROVIDER_CHAIN_LENGTH)
    .map((provider: unknown, index: number): string => reader.string(`providerChain[${index}]`, provider, MAX_IDENTIFIER_LENGTH));

  if (new Set(providerChain).size !== providerChain.length) {
    reader.invalid("providerChain", "must not repeat a provider");
  }

  const models: Record<string, string> = {};

  for (const [provider, model] of Object.entries(reader.object("models", record.models))) {
    models[reader.string("models", provider, MAX_IDENTIFIER_LENGTH)] = reader.string(`models.${provider}`, model, MAX_MODEL_NAME_LENGTH);
  }

  const withoutModel: string[] = providerChain.filter((provider: string): boolean => models[provider] === undefined);

  if (withoutModel.length > 0) {
    reader.invalid("models", `needs a model for ${withoutModel.join(", ")}`);
  }

  return {
    providerChain,
    models,
    timeoutMs: reader.number("timeoutMs", record.timeoutMs, AI_TIMEOUT_LIMITS),
    maxOutputTokens: reader.number("maxOutputTokens", record.maxOutputTokens, AI_MAX_OUTPUT_TOKENS_LIMITS),
    temperature: reader.number("temperature", record.temperature, AI_TEMPERATURE_LIMITS),
  };
}

function aiUseCaseSetting(useCase: AiUseCaseValue): PlatformSettingDefinition<AiUseCaseSettingKey> {
  const key: AiUseCaseSettingKey = `ai.useCase.${useCase}`;

  return setting(
    key,
    "ai",
    `Provider chain (in order), model per provider, timeout, max output tokens and temperature of the ${useCase} AI use case`,
    {
      providerChain: { minLength: 1, maxLength: MAX_PROVIDER_CHAIN_LENGTH, requiresCredentials: true },
      timeoutMs: AI_TIMEOUT_LIMITS,
      maxOutputTokens: AI_MAX_OUTPUT_TOKENS_LIMITS,
      temperature: AI_TEMPERATURE_LIMITS,
    },
    readAiUseCase,
  );
}

function readAiQuotas(reader: PlatformSettingValueReader, value: unknown): AiQuotasSettingValue {
  const quotaUseCases: readonly string[] = [...AI_USE_CASE_VALUES, AI_QUOTA_ANY_USE_CASE];
  const result: Record<string, Record<string, AiQuotaLimitValue>> = {};

  for (const [role, perUseCase] of Object.entries(reader.object(VALUE_PATH, value, USER_ROLE_VALUES))) {
    result[role] = {};

    for (const [useCase, limit] of Object.entries(reader.object(role, perUseCase, quotaUseCases))) {
      const limitRecord: Record<string, unknown> = reader.object(`${role}.${useCase}`, limit, ["requestsPerDay", "tokensPerDay"]);
      const requestsPerDay: number | undefined = reader.optionalNumber(`${role}.${useCase}.requestsPerDay`, limitRecord.requestsPerDay, AI_REQUESTS_PER_DAY_LIMITS);
      const tokensPerDay: number | undefined = reader.optionalNumber(`${role}.${useCase}.tokensPerDay`, limitRecord.tokensPerDay, AI_TOKENS_PER_DAY_LIMITS);

      result[role][useCase] = {
        ...(requestsPerDay === undefined ? {} : { requestsPerDay }),
        ...(tokensPerDay === undefined ? {} : { tokensPerDay }),
      };
    }
  }

  return result;
}

function readAiPrices(reader: PlatformSettingValueReader, value: unknown): AiPricesSettingValue {
  const result: Record<string, Record<string, AiModelPriceValue>> = {};

  for (const [provider, models] of Object.entries(reader.object(VALUE_PATH, value))) {
    result[reader.string(VALUE_PATH, provider, MAX_IDENTIFIER_LENGTH)] = {};

    for (const [model, price] of Object.entries(reader.object(provider, models))) {
      const priceRecord: Record<string, unknown> = reader.object(`${provider}.${model}`, price, ["inputPer1kUsd", "outputPer1kUsd"]);

      result[provider][reader.string(provider, model, MAX_MODEL_NAME_LENGTH)] = {
        inputPer1kUsd: reader.number(`${provider}.${model}.inputPer1kUsd`, priceRecord.inputPer1kUsd, AI_PRICE_PER_1K_LIMITS),
        outputPer1kUsd: reader.number(`${provider}.${model}.outputPer1kUsd`, priceRecord.outputPer1kUsd, AI_PRICE_PER_1K_LIMITS),
      };
    }
  }

  return result;
}

function readRubricThresholds(reader: PlatformSettingValueReader, value: unknown): SimulationRubricThresholdsValue {
  const record: Record<string, unknown> = reader.object(VALUE_PATH, value, Object.keys(RUBRIC_THRESHOLD_LIMITS));

  return {
    targetsReached: reader.number("targetsReached", record.targetsReached, RUBRIC_THRESHOLD_LIMITS.targetsReached),
    timeToStabilizeSeconds: reader.number("timeToStabilizeSeconds", record.timeToStabilizeSeconds, RUBRIC_THRESHOLD_LIMITS.timeToStabilizeSeconds),
    timeInRangePercent: reader.number("timeInRangePercent", record.timeInRangePercent, RUBRIC_THRESHOLD_LIMITS.timeInRangePercent),
    safetyToleranceSeconds: reader.number("safetyToleranceSeconds", record.safetyToleranceSeconds, RUBRIC_THRESHOLD_LIMITS.safetyToleranceSeconds),
  };
}

function readTimeMultipliers(reader: PlatformSettingValueReader, value: unknown): readonly number[] {
  const allowed: readonly number[] = TIME_MULTIPLIER_VALUES;
  const entryLimits: NumberLimits = { min: Math.min(...allowed), max: Math.max(...allowed), integer: true };

  if (reader.clamping) {
    const kept: number[] = reader
      .array(VALUE_PATH, value, 0, Number.MAX_SAFE_INTEGER)
      .map((entry: unknown, index: number): number => reader.number(`${VALUE_PATH}[${index}]`, entry, entryLimits))
      .filter((multiplier: number): boolean => allowed.includes(multiplier));

    return [...new Set([REQUIRED_TIME_MULTIPLIER, ...kept])].sort((left: number, right: number): number => left - right);
  }

  const multipliers: number[] = reader.array(VALUE_PATH, value, 1, allowed.length).map((entry: unknown, index: number): number => {
    const multiplier: number = reader.number(`${VALUE_PATH}[${index}]`, entry, entryLimits);

    return allowed.includes(multiplier) ? multiplier : reader.outOfLimits(`${VALUE_PATH}[${index}]`, `must be one of ${allowed.join(", ")}`);
  });

  if (new Set(multipliers).size !== multipliers.length) {
    reader.invalid(VALUE_PATH, "must not repeat a multiplier");
  }

  if (!multipliers.includes(REQUIRED_TIME_MULTIPLIER)) {
    reader.outOfLimits(VALUE_PATH, `must include ${REQUIRED_TIME_MULTIPLIER}`);
  }

  return [...multipliers].sort((left: number, right: number): number => left - right);
}

const AI_USE_CASE_SETTINGS: { readonly [K in AiUseCaseSettingKey]: PlatformSettingDefinition<K> } = Object.fromEntries(
  AI_USE_CASE_VALUES.map((useCase: AiUseCaseValue): [string, PlatformSettingDefinition<AiUseCaseSettingKey>] => [`ai.useCase.${useCase}`, aiUseCaseSetting(useCase)]),
) as { readonly [K in AiUseCaseSettingKey]: PlatformSettingDefinition<K> };

export const PLATFORM_SETTINGS_REGISTRY: PlatformSettingsRegistry = {
  ...AI_USE_CASE_SETTINGS,
  "ai.quotas": setting(
    "ai.quotas",
    "ai",
    "Daily AI requests and tokens per role and use case (\"*\" applies to every use case without its own entry); roles without an entry are unlimited",
    { roles: USER_ROLE_VALUES, useCases: [...AI_USE_CASE_VALUES, AI_QUOTA_ANY_USE_CASE], requestsPerDay: AI_REQUESTS_PER_DAY_LIMITS, tokensPerDay: AI_TOKENS_PER_DAY_LIMITS },
    readAiQuotas,
  ),
  "ai.prices": setting(
    "ai.prices",
    "ai",
    "USD price per 1k input and output tokens per provider and model, used for cost estimates",
    { inputPer1kUsd: AI_PRICE_PER_1K_LIMITS, outputPer1kUsd: AI_PRICE_PER_1K_LIMITS },
    readAiPrices,
  ),
  "ai.tutor.topicCheck.enabled": setting(
    "ai.tutor.topicCheck.enabled",
    "ai",
    "Whether the AI tutor checks that free chat questions are on topic (TOPIC_CHECK) before answering",
    {},
    (reader: PlatformSettingValueReader, value: unknown): boolean => reader.boolean(VALUE_PATH, value),
  ),
  "evaluation.passingGrade": numberSetting("evaluation.passingGrade", "evaluation", "Minimum grade (0-5 scale) that passes an evaluation", { min: 0, max: 5, integer: false }),
  "evaluation.submitGraceSeconds": numberSetting(
    "evaluation.submitGraceSeconds",
    "evaluation",
    "Seconds after an attempt deadline during which a submission is still accepted",
    { min: 0, max: 600, integer: true },
  ),
  "analytics.risk.maxFailedEvaluations": numberSetting(
    "analytics.risk.maxFailedEvaluations",
    "analytics",
    "Failed evaluations (latest published attempt) a student may have before the teacher dashboard flags them at risk; 0 flags any failed evaluation",
    { min: 0, max: 100, integer: true },
  ),
  "analytics.risk.minProgressPct": numberSetting(
    "analytics.risk.minProgressPct",
    "analytics",
    "Overall progress percentage below which the teacher dashboard flags a student at risk; 0 disables the rule",
    { min: 0, max: 100, integer: false },
  ),
  "analytics.risk.inactivityDays": numberSetting(
    "analytics.risk.inactivityDays",
    "analytics",
    "Days without activity after which the teacher dashboard flags a student at risk; 0 disables the rule",
    { min: 0, max: 365, integer: true },
  ),
  "simulation.rubric.defaultThresholds": setting(
    "simulation.rubric.defaultThresholds",
    "simulation",
    "Thresholds of the default simulation rubric, used when neither the question nor the case defines one",
    RUBRIC_THRESHOLD_LIMITS,
    readRubricThresholds,
  ),
  "simulation.allowedTimeMultipliers": setting(
    "simulation.allowedTimeMultipliers",
    "simulation",
    "Slow-dynamics time multipliers a student may choose when starting a simulation session",
    { allowedValues: TIME_MULTIPLIER_VALUES, required: [REQUIRED_TIME_MULTIPLIER] },
    readTimeMultipliers,
  ),
  "simulation.abandonAfterMinutes": numberSetting(
    "simulation.abandonAfterMinutes",
    "simulation",
    "Minutes without events after which a simulation session is marked as abandoned",
    { min: 1, max: 1440, integer: true },
  ),
  "reservations.maxDurationMinutes": numberSetting("reservations.maxDurationMinutes", "reservations", "Maximum duration of a ventilator reservation", { min: 5, max: 1440, integer: true }),
  "reservations.slotMinutes": numberSetting("reservations.slotMinutes", "reservations", "Slot granularity reservations must start and end on", { min: 1, max: 60, integer: true }),
  "reservations.maxAdvanceDays": numberSetting("reservations.maxAdvanceDays", "reservations", "How many days ahead a reservation may start", { min: 1, max: 365, integer: true }),
  "reservations.maxUpcomingPerStudent": numberSetting(
    "reservations.maxUpcomingPerStudent",
    "reservations",
    "Maximum upcoming reservations held by one student",
    { min: 1, max: 100, integer: true },
  ),
  "reservations.maxUpcomingPerGroup": numberSetting("reservations.maxUpcomingPerGroup", "reservations", "Maximum upcoming reservations held by one group", { min: 1, max: 100, integer: true }),
  "telemetry.flushIntervalMs": numberSetting(
    "telemetry.flushIntervalMs",
    "telemetry",
    "Interval at which buffered telemetry frames are sent to clients; a change reschedules the timer without a restart",
    { min: 5, max: 1000, integer: true },
  ),
  "telemetry.staleAfterMs": numberSetting(
    "telemetry.staleAfterMs",
    "telemetry",
    "Milliseconds without telemetry after which the device is reported without data",
    { min: 250, max: 600_000, integer: true },
  ),
  "telemetry.recordingHz": numberSetting("telemetry.recordingHz", "telemetry", "Sample rate of telemetry recordings (applies to new recordings)", { min: 1, max: 1000, integer: true }),
  "telemetry.recordingFlushSeconds": numberSetting(
    "telemetry.recordingFlushSeconds",
    "telemetry",
    "Seconds between persisted recording chunks (applies to new recordings)",
    { min: 1, max: 3600, integer: true },
  ),
  "commands.ratePerSecond": numberSetting("commands.ratePerSecond", "commands", "Ventilator commands each user may send per second", { min: 0.1, max: 100, integer: false }),
  "commands.ackTimeoutMs": numberSetting("commands.ackTimeoutMs", "commands", "Milliseconds to wait for the device acknowledgement of a command", { min: 100, max: 60_000, integer: true }),
  "commands.safety.maxPeep": numberSetting(
    "commands.safety.maxPeep",
    "commands",
    "Highest PEEP (cmH2O) a command may set; bounded by the shared ventilator parameter limits",
    safetyLimits(VENTILATOR_PARAMETER_LIMITS.peepCmH2O),
  ),
  "commands.safety.maxPressureLimit": numberSetting(
    "commands.safety.maxPressureLimit",
    "commands",
    "Highest pressure limit (cmH2O) a command may set; bounded by the shared ventilator parameter limits",
    safetyLimits(VENTILATOR_PARAMETER_LIMITS.pressureLimitCmH2O),
  ),
  "commands.safety.maxTidalVolume": numberSetting(
    "commands.safety.maxTidalVolume",
    "commands",
    "Highest tidal volume (mL) a command may set; bounded by the shared ventilator parameter limits",
    safetyLimits(VENTILATOR_PARAMETER_LIMITS.tidalVolumeMl),
  ),
  "commands.safety.maxRespiratoryRate": numberSetting(
    "commands.safety.maxRespiratoryRate",
    "commands",
    "Highest respiratory rate (breaths/min) a command may set; bounded by the shared ventilator parameter limits",
    safetyLimits(VENTILATOR_PARAMETER_LIMITS.respiratoryRateBpm),
  ),
  "commands.safety.maxIeRatio": numberSetting("commands.safety.maxIeRatio", "commands", "Highest I:E ratio (inspiration over expiration) a command may set", {
    min: 0.1,
    max: 4,
    integer: false,
  }),
};

export const PLATFORM_SETTING_KEYS: readonly PlatformSettingKey[] = Object.keys(PLATFORM_SETTINGS_REGISTRY) as PlatformSettingKey[];

export function isPlatformSettingKey(key: string): key is PlatformSettingKey {
  return Object.prototype.hasOwnProperty.call(PLATFORM_SETTINGS_REGISTRY, key);
}

export function getPlatformSettingDefinition(key: string): PlatformSettingDefinition {
  if (!isPlatformSettingKey(key)) {
    throw new PlatformSettingNotFoundError(key);
  }

  return PLATFORM_SETTINGS_REGISTRY[key];
}

export function isAiUseCaseSettingKey(key: string): key is AiUseCaseSettingKey {
  return Object.prototype.hasOwnProperty.call(AI_USE_CASE_SETTINGS, key);
}

export function platformSettingLockKey(key: string): string {
  return `platform-settings:key:${key}`;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : "invalid value";
}

export function resolvePlatformSettingDefault(key: PlatformSettingKey, configured: unknown, codeDefault: () => unknown): PlatformSettingDefaultResolution {
  const definition: PlatformSettingDefinition = PLATFORM_SETTINGS_REGISTRY[key];

  try {
    return { value: definition.parse(configured) };
  } catch (error: unknown) {
    const reason: string = describeError(error);

    try {
      return { value: definition.sanitize(configured), issue: `${reason}; using the nearest valid value` };
    } catch {
      try {
        return { value: definition.sanitize(codeDefault()), issue: `${reason}; using the code default` };
      } catch (fallbackError: unknown) {
        return { value: configured, issue: `${reason}; the code default is not valid either (${describeError(fallbackError)}), keeping the configured value` };
      }
    }
  }
}
