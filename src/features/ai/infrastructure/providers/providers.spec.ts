/*
 * Funcionalidad: Pruebas de los proveedores LLM
 * Descripción: Verifica con fetch y SDK simulados las peticiones y respuestas de OpenAI, Anthropic, Gemini y el proveedor HTTP personalizado (completar, stream SSE, uso de tokens, errores HTTP clasificados, rechazos, AbortSignal) y el registro de proveedores según la configuración
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

import { type AiProviderRegistry, type LlmChunk, type LlmCompletion, type LlmRequest } from "@/features/ai/application/ports/llm-provider.interface";
import { AiProviderError, CustomHttpMappingNotConfiguredError } from "@/features/ai/domain/ai.errors";
import { buildAiProviderRegistry } from "@/features/ai/infrastructure/providers/ai-providers.factory";
import { AnthropicProvider } from "@/features/ai/infrastructure/providers/anthropic.provider";
import { CustomHttpProvider } from "@/features/ai/infrastructure/providers/custom-http.provider";
import { GeminiProvider } from "@/features/ai/infrastructure/providers/gemini.provider";
import { OpenAIProvider } from "@/features/ai/infrastructure/providers/openai.provider";

const REQUEST: LlmRequest = {
  model: "test-model",
  system: "sistema",
  messages: [{ role: "user", content: "hola" }, { role: "assistant", content: "¿sí?" }, { role: "user", content: "PEEP" }],
  maxOutputTokens: 100,
  temperature: 0.3,
  responseFormat: "json",
};

function jsonResponse(body: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function sseResponse(events: string[]): Response {
  return new Response(events.join(""), { status: 200, headers: { "content-type": "text/event-stream" } });
}

async function collect(iterable: AsyncIterable<LlmChunk>): Promise<LlmChunk[]> {
  const chunks: LlmChunk[] = [];

  for await (const chunk of iterable) {
    chunks.push(chunk);
  }

  return chunks;
}

function lastFetchBody(fetchMock: jest.SpyInstance): Record<string, unknown> {
  const init: RequestInit = fetchMock.mock.calls[fetchMock.mock.calls.length - 1][1] as RequestInit;

  return JSON.parse(typeof init.body === "string" ? init.body : "{}") as Record<string, unknown>;
}

describe("LLM providers", () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("OpenAIProvider", () => {
    it("should call chat completions with the system prompt, JSON format and signal", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ model: "gpt-x", choices: [{ message: { content: "{}" } }], usage: { prompt_tokens: 12, completion_tokens: 3 } }));
      const signal: AbortSignal = new AbortController().signal;

      const result: LlmCompletion = await new OpenAIProvider("test-key", "https://proxy.local/v1/").complete(REQUEST, signal);

      expect(result).toEqual({ text: "{}", model: "gpt-x", inputTokens: 12, outputTokens: 3 });
      expect(fetchMock.mock.calls[0][0]).toBe("https://proxy.local/v1/chat/completions");
      expect((fetchMock.mock.calls[0][1] as RequestInit).signal).toBe(signal);
      expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({ authorization: "Bearer test-key" });
      expect(lastFetchBody(fetchMock)).toMatchObject({
        model: "test-model",
        max_tokens: 100,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: "sistema" }, { role: "user", content: "hola" }, { role: "assistant", content: "¿sí?" }, { role: "user", content: "PEEP" }],
      });
    });

    it("should parse the SSE stream with usage", async () => {
      fetchMock.mockResolvedValue(
        sseResponse([
          "data: {\"model\":\"gpt-x\",\"choices\":[{\"delta\":{\"content\":\"Ho\"}}]}\n\n",
          "data: {\"choices\":[{\"delta\":{\"content\":\"la\"}}]}\r\n\r\n",
          "data: {\"choices\":[],\"usage\":{\"prompt_tokens\":5,\"completion_tokens\":2}}\n\n",
          "data: [DONE]\n\n",
        ]),
      );

      const chunks: LlmChunk[] = await collect(new OpenAIProvider("test-key").stream(REQUEST, new AbortController().signal));

      expect(chunks).toEqual([
        { type: "delta", text: "Ho" },
        { type: "delta", text: "la" },
        { type: "final", completion: { text: "Hola", model: "gpt-x", inputTokens: 5, outputTokens: 2 } },
      ]);
      expect(lastFetchBody(fetchMock)).toMatchObject({ stream: true, stream_options: { include_usage: true } });
    });

    it.each<[number, string]>([[429, "RATE_LIMIT"], [503, "SERVER"], [401, "CLIENT"]])("should classify HTTP %i as %s", async (status: number, kind: string) => {
      fetchMock.mockResolvedValue(jsonResponse({ error: "x" }, status));

      const promise: Promise<LlmCompletion> = new OpenAIProvider("test-key").complete(REQUEST, new AbortController().signal);

      await expect(promise).rejects.toMatchObject({ kind, statusCode: status });
    });

    it("should classify a network failure as NETWORK", async () => {
      fetchMock.mockRejectedValue(new TypeError("fetch failed"));

      await expect(new OpenAIProvider("test-key").complete(REQUEST, new AbortController().signal)).rejects.toMatchObject({ kind: "NETWORK" });
    });
  });

  describe("AnthropicProvider", () => {
    it("should call the messages API with the version header and no temperature", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ model: "claude-x", stop_reason: "end_turn", content: [{ type: "thinking", thinking: "" }, { type: "text", text: "Hola" }], usage: { input_tokens: 9, output_tokens: 4 } }),
      );

      const result: LlmCompletion = await new AnthropicProvider("key").complete(REQUEST, new AbortController().signal);

      expect(result).toEqual({ text: "Hola", model: "claude-x", inputTokens: 9, outputTokens: 4 });
      expect(fetchMock.mock.calls[0][0]).toBe("https://api.anthropic.com/v1/messages");
      expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({ "x-api-key": "key", "anthropic-version": "2023-06-01" });

      const body: Record<string, unknown> = lastFetchBody(fetchMock);

      expect(body).toMatchObject({ model: "test-model", system: "sistema", max_tokens: 100 });
      expect(body.temperature).toBeUndefined();
    });

    it("should treat a refusal as an invalid response", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ stop_reason: "refusal", content: [] }));

      await expect(new AnthropicProvider("key").complete(REQUEST, new AbortController().signal)).rejects.toMatchObject({ kind: "INVALID_RESPONSE" });
    });

    it("should parse the SSE stream with usage and skip non-text deltas", async () => {
      fetchMock.mockResolvedValue(
        sseResponse([
          "event: message_start\ndata: {\"type\":\"message_start\",\"message\":{\"model\":\"claude-x\",\"usage\":{\"input_tokens\":7}}}\n\n",
          "event: content_block_delta\ndata: {\"type\":\"content_block_delta\",\"delta\":{\"type\":\"thinking_delta\",\"thinking\":\"...\"}}\n\n",
          "event: content_block_delta\ndata: {\"type\":\"content_block_delta\",\"delta\":{\"type\":\"text_delta\",\"text\":\"Hola\"}}\n\n",
          "event: message_delta\ndata: {\"type\":\"message_delta\",\"delta\":{\"stop_reason\":\"end_turn\"},\"usage\":{\"output_tokens\":3}}\n\n",
          "event: message_stop\ndata: {\"type\":\"message_stop\"}\n\n",
        ]),
      );

      const chunks: LlmChunk[] = await collect(new AnthropicProvider("key").stream(REQUEST, new AbortController().signal));

      expect(chunks).toEqual([
        { type: "delta", text: "Hola" },
        { type: "final", completion: { text: "Hola", model: "claude-x", inputTokens: 7, outputTokens: 3 } },
      ]);
    });

    it("should fail on an overloaded stream error event as a server error", async () => {
      fetchMock.mockResolvedValue(sseResponse(["event: error\ndata: {\"type\":\"error\",\"error\":{\"type\":\"overloaded_error\"}}\n\n"]));

      await expect(collect(new AnthropicProvider("key").stream(REQUEST, new AbortController().signal))).rejects.toMatchObject({ kind: "SERVER" });
    });
  });

  describe("GeminiProvider", () => {
    it("should pass the signal, system instruction and JSON format to the SDK", async () => {
      const generateContent: jest.Mock = jest.fn().mockResolvedValue({
        response: { text: (): string => "{}", usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 2, totalTokenCount: 6 } },
      });
      const getGenerativeModel: jest.SpyInstance = jest.spyOn(GoogleGenerativeAI.prototype, "getGenerativeModel").mockReturnValue({ generateContent } as never);
      const signal: AbortSignal = new AbortController().signal;

      const result: LlmCompletion = await new GeminiProvider("key").complete(REQUEST, signal);

      expect(result).toEqual({ text: "{}", model: "test-model", inputTokens: 4, outputTokens: 2 });
      expect(getGenerativeModel).toHaveBeenCalledWith({
        model: "test-model",
        systemInstruction: "sistema",
        generationConfig: { temperature: 0.3, maxOutputTokens: 100, responseMimeType: "application/json" },
      });
      expect(generateContent).toHaveBeenCalledWith(
        { contents: [{ role: "user", parts: [{ text: "hola" }] }, { role: "model", parts: [{ text: "¿sí?" }] }, { role: "user", parts: [{ text: "PEEP" }] }] },
        { signal },
      );
    });

    it("should rethrow the abort reason when the signal was aborted", async () => {
      const controller: AbortController = new AbortController();
      const reason: AiProviderError = new AiProviderError("TIMEOUT", "timeout");

      jest.spyOn(GoogleGenerativeAI.prototype, "getGenerativeModel").mockReturnValue({
        generateContent: jest.fn().mockImplementation(() => {
          controller.abort(reason);

          return Promise.reject(new Error("aborted"));
        }),
      } as never);

      await expect(new GeminiProvider("key").complete(REQUEST, controller.signal)).rejects.toBe(reason);
    });
  });

  describe("CustomHttpProvider", () => {
    it("should throw while the mapping is not configured", async () => {
      const provider: CustomHttpProvider = new CustomHttpProvider({ endpoint: "https://custom.local/ai", authHeader: "x-key", authValue: "secret" });

      await expect(provider.complete(REQUEST, new AbortController().signal)).rejects.toBeInstanceOf(CustomHttpMappingNotConfiguredError);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("should use the injected mapping and auth header and stream a single chunk", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ answer: "ok" }));
      const provider: CustomHttpProvider = new CustomHttpProvider({
        endpoint: "https://custom.local/ai",
        authHeader: "x-key",
        authValue: "secret",
        toRequest: (request: LlmRequest): unknown => ({ prompt: request.messages[request.messages.length - 1].content }),
        fromResponse: (json: unknown, request: LlmRequest): LlmCompletion => ({ text: String((json as { answer: string }).answer), model: request.model }),
      });

      const chunks: LlmChunk[] = await collect(provider.stream(REQUEST, new AbortController().signal));

      expect(chunks).toEqual([{ type: "delta", text: "ok" }, { type: "final", completion: { text: "ok", model: "test-model" } }]);
      expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({ "x-key": "secret" });
      expect(lastFetchBody(fetchMock)).toEqual({ prompt: "PEEP" });
    });
  });

  describe("buildAiProviderRegistry", () => {
    it("should register only the providers whose credentials are configured", () => {
      const registry: AiProviderRegistry = buildAiProviderRegistry({
        geminiApiKey: "g",
        anthropicApiKey: "a",
        customEndpoint: "https://custom.local",
        customAuthHeader: "x-key",
        customAuthValue: "v",
        customMappingConfigured: false,
      });

      expect([...registry.keys()]).toEqual(["gemini", "anthropic"]);
    });

    it("should register the custom provider only with endpoint, auth and mapping", () => {
      const registry: AiProviderRegistry = buildAiProviderRegistry({
        openaiApiKey: "o",
        customEndpoint: "https://custom.local",
        customAuthHeader: "x-key",
        customAuthValue: "v",
        customMappingConfigured: true,
      });

      expect([...registry.keys()]).toEqual(["openai", "custom"]);
      expect(buildAiProviderRegistry({ customMappingConfigured: false }).size).toBe(0);
    });
  });
});
