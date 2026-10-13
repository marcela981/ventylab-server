/*
 * Funcionalidad: Pruebas de respaldo determinista de AiGateway
 * Descripción: Con los proveedores falsos de escenarios (error 5xx, tiempo límite, stream parcial) verifica que el gateway entregue el respaldo determinista del consumidor en complete y stream, que el resultado sea idéntico entre ejecuciones, que pase al siguiente proveedor de la cadena antes de recurrir al respaldo y que un stream cortado después de entregar contenido termine en AiStreamInterruptedError sin respaldo
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
  type AiProviderScenario,
  SCENARIO_PARTIAL_CHUNKS,
  SCENARIO_SUCCESS_TEXT,
  scenarioLlmProvider,
} from "@/features/ai/application/testing/ai-provider-scenarios-test-doubles-spec";
import {
  AllowAllAiQuotaGuard,
  type FakeLlmProvider,
  InMemoryAiCallRecorder,
  providerRegistry,
  StaticAiSettingsProvider,
} from "@/features/ai/application/testing/ai-test-doubles-spec";
import { AiStreamInterruptedError } from "@/features/ai/domain/ai.errors";
import { type AiResult, type AiStreamChunk } from "@/features/ai/domain/results/ai-result";

const FALLBACK_TEXT: string = "Respuesta determinista de respaldo";

const ATTEMPT_TIMEOUT_MS: number = 50;

interface GatewayHarness {
  readonly gateway: AiGateway;
  readonly recorder: InMemoryAiCallRecorder;
}

function buildGateway(...providers: FakeLlmProvider[]): GatewayHarness {
  const settings: StaticAiSettingsProvider = new StaticAiSettingsProvider(
    {
      providerChain: providers.map((provider: FakeLlmProvider): string => provider.id),
      models: Object.fromEntries(providers.map((provider: FakeLlmProvider): [string, string] => [provider.id, `${provider.id}-model`])),
      timeoutMs: ATTEMPT_TIMEOUT_MS,
      maxOutputTokens: 256,
      temperature: 0.2,
    },
    { failureThreshold: 10, openSeconds: 60 },
    1,
  );
  const recorder: InMemoryAiCallRecorder = new InMemoryAiCallRecorder();
  const orchestrator: AiOrchestrator = new AiOrchestrator(providerRegistry(...providers), settings, recorder);

  return { gateway: new AiGateway(orchestrator, new AllowAllAiQuotaGuard()), recorder };
}

function completeWithFallback(gateway: AiGateway): Promise<AiResult> {
  return gateway.complete("FREE_CHAT", { history: [], question: "¿Qué es la PEEP?" }, { userId: "user-1", userRole: "STUDENT", fallback: () => FALLBACK_TEXT });
}

async function streamWithFallback(gateway: AiGateway): Promise<AiStreamChunk[]> {
  const chunks: AiStreamChunk[] = [];

  for await (const chunk of await gateway.stream("PAGE_DEEPEN", { pageTitle: "PEEP", pageContent: "Contenido" }, { userId: "user-1", fallback: () => FALLBACK_TEXT })) {
    chunks.push(chunk);
  }

  return chunks;
}

describe("AiGateway deterministic fallback with scenario providers", () => {
  it.each<[AiProviderScenario, number, string]>([
    ["server-error", 2, "SERVER"],
    ["timeout", 1, "TIMEOUT"],
    ["partial-stream", 2, "NETWORK"],
  ])("should return the deterministic fallback on complete when the provider scenario is %s", async (scenario: AiProviderScenario, expectedCalls: number, errorCode: string) => {
    const provider: FakeLlmProvider = scenarioLlmProvider("primary", scenario);
    const { gateway, recorder } = buildGateway(provider);

    const result: AiResult = await completeWithFallback(gateway);

    expect(result).toEqual({ content: FALLBACK_TEXT, source: "DETERMINISTIC", aiCallId: expect.any(String) });
    expect(provider.calls).toBe(expectedCalls);
    expect(recorder.last).toMatchObject({ status: "FALLBACK", errorCode, attempts: 1 });
    expect(recorder.last?.provider).toBeUndefined();
  });

  it.each<[AiProviderScenario]>([["server-error"], ["timeout"]])("should stream the deterministic fallback when the provider scenario is %s before the first chunk", async (scenario: AiProviderScenario) => {
    const { gateway, recorder } = buildGateway(scenarioLlmProvider("primary", scenario));

    const chunks: AiStreamChunk[] = await streamWithFallback(gateway);

    expect(chunks).toEqual([
      { type: "delta", text: FALLBACK_TEXT },
      { type: "done", result: { content: FALLBACK_TEXT, source: "DETERMINISTIC", aiCallId: expect.any(String) } },
    ]);
    expect(recorder.last).toMatchObject({ status: "FALLBACK" });
  });

  it("should produce the same fallback result and record on repeated runs", async () => {
    const first: GatewayHarness = buildGateway(scenarioLlmProvider("primary", "server-error"));
    const second: GatewayHarness = buildGateway(scenarioLlmProvider("primary", "server-error"));

    const firstResult: AiResult = await completeWithFallback(first.gateway);
    const secondResult: AiResult = await completeWithFallback(second.gateway);

    const comparable = (record: AiCallRecord | undefined): Partial<AiCallRecord> => ({ status: record?.status, errorCode: record?.errorCode, attempts: record?.attempts, promptHash: record?.promptHash });

    expect({ ...firstResult, aiCallId: undefined }).toEqual({ ...secondResult, aiCallId: undefined });
    expect(comparable(first.recorder.last)).toEqual(comparable(second.recorder.last));
  });

  it("should use the next provider of the chain before falling back", async () => {
    const failing: FakeLlmProvider = scenarioLlmProvider("primary", "server-error");
    const healthy: FakeLlmProvider = scenarioLlmProvider("secondary", "success");
    const { gateway } = buildGateway(failing, healthy);

    const result: AiResult = await completeWithFallback(gateway);

    expect(result).toMatchObject({ content: SCENARIO_SUCCESS_TEXT, source: "LLM", provider: "secondary", model: "secondary-model" });
  });

  it("should interrupt without fallback once partial content was streamed", async () => {
    const { gateway, recorder } = buildGateway(scenarioLlmProvider("primary", "partial-stream"));
    const received: AiStreamChunk[] = [];

    const consume = async (): Promise<void> => {
      for await (const chunk of await gateway.stream("PAGE_DEEPEN", { pageTitle: "PEEP", pageContent: "Contenido" }, { fallback: () => FALLBACK_TEXT })) {
        received.push(chunk);
      }
    };

    await expect(consume()).rejects.toBeInstanceOf(AiStreamInterruptedError);
    expect(received).toEqual(SCENARIO_PARTIAL_CHUNKS.map((text: string): AiStreamChunk => ({ type: "delta", text })));
    expect(recorder.last).toMatchObject({ status: "ERROR", errorCode: "NETWORK" });
  });
});
