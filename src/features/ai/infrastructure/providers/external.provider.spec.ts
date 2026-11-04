/*
 * Funcionalidad: Pruebas del proveedor externo de terceros
 * Descripción: Verifica ExternalProvider contra un servidor HTTP falso local (sin mocks de fetch) en sus dos formatos: openai (chat completions con y sin stream SSE) y simple (POST JSON → {text, usage}, un solo fragmento en stream); cabecera de autenticación, modelo por defecto, y errores clasificados: 429 (RATE_LIMIT), 500 (SERVER), tiempo agotado (TIMEOUT) y respuesta malformada (INVALID_RESPONSE)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { type AddressInfo } from "node:net";

import { type LlmChunk, type LlmCompletion, type LlmRequest } from "@/features/ai/application/ports/llm-provider.interface";
import { buildExternalAuthHeaders, ExternalProvider, type ExternalProviderOptions } from "@/features/ai/infrastructure/providers/external.provider";

interface RecordedRequest {
  readonly url: string;
  readonly headers: IncomingMessage["headers"];
  readonly body: Record<string, unknown>;
}

type Handler = (request: RecordedRequest, res: ServerResponse) => void;

const REQUEST: LlmRequest = {
  model: "default",
  system: "sistema",
  messages: [{ role: "user", content: "¿Qué es la PEEP?" }],
  maxOutputTokens: 64,
  temperature: 0.2,
  responseFormat: "text",
};

async function collect(iterable: AsyncIterable<LlmChunk>): Promise<LlmChunk[]> {
  const chunks: LlmChunk[] = [];

  for await (const chunk of iterable) {
    chunks.push(chunk);
  }

  return chunks;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

describe("ExternalProvider (fake HTTP server)", () => {
  let server: Server;
  let baseUrl: string;
  let handler: Handler;
  const received: RecordedRequest[] = [];

  beforeAll(async () => {
    server = createServer((req: IncomingMessage, res: ServerResponse) => {
      let raw: string = "";

      req.on("data", (chunk: Buffer) => {
        raw += chunk.toString("utf8");
      });
      req.on("end", () => {
        const request: RecordedRequest = { url: req.url ?? "", headers: req.headers, body: raw ? (JSON.parse(raw) as Record<string, unknown>) : {} };

        received.push(request);
        handler(request, res);
      });
    });

    await new Promise<void>((resolve: () => void) => server.listen(0, "127.0.0.1", resolve));

    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve: () => void) => server.close(() => resolve()));
  });

  beforeEach(() => {
    received.length = 0;
  });

  function provider(options: Partial<ExternalProviderOptions> = {}): ExternalProvider {
    return new ExternalProvider({ baseUrl: `${baseUrl}/v1`, model: "classmate-model", format: "openai", apiKey: "secret-key", ...options });
  }

  describe("openai format", () => {
    it("completes against /chat/completions with the bearer key and the configured model", async () => {
      handler = (_request: RecordedRequest, res: ServerResponse): void =>
        sendJson(res, 200, { model: "classmate-model", choices: [{ message: { content: "La PEEP es..." } }], usage: { prompt_tokens: 11, completion_tokens: 4 } });

      const result: LlmCompletion = await provider().complete(REQUEST, new AbortController().signal);

      expect(result).toEqual({ text: "La PEEP es...", model: "classmate-model", inputTokens: 11, outputTokens: 4 });
      expect(received[0].url).toBe("/v1/chat/completions");
      expect(received[0].headers.authorization).toBe("Bearer secret-key");
      expect(received[0].body).toMatchObject({ model: "classmate-model", max_tokens: 64, temperature: 0.2 });
    });

    it("streams SSE deltas and the final usage", async () => {
      handler = (_request: RecordedRequest, res: ServerResponse): void => {
        res.writeHead(200, { "content-type": "text/event-stream" });
        res.write("data: {\"choices\":[{\"delta\":{\"content\":\"Pre\"}}]}\n\n");
        res.write("data: {\"choices\":[{\"delta\":{\"content\":\"sión\"}}]}\n\n");
        res.write("data: {\"choices\":[],\"usage\":{\"prompt_tokens\":3,\"completion_tokens\":2}}\n\n");
        res.end("data: [DONE]\n\n");
      };

      const chunks: LlmChunk[] = await collect(provider().stream(REQUEST, new AbortController().signal));

      expect(chunks).toEqual([
        { type: "delta", text: "Pre" },
        { type: "delta", text: "sión" },
        { type: "final", completion: { text: "Presión", model: "classmate-model", inputTokens: 3, outputTokens: 2 } },
      ]);
      expect(received[0].body).toMatchObject({ stream: true });
    });
  });

  describe("simple format", () => {
    it("posts {model, system, messages, maxTokens, temperature} to the base URL and reads {text, usage}", async () => {
      handler = (_request: RecordedRequest, res: ServerResponse): void => sendJson(res, 200, { text: "Respuesta", usage: { inputTokens: 7, outputTokens: 2 } });

      const result: LlmCompletion = await provider({ format: "simple", baseUrl: `${baseUrl}/generate`, apiKey: undefined }).complete(REQUEST, new AbortController().signal);

      expect(result).toEqual({ text: "Respuesta", model: "classmate-model", inputTokens: 7, outputTokens: 2 });
      expect(received[0].url).toBe("/generate");
      expect(received[0].headers.authorization).toBeUndefined();
      expect(received[0].body).toEqual({
        model: "classmate-model",
        system: "sistema",
        messages: [{ role: "user", content: "¿Qué es la PEEP?" }],
        maxTokens: 64,
        temperature: 0.2,
        responseFormat: "text",
      });
    });

    it("streams the whole answer as one delta and a final chunk", async () => {
      handler = (_request: RecordedRequest, res: ServerResponse): void => sendJson(res, 200, { text: "Todo", model: "v2" });

      const chunks: LlmChunk[] = await collect(provider({ format: "simple", baseUrl }).stream(REQUEST, new AbortController().signal));

      expect(chunks).toEqual([{ type: "delta", text: "Todo" }, { type: "final", completion: { text: "Todo", model: "v2" } }]);
    });

    it("rejects a malformed body as INVALID_RESPONSE", async () => {
      handler = (_request: RecordedRequest, res: ServerResponse): void => sendJson(res, 200, "{not json");

      await expect(provider({ format: "simple", baseUrl }).complete(REQUEST, new AbortController().signal)).rejects.toMatchObject({ kind: "INVALID_RESPONSE" });
    });

    it("rejects a body without text as INVALID_RESPONSE", async () => {
      handler = (_request: RecordedRequest, res: ServerResponse): void => sendJson(res, 200, { answer: "x" });

      await expect(provider({ format: "simple", baseUrl }).complete(REQUEST, new AbortController().signal)).rejects.toMatchObject({ kind: "INVALID_RESPONSE" });
    });
  });

  it.each<["openai" | "simple", number, string]>([
    ["openai", 429, "RATE_LIMIT"],
    ["openai", 500, "SERVER"],
    ["simple", 429, "RATE_LIMIT"],
    ["simple", 500, "SERVER"],
  ])("classifies a %s HTTP %i as %s", async (format: "openai" | "simple", status: number, kind: string) => {
    handler = (_request: RecordedRequest, res: ServerResponse): void => sendJson(res, status, { error: "x" });

    await expect(provider({ format }).complete(REQUEST, new AbortController().signal)).rejects.toMatchObject({ kind, statusCode: status });
  });

  it.each<"openai" | "simple">(["openai", "simple"])("aborts a %s request that exceeds AI_EXTERNAL_TIMEOUT_MS as TIMEOUT", async (format: "openai" | "simple") => {
    handler = (): void => undefined;

    await expect(provider({ format, timeoutMs: 50 }).complete(REQUEST, new AbortController().signal)).rejects.toMatchObject({ kind: "TIMEOUT" });
  });

  it("builds the auth header: Bearer for Authorization, the raw key for another header, nothing without a key", () => {
    expect(buildExternalAuthHeaders("k")).toEqual({ Authorization: "Bearer k" });
    expect(buildExternalAuthHeaders("k", "x-api-key")).toEqual({ "x-api-key": "k" });
    expect(buildExternalAuthHeaders(undefined, "x-api-key")).toEqual({});
  });
});
