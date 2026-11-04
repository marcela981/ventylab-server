/*
 * Funcionalidad: Proveedor externo de terceros
 * Descripción: Implementa ILlmProvider contra el modelo de un tercero (por ejemplo, un modelo entrenado por otro grupo de investigación) configurado solo por variables de entorno: formato openai (endpoint compatible con /chat/completions, stream SSE, reutiliza OpenAIProvider) o simple (POST JSON {model, system, messages, maxTokens, temperature, responseFormat} → {text, model?, usage?}, sin stream: emite la respuesta completa como un solo fragmento); cabecera de autenticación configurable (Authorization lleva "Bearer <clave>", cualquier otra la clave tal cual, sin clave no se envía), modelo por defecto de la configuración y tiempo máximo propio opcional que aborta la petición como TIMEOUT
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
import { EXTERNAL_PROVIDER_ID, PROVIDER_DEFAULT_MODEL } from "@/features/ai/domain/value-objects/ai-provider-id";
import { asNumber, asRecord, postJson, readJson } from "@/features/ai/infrastructure/providers/http-provider-utils";
import { OpenAIProvider } from "@/features/ai/infrastructure/providers/openai.provider";

export type ExternalProviderFormat = "openai" | "simple";

export const EXTERNAL_PROVIDER_FORMAT_VALUES: readonly ExternalProviderFormat[] = ["openai", "simple"] as const;

export const DEFAULT_EXTERNAL_AUTH_HEADER: string = "Authorization";

export interface ExternalProviderOptions {
  readonly baseUrl: string;
  readonly model: string;
  readonly format: ExternalProviderFormat;
  readonly apiKey?: string;
  readonly authHeader?: string;
  // 0 or undefined: no provider-level limit (the orchestrator's per-attempt timeout still applies).
  readonly timeoutMs?: number;
}

interface ScopedSignal {
  readonly signal: AbortSignal;
  dispose(): void;
}

export function buildExternalAuthHeaders(apiKey: string | undefined, authHeader: string = DEFAULT_EXTERNAL_AUTH_HEADER): Record<string, string> {
  if (!apiKey) {
    return {};
  }

  return { [authHeader]: authHeader.toLowerCase() === "authorization" ? `Bearer ${apiKey}` : apiKey };
}

export class ExternalProvider implements ILlmProvider {
  public readonly id: string = EXTERNAL_PROVIDER_ID;
  public readonly defaultModel: string;
  private readonly _headers: Record<string, string>;
  private readonly _openai?: OpenAIProvider;

  public constructor(private readonly _options: ExternalProviderOptions) {
    this.defaultModel = _options.model;
    this._headers = buildExternalAuthHeaders(_options.apiKey, _options.authHeader);

    if (_options.format === "openai") {
      this._openai = new OpenAIProvider("", _options.baseUrl, { id: EXTERNAL_PROVIDER_ID, headers: this._headers });
    }
  }

  public async complete(request: LlmRequest, signal: AbortSignal): Promise<LlmCompletion> {
    const scoped: ScopedSignal = this._scope(signal);

    try {
      const resolved: LlmRequest = this._withModel(request);

      return this._openai ? await this._openai.complete(resolved, scoped.signal) : await this._completeSimple(resolved, scoped.signal);
    } finally {
      scoped.dispose();
    }
  }

  public async *stream(request: LlmRequest, signal: AbortSignal): AsyncIterable<LlmChunk> {
    const scoped: ScopedSignal = this._scope(signal);

    try {
      const resolved: LlmRequest = this._withModel(request);

      if (this._openai) {
        yield* this._openai.stream(resolved, scoped.signal);

        return;
      }

      // The simple format has no streaming: the whole answer becomes one delta followed by the final chunk.
      const completion: LlmCompletion = await this._completeSimple(resolved, scoped.signal);

      if (completion.text.length > 0) {
        yield { type: "delta", text: completion.text };
      }

      yield { type: "final", completion };
    } finally {
      scoped.dispose();
    }
  }

  private async _completeSimple(request: LlmRequest, signal: AbortSignal): Promise<LlmCompletion> {
    const body: Record<string, unknown> = {
      model: request.model,
      system: request.system,
      messages: request.messages.map((message: AiMessage) => ({ role: message.role, content: message.content })),
      maxTokens: request.maxOutputTokens,
      temperature: request.temperature,
      responseFormat: request.responseFormat ?? "text",
    };
    const response: Response = await postJson(this.id, this._options.baseUrl, this._headers, body, signal);
    const payload: Record<string, unknown> | undefined = asRecord(await readJson(this.id, response));

    if (!payload || typeof payload.text !== "string") {
      throw new AiProviderError("INVALID_RESPONSE", "external returned no text");
    }

    const usage: Record<string, unknown> | undefined = asRecord(payload.usage);

    return {
      text: payload.text,
      model: typeof payload.model === "string" && payload.model.length > 0 ? payload.model : request.model,
      inputTokens: asNumber(usage?.inputTokens),
      outputTokens: asNumber(usage?.outputTokens),
    };
  }

  private _withModel(request: LlmRequest): LlmRequest {
    return request.model && request.model !== PROVIDER_DEFAULT_MODEL ? request : { ...request, model: this.defaultModel };
  }

  private _scope(signal: AbortSignal): ScopedSignal {
    const timeoutMs: number = this._options.timeoutMs ?? 0;

    if (timeoutMs <= 0) {
      return { signal, dispose: (): void => undefined };
    }

    const controller: AbortController = new AbortController();
    const timer: NodeJS.Timeout = setTimeout(() => controller.abort(new AiProviderError("TIMEOUT", `external did not answer within ${timeoutMs} ms`)), timeoutMs);

    timer.unref();

    return { signal: AbortSignal.any([signal, controller.signal]), dispose: (): void => clearTimeout(timer) };
  }
}
