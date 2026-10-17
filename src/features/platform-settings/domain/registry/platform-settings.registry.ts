/*
 * Funcionalidad: Registro de ajustes de la plataforma
 * Descripción: Define en código cada ajuste editable por un administrador (categoría, metadatos en español para un formulario genérico (tipo de valor, etiqueta, unidad y descripción) y esquema de claves de los ajustes con forma de mapa con los proveedores que registra la feature de IA, validación de tipo y forma y límites duros que ni un administrador puede superar): cadena de proveedores y modelos, tiempo límite, tokens y temperatura por caso de uso de IA, cuotas, precios y verificación de tema del tutor; nota aprobatoria y gracia de entrega de evaluaciones; umbrales de riesgo del panel docente (evaluaciones reprobadas toleradas, progreso mínimo y días de inactividad, 0 desactiva las dos últimas); umbrales de la rúbrica por defecto, multiplicadores de tiempo y abandono de simulaciones; reglas de reservas; intervalos de telemetría; frecuencia, tiempo de acuse y límites de seguridad de los comandos (dentro de VENTILATOR_PARAMETER_LIMITS). Cada ajuste valida (parse) y además ajusta un valor al válido más cercano (sanitize), con lo que se resuelven al arrancar los valores por defecto de la configuración (resolvePlatformSettingDefault)
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type VentilatorParameterLimit, VENTILATOR_PARAMETER_LIMITS } from "@/common/domain/ventilator/ventilator-limits";
import { AI_PROVIDER_ID_VALUES } from "@/features/ai/domain/value-objects/ai-provider-id";
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
  type PlatformSettingKeySchema,
  type PlatformSettingValues,
  type PlatformSettingValueTypeValue,
  type SimulationRubricThresholdsValue,
} from "@/features/platform-settings/domain/registry/platform-setting-values";
import { TIME_MULTIPLIER_VALUES } from "@/features/simulation/domain/value-objects/simulation-session-values";
import { USER_ROLE_VALUES } from "@/features/users/domain/value-objects/user-role";

export type PlatformSettingLimits = Readonly<Record<string, unknown>>;

export interface PlatformSettingText {
  readonly label: string;
  readonly unit: string | null;
  readonly description: string;
}

export interface PlatformSettingMetadata extends PlatformSettingText {
  readonly type: PlatformSettingValueTypeValue;
  readonly keySchema: PlatformSettingKeySchema | null;
}

export interface PlatformSettingDefinition<K extends PlatformSettingKey = PlatformSettingKey> extends PlatformSettingMetadata {
  readonly key: K;
  readonly category: PlatformSettingCategoryValue;
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

const AI_PROVIDER_KEY_LABEL: string = "Proveedor";

const AI_MODELS_KEY_SCHEMA: PlatformSettingKeySchema = {
  path: "models",
  keyLabel: AI_PROVIDER_KEY_LABEL,
  allowedKeys: AI_PROVIDER_ID_VALUES,
  valueType: "string",
  valueLimits: { maxLength: MAX_MODEL_NAME_LENGTH },
  valueKeySchema: null,
};

const AI_QUOTAS_KEY_SCHEMA: PlatformSettingKeySchema = {
  path: null,
  keyLabel: "Rol",
  allowedKeys: USER_ROLE_VALUES,
  valueType: "map",
  valueLimits: null,
  valueKeySchema: {
    path: null,
    keyLabel: "Caso de uso",
    allowedKeys: [...AI_USE_CASE_VALUES, AI_QUOTA_ANY_USE_CASE],
    valueType: "object",
    valueLimits: { requestsPerDay: AI_REQUESTS_PER_DAY_LIMITS, tokensPerDay: AI_TOKENS_PER_DAY_LIMITS },
    valueKeySchema: null,
  },
};

const AI_PRICES_KEY_SCHEMA: PlatformSettingKeySchema = {
  path: null,
  keyLabel: AI_PROVIDER_KEY_LABEL,
  allowedKeys: AI_PROVIDER_ID_VALUES,
  valueType: "map",
  valueLimits: null,
  valueKeySchema: {
    path: null,
    keyLabel: "Modelo",
    allowedKeys: null,
    valueType: "object",
    valueLimits: { inputPer1kUsd: AI_PRICE_PER_1K_LIMITS, outputPer1kUsd: AI_PRICE_PER_1K_LIMITS },
    valueKeySchema: null,
  },
};

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
  metadata: PlatformSettingMetadata,
  limits: PlatformSettingLimits,
  read: SettingReadFn<PlatformSettingValues[K]>,
): PlatformSettingDefinition<K> {
  return {
    key,
    category,
    ...metadata,
    limits,
    parse: (value: unknown): PlatformSettingValues[K] => read(new PlatformSettingValueReader(key), value),
    sanitize: (value: unknown): PlatformSettingValues[K] => read(new PlatformSettingValueReader(key, true), value),
  };
}

function numberSetting<K extends NumberSettingKey>(key: K, category: PlatformSettingCategoryValue, text: PlatformSettingText, limits: NumberLimits): PlatformSettingDefinition<K> {
  const metadata: PlatformSettingMetadata = { ...text, type: limits.integer ? "integer" : "number", keySchema: null };

  return setting(key, category, metadata, { ...limits }, (reader: PlatformSettingValueReader, value: unknown): PlatformSettingValues[K] =>
    reader.number(VALUE_PATH, value, limits) as PlatformSettingValues[K],
  );
}

function readAiUseCase(reader: PlatformSettingValueReader, value: unknown): AiUseCaseSettingValue {
  const record: Record<string, unknown> = reader.object(VALUE_PATH, value, ["providerChain", "models", "timeoutMs", "maxOutputTokens", "temperature"]);
  const providerChain: string[] = reader
    .array("providerChain", record.providerChain, 1, MAX_PROVIDER_CHAIN_LENGTH)
    .map((provider: unknown, index: number): string => reader.string(`providerChain[${index}]`, provider, MAX_IDENTIFIER_LENGTH));

  if (new Set(providerChain).size !== providerChain.length) {
    reader.invalid("providerChain", "repeated_provider");
  }

  const models: Record<string, string> = {};

  for (const [provider, model] of Object.entries(reader.object("models", record.models))) {
    models[reader.string("models", provider, MAX_IDENTIFIER_LENGTH)] = reader.string(`models.${provider}`, model, MAX_MODEL_NAME_LENGTH);
  }

  const withoutModel: string[] = providerChain.filter((provider: string): boolean => models[provider] === undefined);

  if (withoutModel.length > 0) {
    reader.invalid("models", "missing_models", { providers: withoutModel.join(", ") });
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
    {
      type: "object",
      label: `Caso de uso de IA ${useCase}`,
      unit: null,
      description: `Cadena de proveedores (en orden), modelo por proveedor, tiempo límite en milisegundos, máximo de tokens de salida y temperatura del caso de uso de IA ${useCase}`,
      keySchema: AI_MODELS_KEY_SCHEMA,
    },
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

    return allowed.includes(multiplier) ? multiplier : reader.outOfLimits(`${VALUE_PATH}[${index}]`, "not_allowed_value", { allowed: allowed.join(", ") });
  });

  if (new Set(multipliers).size !== multipliers.length) {
    reader.invalid(VALUE_PATH, "repeated_multiplier");
  }

  if (!multipliers.includes(REQUIRED_TIME_MULTIPLIER)) {
    reader.outOfLimits(VALUE_PATH, "missing_required_value", { required: REQUIRED_TIME_MULTIPLIER });
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
    {
      type: "map",
      label: "Cuotas diarias de IA",
      unit: null,
      description: "Solicitudes y tokens de IA diarios por rol y caso de uso (\"*\" aplica a todo caso de uso sin entrada propia); los roles sin entrada no tienen límite",
      keySchema: AI_QUOTAS_KEY_SCHEMA,
    },
    { roles: USER_ROLE_VALUES, useCases: [...AI_USE_CASE_VALUES, AI_QUOTA_ANY_USE_CASE], requestsPerDay: AI_REQUESTS_PER_DAY_LIMITS, tokensPerDay: AI_TOKENS_PER_DAY_LIMITS },
    readAiQuotas,
  ),
  "ai.prices": setting(
    "ai.prices",
    "ai",
    {
      type: "map",
      label: "Precios de los modelos de IA",
      unit: "USD por 1000 tokens",
      description: "Precio en USD por cada 1000 tokens de entrada y de salida por proveedor y modelo, usado para estimar costos",
      keySchema: AI_PRICES_KEY_SCHEMA,
    },
    { inputPer1kUsd: AI_PRICE_PER_1K_LIMITS, outputPer1kUsd: AI_PRICE_PER_1K_LIMITS },
    readAiPrices,
  ),
  "ai.tutor.topicCheck.enabled": setting(
    "ai.tutor.topicCheck.enabled",
    "ai",
    {
      type: "boolean",
      label: "Verificación de tema del tutor",
      unit: null,
      description: "Si el tutor de IA verifica que las preguntas del chat libre traten del tema (TOPIC_CHECK) antes de responder",
      keySchema: null,
    },
    {},
    (reader: PlatformSettingValueReader, value: unknown): boolean => reader.boolean(VALUE_PATH, value),
  ),
  "evaluation.passingGrade": numberSetting(
    "evaluation.passingGrade",
    "evaluation",
    { label: "Nota aprobatoria", unit: "puntos", description: "Nota mínima (escala de 0 a 5) con la que se aprueba una evaluación" },
    { min: 0, max: 5, integer: false },
  ),
  "evaluation.submitGraceSeconds": numberSetting(
    "evaluation.submitGraceSeconds",
    "evaluation",
    { label: "Gracia de entrega", unit: "segundos", description: "Segundos después del límite de un intento durante los que todavía se acepta la entrega" },
    { min: 0, max: 600, integer: true },
  ),
  "analytics.risk.maxFailedEvaluations": numberSetting(
    "analytics.risk.maxFailedEvaluations",
    "analytics",
    {
      label: "Evaluaciones reprobadas toleradas",
      unit: "evaluaciones",
      description: "Evaluaciones reprobadas (último intento publicado) que un estudiante puede tener antes de que el panel docente lo marque en riesgo; 0 marca cualquier evaluación reprobada",
    },
    { min: 0, max: 100, integer: true },
  ),
  "analytics.risk.minProgressPct": numberSetting(
    "analytics.risk.minProgressPct",
    "analytics",
    { label: "Progreso mínimo", unit: "%", description: "Porcentaje de progreso general por debajo del cual el panel docente marca en riesgo a un estudiante; 0 desactiva la regla" },
    { min: 0, max: 100, integer: false },
  ),
  "analytics.risk.inactivityDays": numberSetting(
    "analytics.risk.inactivityDays",
    "analytics",
    { label: "Días de inactividad", unit: "días", description: "Días sin actividad tras los cuales el panel docente marca en riesgo a un estudiante; 0 desactiva la regla" },
    { min: 0, max: 365, integer: true },
  ),
  "simulation.rubric.defaultThresholds": setting(
    "simulation.rubric.defaultThresholds",
    "simulation",
    {
      type: "object",
      label: "Umbrales de la rúbrica por defecto",
      unit: null,
      description:
        "Umbrales de la rúbrica de simulación por defecto (fracción de objetivos alcanzados, segundos hasta estabilizar, porcentaje de tiempo en rango y segundos de tolerancia de seguridad), usada cuando ni la pregunta ni el caso definen una",
      keySchema: null,
    },
    RUBRIC_THRESHOLD_LIMITS,
    readRubricThresholds,
  ),
  "simulation.allowedTimeMultipliers": setting(
    "simulation.allowedTimeMultipliers",
    "simulation",
    {
      type: "integer-list",
      label: "Multiplicadores de tiempo permitidos",
      unit: null,
      description: "Multiplicadores de tiempo de dinámica lenta que un estudiante puede elegir al iniciar una sesión de simulación; siempre incluye 1",
      keySchema: null,
    },
    { allowedValues: TIME_MULTIPLIER_VALUES, required: [REQUIRED_TIME_MULTIPLIER] },
    readTimeMultipliers,
  ),
  "simulation.abandonAfterMinutes": numberSetting(
    "simulation.abandonAfterMinutes",
    "simulation",
    { label: "Abandono de sesión", unit: "minutos", description: "Minutos sin eventos tras los cuales una sesión de simulación se marca como abandonada" },
    { min: 1, max: 1440, integer: true },
  ),
  "reservations.maxDurationMinutes": numberSetting(
    "reservations.maxDurationMinutes",
    "reservations",
    { label: "Duración máxima de una reserva", unit: "minutos", description: "Duración máxima de una reserva del ventilador" },
    { min: 5, max: 1440, integer: true },
  ),
  "reservations.slotMinutes": numberSetting(
    "reservations.slotMinutes",
    "reservations",
    { label: "Franja de reserva", unit: "minutos", description: "Granularidad de las franjas en las que deben empezar y terminar las reservas" },
    { min: 1, max: 60, integer: true },
  ),
  "reservations.maxAdvanceDays": numberSetting(
    "reservations.maxAdvanceDays",
    "reservations",
    { label: "Anticipación máxima", unit: "días", description: "Con cuántos días de anticipación puede empezar una reserva" },
    { min: 1, max: 365, integer: true },
  ),
  "reservations.maxUpcomingPerStudent": numberSetting(
    "reservations.maxUpcomingPerStudent",
    "reservations",
    { label: "Reservas próximas por estudiante", unit: "reservas", description: "Máximo de reservas próximas que puede tener un estudiante" },
    { min: 1, max: 100, integer: true },
  ),
  "reservations.maxUpcomingPerGroup": numberSetting(
    "reservations.maxUpcomingPerGroup",
    "reservations",
    { label: "Reservas próximas por grupo", unit: "reservas", description: "Máximo de reservas próximas que puede tener un grupo" },
    { min: 1, max: 100, integer: true },
  ),
  "telemetry.flushIntervalMs": numberSetting(
    "telemetry.flushIntervalMs",
    "telemetry",
    {
      label: "Intervalo de envío de telemetría",
      unit: "milisegundos",
      description: "Intervalo con el que se envían a los clientes los fotogramas de telemetría acumulados; un cambio reprograma el temporizador sin reiniciar",
    },
    { min: 5, max: 1000, integer: true },
  ),
  "telemetry.staleAfterMs": numberSetting(
    "telemetry.staleAfterMs",
    "telemetry",
    { label: "Telemetría sin datos", unit: "milisegundos", description: "Milisegundos sin telemetría tras los cuales el dispositivo se informa sin datos" },
    { min: 250, max: 600_000, integer: true },
  ),
  "telemetry.recordingHz": numberSetting(
    "telemetry.recordingHz",
    "telemetry",
    { label: "Frecuencia de grabación", unit: "Hz", description: "Frecuencia de muestreo de las grabaciones de telemetría (aplica a las grabaciones nuevas)" },
    { min: 1, max: 1000, integer: true },
  ),
  "telemetry.recordingFlushSeconds": numberSetting(
    "telemetry.recordingFlushSeconds",
    "telemetry",
    { label: "Intervalo de guardado de grabaciones", unit: "segundos", description: "Segundos entre los fragmentos guardados de una grabación (aplica a las grabaciones nuevas)" },
    { min: 1, max: 3600, integer: true },
  ),
  "commands.ratePerSecond": numberSetting(
    "commands.ratePerSecond",
    "commands",
    { label: "Comandos por segundo", unit: "comandos por segundo", description: "Comandos del ventilador que cada usuario puede enviar por segundo" },
    { min: 0.1, max: 100, integer: false },
  ),
  "commands.ackTimeoutMs": numberSetting(
    "commands.ackTimeoutMs",
    "commands",
    { label: "Tiempo de acuse de comandos", unit: "milisegundos", description: "Milisegundos de espera del acuse del dispositivo para un comando" },
    { min: 100, max: 60_000, integer: true },
  ),
  "commands.safety.maxPeep": numberSetting(
    "commands.safety.maxPeep",
    "commands",
    { label: "PEEP máxima", unit: "cmH2O", description: "PEEP más alta que puede fijar un comando; acotada por los límites compartidos de los parámetros del ventilador" },
    safetyLimits(VENTILATOR_PARAMETER_LIMITS.peepCmH2O),
  ),
  "commands.safety.maxPressureLimit": numberSetting(
    "commands.safety.maxPressureLimit",
    "commands",
    {
      label: "Límite de presión máximo",
      unit: "cmH2O",
      description: "Límite de presión más alto que puede fijar un comando; acotado por los límites compartidos de los parámetros del ventilador",
    },
    safetyLimits(VENTILATOR_PARAMETER_LIMITS.pressureLimitCmH2O),
  ),
  "commands.safety.maxTidalVolume": numberSetting(
    "commands.safety.maxTidalVolume",
    "commands",
    {
      label: "Volumen corriente máximo",
      unit: "mL",
      description: "Volumen corriente más alto que puede fijar un comando; acotado por los límites compartidos de los parámetros del ventilador",
    },
    safetyLimits(VENTILATOR_PARAMETER_LIMITS.tidalVolumeMl),
  ),
  "commands.safety.maxRespiratoryRate": numberSetting(
    "commands.safety.maxRespiratoryRate",
    "commands",
    {
      label: "Frecuencia respiratoria máxima",
      unit: "respiraciones por minuto",
      description: "Frecuencia respiratoria más alta que puede fijar un comando; acotada por los límites compartidos de los parámetros del ventilador",
    },
    safetyLimits(VENTILATOR_PARAMETER_LIMITS.respiratoryRateBpm),
  ),
  "commands.safety.maxIeRatio": numberSetting(
    "commands.safety.maxIeRatio",
    "commands",
    { label: "Relación I:E máxima", unit: null, description: "Relación I:E más alta (inspiración sobre espiración) que puede fijar un comando" },
    { min: 0.1, max: 4, integer: false },
  ),
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
