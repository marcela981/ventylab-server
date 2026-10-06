/*
 * Funcionalidad: Pruebas del proveedor de configuración de IA
 * Descripción: Verifica los valores por defecto del gateway de IA, la combinación de sobrescrituras JSON por caso de uso, cuotas y precios, y los errores de arranque con JSON inválido
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiUseCaseSettings } from "@/features/ai/application/ports/ai-settings-provider.interface";
import { type AiSettingsSource, buildAiSettingsSnapshot, ConfigAiSettingsProvider } from "@/features/ai/infrastructure/config/ai-settings.provider";

function source(overrides: Partial<AiSettingsSource> = {}): AiSettingsSource {
  return {
    breakerFailureThreshold: 3,
    breakerOpenSeconds: 60,
    tutorHistoryWindow: 10,
    tutorContextTokenBudget: 6000,
    ...overrides,
  };
}

function provider(overrides: Partial<AiSettingsSource> = {}): ConfigAiSettingsProvider {
  return new ConfigAiSettingsProvider(buildAiSettingsSnapshot(source(overrides)));
}

describe("ConfigAiSettingsProvider", () => {
  it("should expose defaults with a model for every provider of the chain", () => {
    const settings: ConfigAiSettingsProvider = provider();
    const topicCheck: AiUseCaseSettings = settings.getUseCaseSettings("TOPIC_CHECK");

    for (const providerId of topicCheck.providerChain) {
      expect(topicCheck.models[providerId]).toBeDefined();
    }

    expect(topicCheck.maxOutputTokens).toBeLessThan(settings.getUseCaseSettings("FREE_CHAT").maxOutputTokens);
    expect(settings.getBreakerSettings()).toEqual({ failureThreshold: 3, openSeconds: 60 });
    expect(settings.getTutorSettings()).toEqual({ historyWindow: 10, contextTokenBudget: 6000 });
    expect(settings.getQuota("STUDENT", "FREE_CHAT")).toEqual({ requestsPerDay: 100, tokensPerDay: 200000 });
    expect(settings.getQuota("ADMIN", "FREE_CHAT")).toBeUndefined();
  });

  it("should merge use case overrides over the defaults", () => {
    const settings: ConfigAiSettingsProvider = provider({
      useCaseSettingsJson: JSON.stringify({ FREE_CHAT: { providerChain: ["openai"], models: { openai: "gpt-x" }, timeoutMs: 5000 } }),
    });

    const freeChat: AiUseCaseSettings = settings.getUseCaseSettings("FREE_CHAT");

    expect(freeChat.providerChain).toEqual(["openai"]);
    expect(freeChat.models.openai).toBe("gpt-x");
    expect(freeChat.models.gemini).toBeDefined();
    expect(freeChat.timeoutMs).toBe(5000);
    expect(settings.getUseCaseSettings("LESSON_QA").providerChain).not.toEqual(["openai"]);
  });

  it("should resolve a quota per use case before the wildcard", () => {
    const settings: ConfigAiSettingsProvider = provider({
      quotasJson: JSON.stringify({ STUDENT: { "*": { requestsPerDay: 10 }, FREE_CHAT: { tokensPerDay: 500 } } }),
    });

    expect(settings.getQuota("STUDENT", "FREE_CHAT")).toEqual({ tokensPerDay: 500, requestsPerDay: undefined });
    expect(settings.getQuota("STUDENT", "LESSON_QA")).toEqual({ requestsPerDay: 10, tokensPerDay: undefined });
    expect(settings.getQuota("TEACHER", "LESSON_QA")).toBeUndefined();
  });

  it("should add prices to the default table", () => {
    const settings: ConfigAiSettingsProvider = provider({ pricesJson: JSON.stringify({ custom: { "my-model": { inputPer1kUsd: 0.01, outputPer1kUsd: 0.02 } } }) });

    expect(settings.getPrice("custom", "my-model")).toEqual({ inputPer1kUsd: 0.01, outputPer1kUsd: 0.02 });
    expect(settings.getPrice("gemini", "gemini-2.5-flash")).toBeDefined();
    expect(settings.getPrice("gemini", "unknown")).toBeUndefined();
  });

  it.each<[string, Partial<AiSettingsSource>, RegExp]>([
    ["invalid JSON", { useCaseSettingsJson: "{nope" }, /AI_USE_CASE_SETTINGS: must be valid JSON/],
    ["unknown use case", { useCaseSettingsJson: "{\"CHAT\": {}}" }, /AI_USE_CASE_SETTINGS: unknown use case "CHAT"/],
    ["empty provider chain", { useCaseSettingsJson: "{\"FREE_CHAT\": {\"providerChain\": []}}" }, /FREE_CHAT.providerChain/],
    ["negative timeout", { useCaseSettingsJson: "{\"FREE_CHAT\": {\"timeoutMs\": -1}}" }, /FREE_CHAT.timeoutMs/],
    ["unknown role", { quotasJson: "{\"GUEST\": {}}" }, /AI_QUOTAS: unknown role "GUEST"/],
    ["array quotas", { quotasJson: "[]" }, /AI_QUOTAS: must be a JSON object/],
    ["incomplete price", { pricesJson: "{\"openai\": {\"m\": {\"inputPer1kUsd\": 1}}}" }, /AI_PRICES: openai.m needs/],
  ])("should fail at startup with %s", (_name: string, overrides: Partial<AiSettingsSource>, message: RegExp) => {
    expect(() => buildAiSettingsSnapshot(source(overrides))).toThrow(message);
  });
});
