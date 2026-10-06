/*
 * Funcionalidad: Tipos de plantillas de prompt
 * Descripción: Define los mensajes de conversación, el prompt construido (sistema, mensajes y formato de respuesta) y la forma de una plantilla versionada por caso de uso de IA
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";

export type AiMessageRole = "user" | "assistant";

export type AiResponseFormat = "text" | "json";

export interface AiMessage {
  readonly role: AiMessageRole;
  readonly content: string;
}

export interface BuiltPrompt {
  readonly system: string;
  readonly messages: AiMessage[];
  readonly responseFormat: AiResponseFormat;
}

export interface PromptTemplate<TInput> {
  readonly id: AiUseCaseValue;
  readonly version: string;
  build(input: TInput): BuiltPrompt;
}
