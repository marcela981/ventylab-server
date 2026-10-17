/*
 * Funcionalidad: Pruebas del registro de ajustes de la plataforma
 * Descripción: Verifica la validación de tipo y forma, los límites duros (incluidos los límites de seguridad de los comandos acotados por VENTILATOR_PARAMETER_LIMITS), los multiplicadores de tiempo, la cadena de proveedores de IA, las claves desconocidas, los metadatos de cada clave (tipo coherente con su validación, etiqueta y descripción en español, unidad y esquema de claves de los mapas con los proveedores de IA registrados) y el detalle por campo de los errores con la ruta del ajuste y el código de motivo traducible
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { VENTILATOR_PARAMETER_LIMITS } from "@/common/domain/ventilator/ventilator-limits";
import { AI_PROVIDER_ID_VALUES } from "@/features/ai/domain/value-objects/ai-provider-id";
import { AI_USE_CASE_VALUES } from "@/features/ai/domain/value-objects/ai-use-case";
import { buildTestDefaults, TEST_AI_USE_CASE } from "@/features/platform-settings/application/testing/platform-settings-test-doubles-spec";
import {
  InvalidPlatformSettingValueError,
  PlatformSettingHardLimitExceededError,
  PlatformSettingNotFoundError,
} from "@/features/platform-settings/domain/platform-settings.errors";
import { type PlatformSettingFieldError } from "@/features/platform-settings/domain/registry/platform-setting-reasons";
import { PLATFORM_SETTING_VALUE_TYPE_VALUES, type PlatformSettingKey } from "@/features/platform-settings/domain/registry/platform-setting-values";
import {
  getPlatformSettingDefinition,
  PLATFORM_SETTING_KEYS,
  PLATFORM_SETTINGS_REGISTRY,
  type PlatformSettingDefaultResolution,
  type PlatformSettingDefinition,
  resolvePlatformSettingDefault,
} from "@/features/platform-settings/domain/registry/platform-settings.registry";

function parse(key: string, value: unknown): unknown {
  return getPlatformSettingDefinition(key).parse(value);
}

function fieldErrorsOf(key: string, value: unknown): readonly PlatformSettingFieldError[] {
  try {
    parse(key, value);
  } catch (error: unknown) {
    if (error instanceof InvalidPlatformSettingValueError || error instanceof PlatformSettingHardLimitExceededError) {
      return error.fieldErrors;
    }

    throw error;
  }

  return [];
}

const ENGLISH_WORDS: RegExp = /\b(the|of|which|after|per|used|whether|maximum|highest|seconds|minutes)\b/i;

describe("platform settings registry", () => {
  it("defines one AI use case key per use case and a category and description for every key", () => {
    const aiUseCaseKeys: string[] = PLATFORM_SETTING_KEYS.filter((key: string): boolean => key.startsWith("ai.useCase."));

    expect(aiUseCaseKeys).toHaveLength(AI_USE_CASE_VALUES.length);
    expect(PLATFORM_SETTING_KEYS.every((key: PlatformSettingKey): boolean => PLATFORM_SETTINGS_REGISTRY[key].description.length > 0)).toBe(true);
  });

  it("accepts every test default, so defaults and validators agree", () => {
    const defaults: Record<string, unknown> = buildTestDefaults();

    const parsed: unknown[] = PLATFORM_SETTING_KEYS.map((key: PlatformSettingKey): unknown => parse(key, defaults[key]));

    expect(parsed).toHaveLength(PLATFORM_SETTING_KEYS.length);
  });

  it("rejects an unknown key", () => {
    expect(() => parse("telemetry.unknown", 1)).toThrow(PlatformSettingNotFoundError);
  });

  it.each<[string, unknown]>([
    ["telemetry.flushIntervalMs", "50"],
    ["telemetry.flushIntervalMs", 12.5],
    ["ai.tutor.topicCheck.enabled", "false"],
    ["simulation.rubric.defaultThresholds", { targetsReached: 1 }],
    ["ai.quotas", { GUEST: {} }],
    ["ai.useCase.FREE_CHAT", { ...TEST_AI_USE_CASE, unknownField: 1 }],
  ])("rejects an invalid value for %s with InvalidPlatformSettingValueError (422)", (key: string, value: unknown) => {
    expect(() => parse(key, value)).toThrow(InvalidPlatformSettingValueError);
  });

  it.each<[string, unknown]>([
    ["telemetry.flushIntervalMs", 4],
    ["telemetry.flushIntervalMs", 1001],
    ["evaluation.passingGrade", 5.5],
    ["reservations.slotMinutes", 61],
    ["commands.ratePerSecond", 0],
    ["commands.safety.maxPeep", VENTILATOR_PARAMETER_LIMITS.peepCmH2O.max + 1],
    ["commands.safety.maxTidalVolume", VENTILATOR_PARAMETER_LIMITS.tidalVolumeMl.max + 1],
    ["commands.safety.maxRespiratoryRate", VENTILATOR_PARAMETER_LIMITS.respiratoryRateBpm.max + 1],
    ["commands.safety.maxPressureLimit", VENTILATOR_PARAMETER_LIMITS.pressureLimitCmH2O.max + 1],
    ["simulation.allowedTimeMultipliers", [1, 3]],
    ["simulation.allowedTimeMultipliers", [2, 4]],
    ["ai.useCase.FREE_CHAT", { ...TEST_AI_USE_CASE, timeoutMs: 500 }],
    ["ai.useCase.FREE_CHAT", { ...TEST_AI_USE_CASE, temperature: 3 }],
    ["ai.prices", { gemini: { m: { inputPer1kUsd: 2, outputPer1kUsd: 0 } } }],
    ["ai.quotas", { STUDENT: { "*": { requestsPerDay: 1_000_000 } } }],
  ])("rejects %s = %p outside its hard limits with PlatformSettingHardLimitExceededError (422)", (key: string, value: unknown) => {
    expect(() => parse(key, value)).toThrow(PlatformSettingHardLimitExceededError);
  });

  it("accepts the hard limit itself for a command safety limit", () => {
    expect(parse("commands.safety.maxPeep", VENTILATOR_PARAMETER_LIMITS.peepCmH2O.max)).toBe(VENTILATOR_PARAMETER_LIMITS.peepCmH2O.max);
  });

  it("requires a model for every provider of an AI chain and no repeated providers", () => {
    expect(() => parse("ai.useCase.FREE_CHAT", { ...TEST_AI_USE_CASE, providerChain: ["anthropic"] })).toThrow(/needs a model for anthropic/);
    expect(() => parse("ai.useCase.FREE_CHAT", { ...TEST_AI_USE_CASE, providerChain: ["gemini", "gemini"] })).toThrow(InvalidPlatformSettingValueError);
  });

  it("sorts the allowed time multipliers", () => {
    expect(parse("simulation.allowedTimeMultipliers", [4, 1])).toEqual([1, 4]);
  });

  it.each<[PlatformSettingKey, unknown, unknown]>([
    ["telemetry.flushIntervalMs", 5000, 1000],
    ["telemetry.flushIntervalMs", 2, 5],
    ["reservations.slotMinutes", 12.6, 13],
    ["simulation.allowedTimeMultipliers", [4, 3, 2, 2], [1, 2, 4]],
    ["simulation.rubric.defaultThresholds", { targetsReached: 2, timeToStabilizeSeconds: 300, timeInRangePercent: 80, safetyToleranceSeconds: 0 }, { targetsReached: 1, timeToStabilizeSeconds: 300, timeInRangePercent: 80, safetyToleranceSeconds: 0 }],
    ["ai.useCase.FREE_CHAT", { ...TEST_AI_USE_CASE, timeoutMs: 500_000 }, { ...TEST_AI_USE_CASE, timeoutMs: 120_000 }],
  ])("resolves an invalid configured default of %s = %p to the nearest valid value with an issue", (key: PlatformSettingKey, configured: unknown, expected: unknown) => {
    const resolution: PlatformSettingDefaultResolution = resolvePlatformSettingDefault(key, configured, (): unknown => undefined);

    expect(resolution.value).toEqual(expected);
    expect(resolution.issue).toContain("nearest valid value");
  });

  it("keeps a valid configured default without an issue", () => {
    expect(resolvePlatformSettingDefault("telemetry.flushIntervalMs", 33, (): unknown => 40)).toEqual({ value: 33 });
  });

  it("falls back to the code default when the configured default cannot be adjusted", () => {
    const resolution: PlatformSettingDefaultResolution = resolvePlatformSettingDefault("ai.tutor.topicCheck.enabled", "yes", (): unknown => true);

    expect(resolution).toEqual({ value: true, issue: expect.stringContaining("using the code default") });
  });

  it("keeps the configured value and reports it when neither it nor the code default is valid", () => {
    const resolution: PlatformSettingDefaultResolution = resolvePlatformSettingDefault("ai.tutor.topicCheck.enabled", "yes", (): unknown => {
      throw new Error("unreadable");
    });

    expect(resolution).toEqual({ value: "yes", issue: expect.stringContaining("keeping the configured value") });
  });

  it("describes every key in Spanish with a known value type", () => {
    for (const key of PLATFORM_SETTING_KEYS) {
      const definition: PlatformSettingDefinition = PLATFORM_SETTINGS_REGISTRY[key];

      expect(PLATFORM_SETTING_VALUE_TYPE_VALUES).toContain(definition.type);
      expect(definition.label.length).toBeGreaterThan(0);
      expect(definition.description).not.toMatch(ENGLISH_WORDS);
      expect(definition.unit === null || definition.unit.length > 0).toBe(true);
    }
  });

  it("derives the number type from the integer limit", () => {
    expect(PLATFORM_SETTINGS_REGISTRY["telemetry.flushIntervalMs"]).toMatchObject({ type: "integer", label: "Intervalo de envío de telemetría", unit: "milisegundos", keySchema: null });
    expect(PLATFORM_SETTINGS_REGISTRY["evaluation.passingGrade"].type).toBe("number");
    expect(PLATFORM_SETTINGS_REGISTRY["ai.tutor.topicCheck.enabled"].type).toBe("boolean");
    expect(PLATFORM_SETTINGS_REGISTRY["simulation.allowedTimeMultipliers"].type).toBe("integer-list");
  });

  it("gives map-like settings a key schema built from the registered AI providers, roles and use cases", () => {
    expect(PLATFORM_SETTINGS_REGISTRY["ai.prices"]).toMatchObject({
      type: "map",
      unit: "USD por 1000 tokens",
      keySchema: { path: null, keyLabel: "Proveedor", allowedKeys: AI_PROVIDER_ID_VALUES, valueType: "map", valueKeySchema: { keyLabel: "Modelo", allowedKeys: null, valueType: "object" } },
    });
    expect(PLATFORM_SETTINGS_REGISTRY["ai.quotas"].keySchema).toMatchObject({
      keyLabel: "Rol",
      allowedKeys: ["STUDENT", "TEACHER", "ADMIN"],
      valueType: "map",
      valueKeySchema: { keyLabel: "Caso de uso", allowedKeys: [...AI_USE_CASE_VALUES, "*"], valueType: "object" },
    });

    for (const useCase of AI_USE_CASE_VALUES) {
      expect(PLATFORM_SETTINGS_REGISTRY[`ai.useCase.${useCase}`]).toMatchObject({ type: "object", keySchema: { path: "models", allowedKeys: AI_PROVIDER_ID_VALUES, valueType: "string" } });
    }
  });

  it.each<[string, unknown, PlatformSettingFieldError]>([
    ["telemetry.flushIntervalMs", "fast", { field: "telemetry.flushIntervalMs", code: "platform-settings.reasons.not_a_number", args: {}, message: "must be a number" }],
    ["telemetry.flushIntervalMs", 5000, { field: "telemetry.flushIntervalMs", code: "platform-settings.reasons.out_of_range", args: { min: 5, max: 1000 }, message: "must be between 5 and 1000" }],
    [
      "ai.useCase.FREE_CHAT",
      { ...TEST_AI_USE_CASE, providerChain: [""] },
      { field: "ai.useCase.FREE_CHAT.providerChain[0]", code: "platform-settings.reasons.empty_string", args: {}, message: "must be a non-empty string" },
    ],
    [
      "simulation.allowedTimeMultipliers",
      [1, 3],
      { field: "simulation.allowedTimeMultipliers[1]", code: "platform-settings.reasons.not_allowed_value", args: { allowed: "1, 2, 4" }, message: "must be one of 1, 2, 4" },
    ],
    [
      "ai.prices",
      { gemini: { flash: { inputPer1kUsd: 2, outputPer1kUsd: 0 } } },
      { field: "ai.prices.gemini.flash.inputPer1kUsd", code: "platform-settings.reasons.out_of_range", args: { min: 0, max: 1 }, message: "must be between 0 and 1" },
    ],
  ])("reports the field error of %s = %p with the setting path and a translatable reason", (key: string, value: unknown, expected: PlatformSettingFieldError) => {
    expect(fieldErrorsOf(key, value)).toEqual([expected]);
  });

  it("keeps the English reason of the error message", () => {
    expect(() => parse("telemetry.flushIntervalMs", 5000)).toThrow("Platform setting telemetry.flushIntervalMs exceeds its hard limits: value must be between 5 and 1000");
  });
});
