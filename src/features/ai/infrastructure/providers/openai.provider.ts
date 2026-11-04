/*
 * Funcionalidad: Proveedor OpenAI
 * Descripción: Implementa ILlmProvider sobre la API REST de chat completions de OpenAI con fetch (sin SDK): respuesta completa, stream SSE con uso de tokens, AbortSignal y URL base configurable; v1.1: identificador y cabeceras de autenticación configurables para reutilizarlo con endpoints compatibles con OpenAI (proveedor externo); v1.2: motivo de fin normalizado (finish_reason) e id de la petición
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ILlmProvider, type LlmChunk, type LlmCompletion, type LlmRequest } from "@/features/ai/application/ports/llm-provider.interface";
import { AiProviderError } from "@/features/ai/domain/ai.errors";
import { type AiMessage } from "@/features/ai/domain/prompts/prompt-template";
import { type AiFinishReason } from "@/features/ai/domain/services/ai-finish-reason";
import { normalizeFinishReason } from "@/features/ai/domain/services/ai-finish-reason";
import {
  asNumber,
  asRecord,
  joinUrl,
  parseSseJson,
  postJson,
  readJson,
  readProviderRequestId,
  readSseEvents,
  type SseEvent,
} from "@/features/ai/infrastructure/providers/http-provider-utils";

export const OPENAI_PROVIDER_ID: string = "openai";

export const DEFAULT_OPENAI_BASE_URL: string = "https://api.openai.com/v1";

interface OpenAIUsage {
  inputTokens?: number;
  outputTokens?: number;
}

function readUsage(payload: Record<string, unknown>): OpenAIUsage {
  const usage: Record<string, unknown> | undefined = asRecord(payload.usage);

  return { inputTokens: asNumber(usage?.prompt_tokens), outputTokens: asNumber(usage?.completion_tokens) };
}

function readChoice(payload: Record<string, unknown>): Record<string, unknown> | undefined {
  return Array.isArray(payload.choices) ? asRecord(payload.choices[0]) : undefined;
}

export interface OpenAICompatibleOptions {
  readonly id?: string;
  // Replaces the default "authorization: Bearer <apiKey>" header (an OpenAI-compatible endpoint may use another header or none).
  readonly headers?: Record<string, string>;
}

export class OpenAIProvider implements ILlmProvider {
  public readonly id: string;

  public constructor(
    private readonly _apiKey: string,
    private readonly _baseUrl: string = DEFAULT_OPENAI_BASE_URL,
    private readonly _options: OpenAICompatibleOptions = {},
  ) {
    this.id = _options.id ?? OPENAI_PROVIDER_ID;
  }

  public async complete(request: LlmRequest, signal: AbortSignal): Promise<LlmCompletion> {
    const response: Response = await postJson(this.id, this._url, this._headers, this._body(request, false), signal);
    const payload: Record<string, unknown> | undefined = asRecord(await readJson(this.id, response));
    const choice: Record<string, unknown> | undefined = payload ? readChoice(payload) : undefined;
    const message: Record<string, unknown> | undefined = asRecord(choice?.message);
    const text: unknown = message?.content;

    if (!payload || typeof text !== "string") {
      throw new AiProviderError("INVALID_RESPONSE", `${this.id} returned no message content`);
    }

    return {
      text,
      model: typeof payload.model === "string" ? payload.model : request.model,
      ...readUsage(payload),
      finishReason: normalizeFinishReason(choice?.finish_reason),
      providerRequestId: readProviderRequestId(response, payload),
    };
  }

  public async *stream(request: LlmRequest, signal: AbortSignal): AsyncIterable<LlmChunk> {
    const response: Response = await postJson(this.id, this._url, this._headers, this._body(request, true), signal);
    let text: string = "";
    let model: string = request.model;
    let usage: OpenAIUsage = {};
    let finishReason: AiFinishReason | undefined;
    let providerRequestId: string | undefined = readProviderRequestId(response);

    for await (const event of readSseEvents(response.body) as AsyncIterable<SseEvent>) {
      if (event.data === "[DONE]") {
        break;
      }

      const payload: Record<string, unknown> = parseSseJson(this.id, event.data);
      const choice: Record<string, unknown> | undefined = readChoice(payload);
      const delta: unknown = asRecord(choice?.delta)?.content;

      finishReason = normalizeFinishReason(choice?.finish_reason) ?? finishReason;
      providerRequestId = providerRequestId ?? readProviderRequestId(response, payload);

      if (typeof payload.model === "string") {
        model = payload.model;
      }

      if (asRecord(payload.usage)) {
        usage = readUsage(payload);
      }

      if (typeof delta === "string" && delta.length > 0) {
        text += delta;

        yield { type: "delta", text: delta };
      }
    }

    yield { type: "final", completion: { text, model, ...usage, finishReason, providerRequestId } };
  }

  private get _url(): string {
    return joinUrl(this._baseUrl, "chat/completions");
  }

  private get _headers(): Record<string, string> {
    return this._options.headers ?? { authorization: `Bearer ${this._apiKey}` };
  }

  private _body(request: LlmRequest, stream: boolean): Record<string, unknown> {
    return {
      model: request.model,
      messages: [{ role: "system", content: request.system }, ...request.messages.map((message: AiMessage) => ({ role: message.role, content: message.content }))],
      max_tokens: request.maxOutputTokens,
      temperature: request.temperature,
      ...(request.responseFormat === "json" ? { response_format: { type: "json_object" } } : {}),
      ...(stream ? { stream: true, stream_options: { include_usage: true } } : {}),
    };
  }
}
