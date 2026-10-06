/*
 * Funcionalidad: Pruebas de TelemetryAiQuotaGuard
 * Descripción: Verifica la cuota diaria de IA calculada desde la telemetría: límites por rol y caso de uso, consumo desde el inicio del día UTC con caché de corta duración, rechazo 429 con hora de reinicio a la medianoche UTC siguiente y registro QUOTA_EXCEEDED sin llamar al proveedor, y llamadas de sistema sin cuota
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiQuotaLimit } from "@/features/ai/application/ports/ai-settings-provider.interface";
import { AiGateway } from "@/features/ai/application/services/ai-gateway";
import { AiOrchestrator } from "@/features/ai/application/services/ai-orchestrator";
import {
  FakeLlmProvider,
  InMemoryAiCallRecorder,
  providerRegistry,
  StaticAiSettingsProvider,
} from "@/features/ai/application/testing/ai-test-doubles-spec";
import { AiQuotaExceededError } from "@/features/ai/domain/ai.errors";
import { AI_PROMPT_TEMPLATES } from "@/features/ai/domain/prompts/prompt-registry";
import { AiUsageCache } from "@/features/ai/infrastructure/quota/ai-usage-cache";
import { TelemetryAiQuotaGuard } from "@/features/ai/infrastructure/quota/telemetry-ai-quota-guard";
import { type AiTelemetryFacade } from "@/features/ai-telemetry/application/ai-telemetry.facade";
import { type AiUsage } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

const NOW: Date = new Date("2026-10-05T15:30:00.000Z");
const START_OF_DAY: Date = new Date("2026-10-05T00:00:00.000Z");
const NEXT_MIDNIGHT: Date = new Date("2026-10-06T00:00:00.000Z");
const CALL: { promptVersion: string; promptHash: string } = { promptVersion: "1.0.0", promptHash: "hash" };

type TelemetryDouble = jest.Mocked<Pick<AiTelemetryFacade, "getUsage" | "record">>;

function buildTelemetry(usage: AiUsage): TelemetryDouble {
  return { getUsage: jest.fn().mockResolvedValue(usage), record: jest.fn().mockResolvedValue(undefined) };
}

function buildSettings(quotas: Partial<Record<string, AiQuotaLimit>>): StaticAiSettingsProvider {
  return new StaticAiSettingsProvider({ providerChain: ["fake"], models: { fake: "fake-model" }, timeoutMs: 1000, maxOutputTokens: 256, temperature: 0.2 }, undefined, 100, quotas);
}

function buildGuard(telemetry: TelemetryDouble, quotas: Partial<Record<string, AiQuotaLimit>>, cache: AiUsageCache = new AiUsageCache()): TelemetryAiQuotaGuard {
  return new TelemetryAiQuotaGuard(telemetry as unknown as AiTelemetryFacade, buildSettings(quotas), cache);
}

describe("TelemetryAiQuotaGuard", () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ["setImmediate", "nextTick"] });
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should allow the call while the daily usage is under the role limit", async () => {
    const telemetry: TelemetryDouble = buildTelemetry({ requests: 4, inputTokens: 100, outputTokens: 100 });
    const guard: TelemetryAiQuotaGuard = buildGuard(telemetry, { STUDENT: { requestsPerDay: 5, tokensPerDay: 1000 } });

    await guard.assertWithinQuota("user-1", "STUDENT", "FREE_CHAT", CALL);

    expect(telemetry.getUsage).toHaveBeenCalledWith("user-1", "FREE_CHAT", START_OF_DAY);
    expect(telemetry.record).not.toHaveBeenCalled();
  });

  it("should reject with the next UTC midnight and record QUOTA_EXCEEDED when the request limit is reached", async () => {
    const telemetry: TelemetryDouble = buildTelemetry({ requests: 5, inputTokens: 0, outputTokens: 0 });
    const guard: TelemetryAiQuotaGuard = buildGuard(telemetry, { STUDENT: { requestsPerDay: 5 } });

    const error: unknown = await guard.assertWithinQuota("user-1", "STUDENT", "FREE_CHAT", { ...CALL, refType: "conversation", refId: "conv-1" }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AiQuotaExceededError);
    expect((error as AiQuotaExceededError).resetAt).toEqual(NEXT_MIDNIGHT);
    expect(telemetry.record).toHaveBeenCalledTimes(1);
    expect(telemetry.record).toHaveBeenCalledWith(
      expect.objectContaining({
        useCase: "FREE_CHAT",
        userId: "user-1",
        status: "QUOTA_EXCEEDED",
        errorCode: "QUOTA_EXCEEDED",
        attempts: 0,
        latencyMs: 0,
        promptVersion: "1.0.0",
        promptHash: "hash",
        refType: "conversation",
        refId: "conv-1",
      }),
    );
    expect(telemetry.record.mock.calls[0][0].provider).toBeUndefined();
  });

  it("should reject when the daily token limit is reached", async () => {
    const telemetry: TelemetryDouble = buildTelemetry({ requests: 1, inputTokens: 600, outputTokens: 400 });
    const guard: TelemetryAiQuotaGuard = buildGuard(telemetry, { STUDENT: { requestsPerDay: 100, tokensPerDay: 1000 } });

    await expect(guard.assertWithinQuota("user-1", "STUDENT", "FREE_CHAT", CALL)).rejects.toBeInstanceOf(AiQuotaExceededError);
  });

  it.each([
    ["no user (system call)", undefined, "STUDENT"],
    ["no role", "user-1", undefined],
    ["a role without quota", "user-1", "ADMIN"],
  ])("should skip the quota for %s", async (_label: string, userId: string | undefined, role: string | undefined) => {
    const telemetry: TelemetryDouble = buildTelemetry({ requests: 1000, inputTokens: 0, outputTokens: 0 });
    const guard: TelemetryAiQuotaGuard = buildGuard(telemetry, { STUDENT: { requestsPerDay: 1 } });

    await guard.assertWithinQuota(userId, role, "GRADE_FEEDBACK", CALL);

    expect(telemetry.getUsage).not.toHaveBeenCalled();
  });

  it("should reuse the cached usage within the TTL and count recorded calls locally", async () => {
    const telemetry: TelemetryDouble = buildTelemetry({ requests: 3, inputTokens: 0, outputTokens: 0 });
    const cache: AiUsageCache = new AiUsageCache();
    const guard: TelemetryAiQuotaGuard = buildGuard(telemetry, { STUDENT: { requestsPerDay: 5 } }, cache);

    await guard.assertWithinQuota("user-1", "STUDENT", "FREE_CHAT", CALL);
    cache.add("user-1", "FREE_CHAT", { requests: 1, inputTokens: 0, outputTokens: 0 }, new Date());
    await guard.assertWithinQuota("user-1", "STUDENT", "FREE_CHAT", CALL);
    cache.add("user-1", "FREE_CHAT", { requests: 1, inputTokens: 0, outputTokens: 0 }, new Date());
    const third: Promise<void> = guard.assertWithinQuota("user-1", "STUDENT", "FREE_CHAT", CALL);

    await expect(third).rejects.toBeInstanceOf(AiQuotaExceededError);
    expect(telemetry.getUsage).toHaveBeenCalledTimes(1);
  });

  it("should read the usage again from telemetry once the cache entry expires", async () => {
    const telemetry: TelemetryDouble = buildTelemetry({ requests: 0, inputTokens: 0, outputTokens: 0 });
    const guard: TelemetryAiQuotaGuard = buildGuard(telemetry, { STUDENT: { requestsPerDay: 5 } });

    await guard.assertWithinQuota("user-1", "STUDENT", "FREE_CHAT", CALL);
    jest.setSystemTime(new Date(NOW.getTime() + 16_000));
    await guard.assertWithinQuota("user-1", "STUDENT", "FREE_CHAT", CALL);

    expect(telemetry.getUsage).toHaveBeenCalledTimes(2);
  });

  it("should never call the provider when the gateway rejects for quota", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "text", text: "nunca" });
    const telemetry: TelemetryDouble = buildTelemetry({ requests: 5, inputTokens: 0, outputTokens: 0 });
    const settings: StaticAiSettingsProvider = buildSettings({ STUDENT: { requestsPerDay: 5 } });
    const recorder: InMemoryAiCallRecorder = new InMemoryAiCallRecorder();
    const guard: TelemetryAiQuotaGuard = new TelemetryAiQuotaGuard(telemetry as unknown as AiTelemetryFacade, settings, new AiUsageCache());
    const gateway: AiGateway = new AiGateway(new AiOrchestrator(providerRegistry(provider), settings, recorder), guard);

    const promise: Promise<unknown> = gateway.complete("NOTES_ANALYSIS", { userPrompt: "Analiza" }, { userId: "user-1", userRole: "STUDENT" });

    await expect(promise).rejects.toBeInstanceOf(AiQuotaExceededError);
    expect(provider.calls).toBe(0);
    expect(recorder.records).toHaveLength(0);
    expect(telemetry.record).toHaveBeenCalledWith(
      expect.objectContaining({ status: "QUOTA_EXCEEDED", promptVersion: AI_PROMPT_TEMPLATES.NOTES_ANALYSIS.version, promptHash: expect.any(String) }),
    );
  });
});
