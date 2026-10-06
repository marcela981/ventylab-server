/*
 * Funcionalidad: Pruebas de TelemetryAiCallRecorder
 * Descripción: Verifica que cada llamada completada o transmitida por el gateway de IA produzca exactamente un registro de telemetría (versión del prompt, tokens, latencia y TTFT en streams), el costo estimado con los precios de la configuración y el incremento local del consumo en caché
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiCallRecord } from "@/features/ai/application/ports/ai-call-recorder.interface";
import { AiGateway } from "@/features/ai/application/services/ai-gateway";
import { AiOrchestrator } from "@/features/ai/application/services/ai-orchestrator";
import {
  AllowAllAiQuotaGuard,
  FakeLlmProvider,
  providerRegistry,
  StaticAiSettingsProvider,
} from "@/features/ai/application/testing/ai-test-doubles-spec";
import { AI_PROMPT_TEMPLATES } from "@/features/ai/domain/prompts/prompt-registry";
import { type AiResult, type AiStreamChunk } from "@/features/ai/domain/results/ai-result";
import { AiUsageCache } from "@/features/ai/infrastructure/quota/ai-usage-cache";
import { TelemetryAiCallRecorder } from "@/features/ai/infrastructure/recorders/telemetry-ai-call-recorder";
import { type AiTelemetryFacade } from "@/features/ai-telemetry/application/ai-telemetry.facade";
import { type AiCallLogEntry } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

class PricedSettingsProvider extends StaticAiSettingsProvider {
  public override getPrice(provider: string, model: string): { inputPer1kUsd: number; outputPer1kUsd: number } | undefined {
    return provider === "fake" && model === "fake-model" ? { inputPer1kUsd: 0.001, outputPer1kUsd: 0.002 } : undefined;
  }
}

interface Harness {
  gateway: AiGateway;
  telemetry: jest.Mocked<Pick<AiTelemetryFacade, "record">>;
  recorder: TelemetryAiCallRecorder;
  usageCache: AiUsageCache;
}

function buildHarness(provider: FakeLlmProvider): Harness {
  const settings: PricedSettingsProvider = new PricedSettingsProvider({
    providerChain: [provider.id],
    models: { [provider.id]: "fake-model" },
    timeoutMs: 1000,
    maxOutputTokens: 256,
    temperature: 0.2,
  });
  const telemetry: jest.Mocked<Pick<AiTelemetryFacade, "record">> = { record: jest.fn().mockResolvedValue(undefined) };
  const usageCache: AiUsageCache = new AiUsageCache();
  const recorder: TelemetryAiCallRecorder = new TelemetryAiCallRecorder(telemetry as unknown as AiTelemetryFacade, settings, usageCache);
  const orchestrator: AiOrchestrator = new AiOrchestrator(providerRegistry(provider), settings, recorder);

  return { gateway: new AiGateway(orchestrator, new AllowAllAiQuotaGuard()), telemetry, recorder, usageCache };
}

function flushRecords(): Promise<void> {
  return new Promise<void>((resolve: () => void) => setImmediate(resolve));
}

function recordedEntries(telemetry: jest.Mocked<Pick<AiTelemetryFacade, "record">>): AiCallLogEntry[] {
  return telemetry.record.mock.calls.map((call: [AiCallLogEntry]) => call[0]);
}

describe("TelemetryAiCallRecorder", () => {
  it("should record exactly one telemetry entry with prompt version, tokens and latency per completed call", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "text", text: "{}", inputTokens: 1000, outputTokens: 500 });
    const { gateway, telemetry } = buildHarness(provider);

    const result: AiResult = await gateway.complete("NOTES_ANALYSIS", { userPrompt: "Analiza" }, { userId: "user-1", userRole: "STUDENT", refType: "notes_analysis" });
    await flushRecords();

    const entries: AiCallLogEntry[] = recordedEntries(telemetry);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      id: result.aiCallId,
      useCase: "NOTES_ANALYSIS",
      userId: "user-1",
      provider: "fake",
      model: "fake-model",
      promptVersion: AI_PROMPT_TEMPLATES.NOTES_ANALYSIS.version,
      inputTokens: 1000,
      outputTokens: 500,
      status: "SUCCESS",
      attempts: 1,
      refType: "notes_analysis",
      costEstimateUsd: 0.002,
    });
    expect(entries[0].latencyMs).toEqual(expect.any(Number));
    expect(entries[0].latencyMs).toBeGreaterThanOrEqual(0);
    expect(entries[0]).not.toHaveProperty("userRole");
  });

  it("should record exactly one telemetry entry with TTFT per streamed call", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "stream", chunks: ["Hola", " mundo"], inputTokens: 10, outputTokens: 4 });
    const { gateway, telemetry } = buildHarness(provider);

    const stream: AsyncIterable<AiStreamChunk> = await gateway.stream("FREE_CHAT", { history: [], question: "hola" }, { userId: "user-1", userRole: "STUDENT" });

    for await (const chunk of stream) {
      expect(chunk.type).toMatch(/delta|done/);
    }

    await flushRecords();

    const entries: AiCallLogEntry[] = recordedEntries(telemetry);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ useCase: "FREE_CHAT", status: "SUCCESS", inputTokens: 10, outputTokens: 4, promptVersion: AI_PROMPT_TEMPLATES.FREE_CHAT.version });
    expect(entries[0].ttftMs).toEqual(expect.any(Number));
  });

  it("should leave the cost unestimated when the configuration has no price for the model", async () => {
    const { recorder, telemetry } = buildHarness(new FakeLlmProvider("fake", { kind: "text", text: "" }));
    const entry: AiCallRecord = {
      id: "call-1",
      useCase: "GRADE_FEEDBACK",
      provider: "other",
      model: "other-model",
      promptVersion: "1.0.0",
      promptHash: "hash",
      inputTokens: 10,
      outputTokens: 10,
      latencyMs: 5,
      status: "SUCCESS",
      attempts: 1,
      createdAt: new Date("2026-10-05T10:00:00Z"),
    };

    const id: string = await recorder.record(entry);

    expect(id).toBe("call-1");
    expect(telemetry.record).toHaveBeenCalledWith(expect.objectContaining({ id: "call-1", costEstimateUsd: undefined }));
  });

  it("should add the recorded call to the cached usage of the user and use case", async () => {
    const { recorder, usageCache } = buildHarness(new FakeLlmProvider("fake", { kind: "text", text: "" }));
    const createdAt: Date = new Date();

    usageCache.set("user-1", "FREE_CHAT", { requests: 2, inputTokens: 100, outputTokens: 50 }, createdAt);

    await recorder.record({
      id: "call-2",
      useCase: "FREE_CHAT",
      userId: "user-1",
      promptVersion: "1.0.0",
      promptHash: "hash",
      inputTokens: 30,
      outputTokens: 20,
      latencyMs: 5,
      status: "SUCCESS",
      attempts: 1,
      createdAt,
    });

    expect(usageCache.get("user-1", "FREE_CHAT", createdAt)).toEqual({ requests: 3, inputTokens: 130, outputTokens: 70 });
  });
});
