/*
 * Funcionalidad: Puerto ILlmProvider
 * Descripción: Contrato de estrategia de proveedor de modelos de lenguaje (completar y transmitir en stream con AbortSignal), sus tipos de petición, respuesta y fragmento, y el token del registro de proveedores configurados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiMessage, type AiResponseFormat } from "@/features/ai/domain/prompts/prompt-template";

export const AI_PROVIDERS_TOKEN: unique symbol = Symbol("AI_PROVIDERS_TOKEN");

export interface LlmRequest {
  readonly model: string;
  readonly system: string;
  readonly messages: readonly AiMessage[];
  readonly maxOutputTokens: number;
  readonly temperature: number;
  readonly responseFormat?: AiResponseFormat;
}

export interface LlmCompletion {
  readonly text: string;
  readonly model: string;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
}

export interface LlmDeltaChunk {
  readonly type: "delta";
  readonly text: string;
}

export interface LlmFinalChunk {
  readonly type: "final";
  readonly completion: LlmCompletion;
}

export type LlmChunk = LlmDeltaChunk | LlmFinalChunk;

export interface ILlmProvider {
  readonly id: string;
  complete(request: LlmRequest, signal: AbortSignal): Promise<LlmCompletion>;
  stream(request: LlmRequest, signal: AbortSignal): AsyncIterable<LlmChunk>;
}

export type AiProviderRegistry = ReadonlyMap<string, ILlmProvider>;
