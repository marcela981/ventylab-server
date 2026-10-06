/*
 * Funcionalidad: Proveedor HTTP personalizado
 * Descripción: Implementa ILlmProvider contra un endpoint HTTP de terceros con fetch, cabecera de autenticación configurable y el mapeo reemplazable de custom-http.mapping; el stream se emite como una sola respuesta completa
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ILlmProvider, type LlmChunk, type LlmCompletion, type LlmRequest } from "@/features/ai/application/ports/llm-provider.interface";
import { AiProviderError } from "@/features/ai/domain/ai.errors";
import { fromCustomResponse, toCustomRequest } from "@/features/ai/infrastructure/providers/custom-http.mapping";
import { postJson, readJson } from "@/features/ai/infrastructure/providers/http-provider-utils";

export const CUSTOM_HTTP_PROVIDER_ID: string = "custom";

export interface CustomHttpProviderOptions {
  readonly endpoint: string;
  readonly authHeader: string;
  readonly authValue: string;
  readonly toRequest?: (request: LlmRequest) => unknown;
  readonly fromResponse?: (json: unknown, request: LlmRequest) => LlmCompletion;
}

export class CustomHttpProvider implements ILlmProvider {
  public readonly id: string = CUSTOM_HTTP_PROVIDER_ID;

  public constructor(private readonly _options: CustomHttpProviderOptions) {}

  public async complete(request: LlmRequest, signal: AbortSignal): Promise<LlmCompletion> {
    const toRequest: (request: LlmRequest) => unknown = this._options.toRequest ?? toCustomRequest;
    const fromResponse: (json: unknown, request: LlmRequest) => LlmCompletion = this._options.fromResponse ?? fromCustomResponse;

    const response: Response = await postJson(
      this.id,
      this._options.endpoint,
      { [this._options.authHeader]: this._options.authValue },
      toRequest(request),
      signal,
    );

    const completion: LlmCompletion = fromResponse(await readJson(this.id, response), request);

    if (typeof completion.text !== "string") {
      throw new AiProviderError("INVALID_RESPONSE", "custom provider mapping returned no text");
    }

    return completion;
  }

  public async *stream(request: LlmRequest, signal: AbortSignal): AsyncIterable<LlmChunk> {
    const completion: LlmCompletion = await this.complete(request, signal);

    yield { type: "delta", text: completion.text };
    yield { type: "final", completion };
  }
}
