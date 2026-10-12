/*
 * Funcionalidad: Pruebas de salud y sonda del gateway de IA
 * Descripción: Verifica la salud de solo lectura de los proveedores (configurado, cortocircuito cerrado, abierto y semiabierto, último éxito y último código de error) sin llamar a ningún proveedor, y la sonda manual: 404 para un proveedor desconocido, 422 para uno sin configuración, un único intento con el prompt mínimo registrado en la telemetría y fallos reportados sin lanzar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AiCircuitBreaker } from "@/features/ai/application/services/ai-circuit-breaker";
import { AiGateway } from "@/features/ai/application/services/ai-gateway";
import { AiOrchestrator } from "@/features/ai/application/services/ai-orchestrator";
import {
  AllowAllAiQuotaGuard,
  FakeLlmProvider,
  httpStatusError,
  InMemoryAiCallRecorder,
  providerRegistry,
  StaticAiSettingsProvider,
} from "@/features/ai/application/testing/ai-test-doubles-spec";
import { AiProviderNotRegisteredError, UnknownAiProviderError } from "@/features/ai/domain/ai.errors";
import {
  HEALTH_PROBE_MAX_OUTPUT_TOKENS,
  HEALTH_PROBE_PROMPT_VERSION,
  HEALTH_PROBE_REF_TYPE,
  HEALTH_PROBE_USE_CASE,
} from "@/features/ai/domain/prompts/health-probe-prompt";
import { type AiProbeResult, type AiProviderHealth } from "@/features/ai/domain/results/ai-provider-health";

function buildGateway(...providers: FakeLlmProvider[]): { gateway: AiGateway; recorder: InMemoryAiCallRecorder } {
  const settings: StaticAiSettingsProvider = new StaticAiSettingsProvider(
    {
      providerChain: providers.map((provider: FakeLlmProvider) => provider.id),
      models: Object.fromEntries(providers.map((provider: FakeLlmProvider) => [provider.id, `${provider.id}-model`])),
      timeoutMs: 1000,
      maxOutputTokens: 256,
      temperature: 0.2,
    },
    { failureThreshold: 1, openSeconds: 60 },
    1,
  );
  const recorder: InMemoryAiCallRecorder = new InMemoryAiCallRecorder();

  return { gateway: new AiGateway(new AiOrchestrator(providerRegistry(...providers), settings, recorder), new AllowAllAiQuotaGuard()), recorder };
}

function healthOf(gateway: AiGateway, provider: string): AiProviderHealth | undefined {
  return gateway.getProviderHealth().find((entry: AiProviderHealth) => entry.provider === provider);
}

describe("AiGateway provider health", () => {
  it("lists every known provider with its configuration without calling any provider", () => {
    const gemini: FakeLlmProvider = new FakeLlmProvider("gemini", { kind: "text", text: "OK" });
    const { gateway, recorder } = buildGateway(gemini);

    const health: AiProviderHealth[] = gateway.getProviderHealth();

    expect(health.map((entry: AiProviderHealth) => entry.provider)).toEqual(["gemini", "openai", "anthropic", "custom"]);
    expect(healthOf(gateway, "gemini")).toMatchObject({ configured: true, state: "closed" });
    expect(healthOf(gateway, "openai")).toMatchObject({ configured: false, state: "closed" });
    expect(gemini.calls).toBe(0);
    expect(recorder.records).toHaveLength(0);
  });

  it("reports an open breaker with the last error code after a failed call", async () => {
    const gemini: FakeLlmProvider = new FakeLlmProvider("gemini", { kind: "error", error: httpStatusError(400) });
    const { gateway } = buildGateway(gemini);

    await gateway.complete("TOPIC_CHECK", { message: "PEEP" }, { fallback: () => "{}" });

    expect(healthOf(gateway, "gemini")).toMatchObject({ state: "open", lastErrorCode: "CLIENT" });
    expect(healthOf(gateway, "gemini")?.lastErrorAt).toBeInstanceOf(Date);
  });
});

describe("AiCircuitBreaker snapshot", () => {
  it("moves from open to half-open when the open window elapses and closes on success", () => {
    const breaker: AiCircuitBreaker = new AiCircuitBreaker();

    breaker.recordFailure("gemini", { failureThreshold: 1, openSeconds: 10 }, "TIMEOUT", 1_000);
    const open: string = breaker.inspect("gemini", 5_000).state;
    const halfOpen: string = breaker.inspect("gemini", 20_000).state;
    breaker.recordSuccess("gemini", 21_000);

    expect(open).toBe("open");
    expect(halfOpen).toBe("half_open");
    expect(breaker.inspect("gemini", 22_000)).toEqual({
      state: "closed",
      lastSuccessAt: new Date(21_000),
      lastErrorAt: new Date(1_000),
      lastErrorCode: "TIMEOUT",
    });
  });
});

describe("AiGateway probe", () => {
  it("rejects an unknown provider with UnknownAiProviderError", async () => {
    const { gateway } = buildGateway(new FakeLlmProvider("gemini", { kind: "text", text: "OK" }));

    const probing: Promise<AiProbeResult> = gateway.probe("mistral");

    await expect(probing).rejects.toBeInstanceOf(UnknownAiProviderError);
  });

  it("rejects a known provider without configuration with AiProviderNotRegisteredError", async () => {
    const { gateway, recorder } = buildGateway(new FakeLlmProvider("gemini", { kind: "text", text: "OK" }));

    const probing: Promise<AiProbeResult> = gateway.probe("openai");

    await expect(probing).rejects.toBeInstanceOf(AiProviderNotRegisteredError);
    expect(recorder.records).toHaveLength(0);
  });

  it("makes one tiny call to that provider and records it in telemetry", async () => {
    const openai: FakeLlmProvider = new FakeLlmProvider("openai", { kind: "text", text: "OK", inputTokens: 5, outputTokens: 1 });
    const gemini: FakeLlmProvider = new FakeLlmProvider("gemini", { kind: "text", text: "OK" });
    const { gateway, recorder } = buildGateway(gemini, openai);

    const result: AiProbeResult = await gateway.probe("openai");

    expect(result).toMatchObject({ provider: "openai", model: "openai-model", ok: true });
    expect(gemini.calls).toBe(0);
    expect(openai.calls).toBe(1);
    expect(openai.requests[0]).toMatchObject({ maxOutputTokens: HEALTH_PROBE_MAX_OUTPUT_TOKENS, temperature: 0 });
    expect(recorder.last).toMatchObject({
      id: result.aiCallId,
      useCase: HEALTH_PROBE_USE_CASE,
      provider: "openai",
      status: "SUCCESS",
      promptVersion: HEALTH_PROBE_PROMPT_VERSION,
      refType: HEALTH_PROBE_REF_TYPE,
      refId: "openai",
      attempts: 1,
    });
  });

  it("reports a failed probe without retrying and records the error code", async () => {
    const gemini: FakeLlmProvider = new FakeLlmProvider("gemini", [{ kind: "error", error: httpStatusError(503) }, { kind: "text", text: "OK" }]);
    const { gateway, recorder } = buildGateway(gemini);

    const result: AiProbeResult = await gateway.probe("gemini");

    expect(result).toMatchObject({ provider: "gemini", ok: false, errorCode: "SERVER" });
    expect(gemini.calls).toBe(1);
    expect(recorder.last).toMatchObject({ status: "ERROR", errorCode: "SERVER", refType: HEALTH_PROBE_REF_TYPE });
    expect(healthOf(gateway, "gemini")).toMatchObject({ state: "open", lastErrorCode: "SERVER" });
  });
});
