/*
 * Funcionalidad: Proveedor Gemini
 * Descripción: Implementa ILlmProvider con el SDK @google/generative-ai (generateContent y generateContentStream) pasando el AbortSignal del intento, el prompt de sistema como systemInstruction, el formato JSON cuando se pide y el uso de tokens de usageMetadata; motivo de fin normalizado (finishReason del primer candidato)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type Content,
  type EnhancedGenerateContentResponse,
  type GenerateContentResult,
  type GenerateContentStreamResult,
  type GenerativeModel,
  GoogleGenerativeAI,
  type UsageMetadata,
} from "@google/generative-ai";

import { type ILlmProvider, type LlmChunk, type LlmCompletion, type LlmRequest } from "@/features/ai/application/ports/llm-provider.interface";
import { AiProviderError } from "@/features/ai/domain/ai.errors";
import { type AiMessage } from "@/features/ai/domain/prompts/prompt-template";
import { type AiFinishReason, normalizeFinishReason } from "@/features/ai/domain/services/ai-finish-reason";

export const GEMINI_PROVIDER_ID: string = "gemini";

function toContents(messages: readonly AiMessage[]): Content[] {
  return messages.map((message: AiMessage) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] }));
}

function readText(response: EnhancedGenerateContentResponse): string {
  try {
    return response.text();
  } catch {
    throw new AiProviderError("INVALID_RESPONSE", "gemini returned a blocked or empty response");
  }
}

function readFinishReason(response: EnhancedGenerateContentResponse): AiFinishReason | undefined {
  return normalizeFinishReason(response.candidates?.[0]?.finishReason);
}

function rethrow(error: unknown, signal: AbortSignal): never {
  if (signal.aborted) {
    throw signal.reason;
  }

  throw error;
}

export class GeminiProvider implements ILlmProvider {
  public readonly id: string = GEMINI_PROVIDER_ID;
  private readonly _client: GoogleGenerativeAI;

  public constructor(apiKey: string) {
    this._client = new GoogleGenerativeAI(apiKey);
  }

  public async complete(request: LlmRequest, signal: AbortSignal): Promise<LlmCompletion> {
    let result: GenerateContentResult;

    try {
      result = await this._model(request).generateContent({ contents: toContents(request.messages) }, { signal });
    } catch (error: unknown) {
      rethrow(error, signal);
    }

    const usage: UsageMetadata | undefined = result.response.usageMetadata;

    return {
      text: readText(result.response),
      model: request.model,
      inputTokens: usage?.promptTokenCount,
      outputTokens: usage?.candidatesTokenCount,
      finishReason: readFinishReason(result.response),
    };
  }

  public async *stream(request: LlmRequest, signal: AbortSignal): AsyncIterable<LlmChunk> {
    let result: GenerateContentStreamResult;

    try {
      result = await this._model(request).generateContentStream({ contents: toContents(request.messages) }, { signal });
    } catch (error: unknown) {
      rethrow(error, signal);
    }

    let text: string = "";
    let usage: UsageMetadata | undefined;
    let finishReason: AiFinishReason | undefined;

    try {
      for await (const chunk of result.stream) {
        const delta: string = readText(chunk);

        usage = chunk.usageMetadata ?? usage;
        finishReason = readFinishReason(chunk) ?? finishReason;

        if (delta.length > 0) {
          text += delta;

          yield { type: "delta", text: delta };
        }
      }
    } catch (error: unknown) {
      rethrow(error, signal);
    }

    yield { type: "final", completion: { text, model: request.model, inputTokens: usage?.promptTokenCount, outputTokens: usage?.candidatesTokenCount, finishReason } };
  }

  private _model(request: LlmRequest): GenerativeModel {
    return this._client.getGenerativeModel({
      model: request.model,
      systemInstruction: request.system,
      generationConfig: {
        temperature: request.temperature,
        maxOutputTokens: request.maxOutputTokens,
        ...(request.responseFormat === "json" ? { responseMimeType: "application/json" } : {}),
      },
    });
  }
}
