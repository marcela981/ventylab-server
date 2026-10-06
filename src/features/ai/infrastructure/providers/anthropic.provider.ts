/*
 * Funcionalidad: Proveedor Anthropic
 * Descripción: Implementa ILlmProvider sobre la API REST Messages de Anthropic con fetch (sin SDK): respuesta completa, stream SSE (message_start, content_block_delta, message_delta, error), uso de tokens, rechazos, AbortSignal y URL base configurable
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ILlmProvider, type LlmChunk, type LlmCompletion, type LlmRequest } from "@/features/ai/application/ports/llm-provider.interface";
import { AiProviderError } from "@/features/ai/domain/ai.errors";
import { type AiMessage } from "@/features/ai/domain/prompts/prompt-template";
import {
  asNumber,
  asRecord,
  joinUrl,
  parseSseJson,
  postJson,
  readJson,
  readSseEvents,
  type SseEvent,
} from "@/features/ai/infrastructure/providers/http-provider-utils";

export const ANTHROPIC_PROVIDER_ID: string = "anthropic";

export const DEFAULT_ANTHROPIC_BASE_URL: string = "https://api.anthropic.com";

const ANTHROPIC_VERSION: string = "2023-06-01";

const REFUSAL_STOP_REASON: string = "refusal";

function readText(content: unknown): string {
  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((block: unknown) => asRecord(block))
    .filter((block: Record<string, unknown> | undefined) => block?.type === "text" && typeof block.text === "string")
    .map((block: Record<string, unknown> | undefined) => String(block?.text))
    .join("");
}

function refusalError(): AiProviderError {
  return new AiProviderError("INVALID_RESPONSE", "anthropic declined the request");
}

export class AnthropicProvider implements ILlmProvider {
  public readonly id: string = ANTHROPIC_PROVIDER_ID;

  public constructor(
    private readonly _apiKey: string,
    private readonly _baseUrl: string = DEFAULT_ANTHROPIC_BASE_URL,
  ) {}

  public async complete(request: LlmRequest, signal: AbortSignal): Promise<LlmCompletion> {
    const response: Response = await postJson(this.id, this._url, this._headers, this._body(request, false), signal);
    const payload: Record<string, unknown> | undefined = asRecord(await readJson(this.id, response));

    if (!payload) {
      throw new AiProviderError("INVALID_RESPONSE", "anthropic returned an empty body");
    }

    if (payload.stop_reason === REFUSAL_STOP_REASON) {
      throw refusalError();
    }

    const usage: Record<string, unknown> | undefined = asRecord(payload.usage);

    return {
      text: readText(payload.content),
      model: typeof payload.model === "string" ? payload.model : request.model,
      inputTokens: asNumber(usage?.input_tokens),
      outputTokens: asNumber(usage?.output_tokens),
    };
  }

  public async *stream(request: LlmRequest, signal: AbortSignal): AsyncIterable<LlmChunk> {
    const response: Response = await postJson(this.id, this._url, this._headers, this._body(request, true), signal);
    let text: string = "";
    let model: string = request.model;
    let inputTokens: number | undefined;
    let outputTokens: number | undefined;

    for await (const event of readSseEvents(response.body) as AsyncIterable<SseEvent>) {
      const payload: Record<string, unknown> = parseSseJson(this.id, event.data);
      const type: unknown = payload.type ?? event.event;

      if (type === "error") {
        throw new AiProviderError(asRecord(payload.error)?.type === "overloaded_error" ? "SERVER" : "INVALID_RESPONSE", "anthropic stream error");
      }

      if (type === "message_start") {
        const message: Record<string, unknown> | undefined = asRecord(payload.message);

        model = typeof message?.model === "string" ? message.model : model;
        inputTokens = asNumber(asRecord(message?.usage)?.input_tokens);
      } else if (type === "content_block_delta") {
        const delta: Record<string, unknown> | undefined = asRecord(payload.delta);

        if (delta?.type === "text_delta" && typeof delta.text === "string" && delta.text.length > 0) {
          text += delta.text;

          yield { type: "delta", text: delta.text };
        }
      } else if (type === "message_delta") {
        if (asRecord(payload.delta)?.stop_reason === REFUSAL_STOP_REASON) {
          throw refusalError();
        }

        outputTokens = asNumber(asRecord(payload.usage)?.output_tokens) ?? outputTokens;
      } else if (type === "message_stop") {
        break;
      }
    }

    yield { type: "final", completion: { text, model, inputTokens, outputTokens } };
  }

  private get _url(): string {
    return joinUrl(this._baseUrl, "v1/messages");
  }

  private get _headers(): Record<string, string> {
    return { "x-api-key": this._apiKey, "anthropic-version": ANTHROPIC_VERSION };
  }

  // Current Claude models reject sampling parameters, so temperature is never sent; effort is not accepted by Haiku models.
  private _body(request: LlmRequest, stream: boolean): Record<string, unknown> {
    return {
      model: request.model,
      system: request.system,
      messages: request.messages.map((message: AiMessage) => ({ role: message.role, content: message.content })),
      max_tokens: request.maxOutputTokens,
      ...(request.model.startsWith("claude-haiku") ? {} : { output_config: { effort: "low" } }),
      ...(stream ? { stream: true } : {}),
    };
  }
}
