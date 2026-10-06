/*
 * Funcionalidad: Pruebas de AiOrchestrator
 * Descripción: Verifica la cadena de proveedores del gateway de IA: reintento ante errores transitorios, paso al siguiente proveedor, tiempo límite por intento, cortocircuito, respaldo determinista, 503 sin respaldo, abortos y medición de TTFT en streams
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiCallRecord } from "@/features/ai/application/ports/ai-call-recorder.interface";
import { type ILlmProvider } from "@/features/ai/application/ports/llm-provider.interface";
import { AiOrchestrator, type AiOrchestrationRequest } from "@/features/ai/application/services/ai-orchestrator";
import {
  FakeLlmProvider,
  httpStatusError,
  InMemoryAiCallRecorder,
  providerRegistry,
  StaticAiSettingsProvider,
} from "@/features/ai/application/testing/ai-test-doubles-spec";
import { AiCallAbortedError, AiProvidersUnavailableError, AiStreamInterruptedError } from "@/features/ai/domain/ai.errors";
import { type AiResult, type AiStreamChunk } from "@/features/ai/domain/results/ai-result";

const TIMEOUT_MS: number = 1000;
const RETRY_DELAY_MS: number = 100;

function buildRequest(overrides: Partial<AiOrchestrationRequest["options"]> = {}): AiOrchestrationRequest {
  return {
    useCase: "PAGE_DEEPEN",
    prompt: { system: "system", messages: [{ role: "user", content: "hola" }], responseFormat: "text" },
    promptVersion: "1.0.0",
    promptHash: "hash",
    options: { userId: "user-1", userRole: "STUDENT", ...overrides },
  };
}

function buildOrchestrator(providers: ILlmProvider[], chain: string[] = providers.map((provider: ILlmProvider) => provider.id)): {
  orchestrator: AiOrchestrator;
  recorder: InMemoryAiCallRecorder;
  settings: StaticAiSettingsProvider;
} {
  const settings: StaticAiSettingsProvider = new StaticAiSettingsProvider(
    {
      providerChain: chain,
      models: Object.fromEntries(chain.map((id: string) => [id, `${id}-model`])),
      timeoutMs: TIMEOUT_MS,
      maxOutputTokens: 512,
      temperature: 0.3,
    },
    { failureThreshold: 2, openSeconds: 30 },
    RETRY_DELAY_MS,
  );
  const recorder: InMemoryAiCallRecorder = new InMemoryAiCallRecorder();
  const orchestrator: AiOrchestrator = new AiOrchestrator(providerRegistry(...providers), settings, recorder);

  return { orchestrator, recorder, settings };
}

async function settle<T>(promise: Promise<T>, ms: number = 10_000): Promise<T> {
  const outcome: Promise<{ ok: true; value: T } | { ok: false; error: unknown }> = promise.then(
    (value: T) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );

  await jest.advanceTimersByTimeAsync(ms);

  const settled: { ok: true; value: T } | { ok: false; error: unknown } = await outcome;

  if (!settled.ok) {
    throw settled.error;
  }

  return settled.value;
}

async function collect(iterable: AsyncIterable<AiStreamChunk>): Promise<AiStreamChunk[]> {
  const chunks: AiStreamChunk[] = [];

  for await (const chunk of iterable) {
    chunks.push(chunk);
  }

  return chunks;
}

describe("AiOrchestrator", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("complete", () => {
    it("should retry a transient failure once and answer with the next provider, counting 2 attempts", async () => {
      const first: FakeLlmProvider = new FakeLlmProvider("first", { kind: "error", error: httpStatusError(500) });
      const second: FakeLlmProvider = new FakeLlmProvider("second", { kind: "text", text: "respuesta", inputTokens: 10, outputTokens: 5 });
      const { orchestrator, recorder } = buildOrchestrator([first, second]);

      const result: AiResult = await settle(orchestrator.complete(buildRequest()));

      expect(result).toMatchObject({ content: "respuesta", source: "LLM", provider: "second", model: "second-model" });
      expect(first.calls).toBe(2);
      expect(second.calls).toBe(1);
      expect(recorder.last).toMatchObject({
        id: result.aiCallId,
        status: "SUCCESS",
        attempts: 2,
        provider: "second",
        model: "second-model",
        inputTokens: 10,
        outputTokens: 5,
        promptVersion: "1.0.0",
        promptHash: "hash",
        useCase: "PAGE_DEEPEN",
      });
    });

    it("should not retry a non-transient failure and move to the next provider", async () => {
      const first: FakeLlmProvider = new FakeLlmProvider("first", { kind: "error", error: httpStatusError(400) });
      const second: FakeLlmProvider = new FakeLlmProvider("second", { kind: "text", text: "ok" });
      const { orchestrator } = buildOrchestrator([first, second]);

      const result: AiResult = await settle(orchestrator.complete(buildRequest()));

      expect(result.provider).toBe("second");
      expect(first.calls).toBe(1);
    });

    it("should run the consumer fallback when every provider fails and record a FALLBACK entry", async () => {
      const first: FakeLlmProvider = new FakeLlmProvider("first", { kind: "error", error: httpStatusError(503) });
      const second: FakeLlmProvider = new FakeLlmProvider("second", { kind: "error", error: httpStatusError(400) });
      const { orchestrator, recorder } = buildOrchestrator([first, second]);

      const result: AiResult = await settle(orchestrator.complete(buildRequest({ fallback: () => "respaldo determinista" })));

      expect(result).toMatchObject({ content: "respaldo determinista", source: "DETERMINISTIC" });
      expect(recorder.last).toMatchObject({ id: result.aiCallId, status: "FALLBACK", attempts: 2, errorCode: "CLIENT" });
    });

    it("should throw AiProvidersUnavailableError when every provider fails without fallback", async () => {
      const first: FakeLlmProvider = new FakeLlmProvider("first", { kind: "error", error: httpStatusError(500) });
      const { orchestrator, recorder } = buildOrchestrator([first]);

      const promise: Promise<AiResult> = settle(orchestrator.complete(buildRequest()));

      await expect(promise).rejects.toBeInstanceOf(AiProvidersUnavailableError);
      expect(recorder.last).toMatchObject({ status: "ERROR", attempts: 1, errorCode: "SERVER" });
    });

    it("should throw AiProvidersUnavailableError when no provider of the chain is registered", async () => {
      const { orchestrator, recorder } = buildOrchestrator([], ["missing"]);

      await expect(settle(orchestrator.complete(buildRequest()))).rejects.toBeInstanceOf(AiProvidersUnavailableError);
      expect(recorder.last).toMatchObject({ status: "ERROR", attempts: 0, errorCode: "NO_PROVIDER_AVAILABLE" });
    });

    it("should abort a hanging provider at the timeout and answer with the next provider within timeout plus margin", async () => {
      const slow: FakeLlmProvider = new FakeLlmProvider("slow", { kind: "hang" });
      const fast: FakeLlmProvider = new FakeLlmProvider("fast", { kind: "text", text: "rápido" });
      const { orchestrator, recorder } = buildOrchestrator([slow, fast]);
      let result: AiResult | undefined;

      const promise: Promise<void> = orchestrator.complete(buildRequest()).then((value: AiResult) => {
        result = value;
      });

      await jest.advanceTimersByTimeAsync(TIMEOUT_MS - 1);

      expect(result).toBeUndefined();

      await jest.advanceTimersByTimeAsync(RETRY_DELAY_MS);
      await promise;

      expect(result?.provider).toBe("fast");
      expect(slow.calls).toBe(1);
      expect(recorder.last).toMatchObject({ status: "SUCCESS", attempts: 2 });
    });

    it("should open the breaker after N consecutive failures and skip the provider for M seconds", async () => {
      const flaky: FakeLlmProvider = new FakeLlmProvider("flaky", { kind: "error", error: httpStatusError(400) });
      const backup: FakeLlmProvider = new FakeLlmProvider("backup", { kind: "text", text: "ok" });
      const { orchestrator, recorder } = buildOrchestrator([flaky, backup]);

      await settle(orchestrator.complete(buildRequest()));
      await settle(orchestrator.complete(buildRequest()));

      const skipped: AiResult = await settle(orchestrator.complete(buildRequest()), 0);

      expect(skipped.provider).toBe("backup");
      expect(flaky.calls).toBe(2);
      expect(recorder.last).toMatchObject({ attempts: 1 });

      jest.setSystemTime(Date.now() + 30_001);

      await settle(orchestrator.complete(buildRequest()));

      expect(flaky.calls).toBe(3);
    });

    it("should reset the breaker counter after a success", async () => {
      const provider: FakeLlmProvider = new FakeLlmProvider("main", [
        { kind: "error", error: httpStatusError(400) },
        { kind: "text", text: "ok" },
        { kind: "error", error: httpStatusError(400) },
        { kind: "text", text: "ok" },
      ]);
      const backup: FakeLlmProvider = new FakeLlmProvider("backup", { kind: "text", text: "backup" });
      const { orchestrator } = buildOrchestrator([provider, backup]);

      await settle(orchestrator.complete(buildRequest()));
      await settle(orchestrator.complete(buildRequest()));
      await settle(orchestrator.complete(buildRequest()));
      const result: AiResult = await settle(orchestrator.complete(buildRequest()));

      expect(result.provider).toBe("main");
      expect(provider.calls).toBe(4);
    });

    it("should stop immediately on caller abort, record ABORTED and never call the next provider", async () => {
      const slow: FakeLlmProvider = new FakeLlmProvider("slow", { kind: "hang" });
      const next: FakeLlmProvider = new FakeLlmProvider("next", { kind: "text", text: "nunca" });
      const { orchestrator, recorder } = buildOrchestrator([slow, next]);
      const controller: AbortController = new AbortController();

      const promise: Promise<AiResult> = orchestrator.complete(buildRequest({ signal: controller.signal, fallback: () => "respaldo" }));
      const assertion: Promise<void> = expect(promise).rejects.toBeInstanceOf(AiCallAbortedError);

      await jest.advanceTimersByTimeAsync(200);
      controller.abort();
      await jest.advanceTimersByTimeAsync(5000);
      await assertion;

      expect(next.calls).toBe(0);
      expect(recorder.last).toMatchObject({ status: "ABORTED", attempts: 1 });
    });

    it("should not fail the call when the recorder rejects", async () => {
      const provider: FakeLlmProvider = new FakeLlmProvider("main", { kind: "text", text: "ok" });
      const { orchestrator, recorder } = buildOrchestrator([provider]);

      jest.spyOn(recorder, "record").mockRejectedValue(new Error("db down"));

      const result: AiResult = await settle(orchestrator.complete(buildRequest()));

      expect(result.content).toBe("ok");
    });
  });

  describe("stream", () => {
    it("should stream deltas, emit a final result and record TTFT", async () => {
      const provider: FakeLlmProvider = new FakeLlmProvider("main", {
        kind: "stream",
        chunks: ["Hola", " mundo"],
        chunkDelayMs: 50,
        inputTokens: 7,
        outputTokens: 2,
      });
      const { orchestrator, recorder } = buildOrchestrator([provider]);

      const chunks: AiStreamChunk[] = await settle(collect(orchestrator.stream(buildRequest())));

      expect(chunks.filter((chunk: AiStreamChunk) => chunk.type === "delta").map((chunk: AiStreamChunk) => (chunk.type === "delta" ? chunk.text : ""))).toEqual(["Hola", " mundo"]);
      expect(chunks[chunks.length - 1]).toMatchObject({ type: "done", result: { content: "Hola mundo", source: "LLM", provider: "main" } });

      const record: AiCallRecord | undefined = recorder.last;

      expect(record).toMatchObject({ status: "SUCCESS", attempts: 1, inputTokens: 7, outputTokens: 2 });
      expect(record?.ttftMs).toBe(50);
      expect(record?.latencyMs).toBe(100);
    });

    it("should fail over before the first chunk", async () => {
      const broken: FakeLlmProvider = new FakeLlmProvider("broken", { kind: "error", error: httpStatusError(400) });
      const working: FakeLlmProvider = new FakeLlmProvider("working", { kind: "stream", chunks: ["ok"] });
      const { orchestrator, recorder } = buildOrchestrator([broken, working]);

      const chunks: AiStreamChunk[] = await settle(collect(orchestrator.stream(buildRequest())));

      expect(chunks[chunks.length - 1]).toMatchObject({ type: "done", result: { provider: "working", content: "ok" } });
      expect(recorder.last).toMatchObject({ attempts: 2, status: "SUCCESS" });
    });

    it("should end with ERROR after the first chunk without calling another provider", async () => {
      const failing: FakeLlmProvider = new FakeLlmProvider("failing", { kind: "stream", chunks: ["parcial"], failAfter: httpStatusError(500) });
      const other: FakeLlmProvider = new FakeLlmProvider("other", { kind: "stream", chunks: ["nunca"] });
      const { orchestrator, recorder } = buildOrchestrator([failing, other]);
      const received: AiStreamChunk[] = [];

      const consume = async (): Promise<void> => {
        for await (const chunk of orchestrator.stream(buildRequest())) {
          received.push(chunk);
        }
      };

      await expect(settle(consume())).rejects.toBeInstanceOf(AiStreamInterruptedError);
      expect(received).toEqual([{ type: "delta", text: "parcial" }]);
      expect(other.calls).toBe(0);
      expect(recorder.last).toMatchObject({ status: "ERROR", errorCode: "SERVER" });
    });

    it("should emit the fallback as a deterministic stream when every provider fails", async () => {
      const broken: FakeLlmProvider = new FakeLlmProvider("broken", { kind: "error", error: httpStatusError(400) });
      const { orchestrator, recorder } = buildOrchestrator([broken]);

      const chunks: AiStreamChunk[] = await settle(collect(orchestrator.stream(buildRequest({ fallback: () => "respaldo" }))));

      expect(chunks).toEqual([
        { type: "delta", text: "respaldo" },
        { type: "done", result: expect.objectContaining({ content: "respaldo", source: "DETERMINISTIC" }) as unknown },
      ]);
      expect(recorder.last).toMatchObject({ status: "FALLBACK" });
    });

    it("should end silently with ABORTED when the caller aborts mid-stream", async () => {
      const provider: FakeLlmProvider = new FakeLlmProvider("main", { kind: "stream", chunks: ["a", "b", "c"], chunkDelayMs: 100 });
      const { orchestrator, recorder } = buildOrchestrator([provider]);
      const controller: AbortController = new AbortController();
      const received: AiStreamChunk[] = [];

      const consume = async (): Promise<void> => {
        for await (const chunk of orchestrator.stream(buildRequest({ signal: controller.signal }))) {
          received.push(chunk);

          if (received.length === 1) {
            controller.abort();
          }
        }
      };

      await settle(consume());

      expect(received).toEqual([{ type: "delta", text: "a" }]);
      expect(recorder.last).toMatchObject({ status: "ABORTED", ttftMs: 100 });
    });
  });
});
