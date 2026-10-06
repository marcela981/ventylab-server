/*
 * Funcionalidad: Registro de plantillas de prompt de IA
 * Descripción: Define una plantilla versionada (semver) por caso de uso de IA con su entrada tipada; GRADE_FEEDBACK y NOTES_ANALYSIS reciben el prompt ya construido por el consumidor y solo le anteponen el prompt de sistema común, el resto delimita el contenido externo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LanguageValue } from "@/common/domain/value-objects/language";
import { buildCommonSystemPrompt, withCommonSystemPrompt } from "@/features/ai/domain/prompts/common-system-prompt";
import { delimit } from "@/features/ai/domain/prompts/delimit";
import { type AiMessage, type BuiltPrompt, type PromptTemplate } from "@/features/ai/domain/prompts/prompt-template";
import { type AiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";

export const MAX_TOPIC_CHECK_MESSAGE_LENGTH: number = 2000;

export interface ConsumerPromptInput {
  readonly userPrompt: string;
  readonly language?: LanguageValue;
}

export interface PageDeepenPromptInput {
  readonly pageTitle: string;
  readonly pageContent: string;
  readonly question?: string;
  readonly language?: LanguageValue;
}

export interface ConversationPromptInput {
  readonly history: readonly AiMessage[];
  readonly question: string;
  readonly contextTitle?: string;
  readonly context?: string;
  readonly language?: LanguageValue;
}

export interface TopicCheckPromptInput {
  readonly message: string;
}

export interface SimAssistPromptInput {
  readonly simulationState: string;
  readonly question: string;
  readonly language?: LanguageValue;
}

export interface AiPromptInputs {
  GRADE_FEEDBACK: ConsumerPromptInput;
  NOTES_ANALYSIS: ConsumerPromptInput;
  PAGE_DEEPEN: PageDeepenPromptInput;
  LESSON_QA: ConversationPromptInput;
  FREE_CHAT: ConversationPromptInput;
  TOPIC_CHECK: TopicCheckPromptInput;
  SIM_ASSIST: SimAssistPromptInput;
}

export type AiPromptTemplates = { [K in AiUseCaseValue]: PromptTemplate<AiPromptInputs[K]> };

function conversationMessages(input: ConversationPromptInput): AiMessage[] {
  return [...input.history, { role: "user", content: input.question }];
}

export const AI_PROMPT_TEMPLATES: AiPromptTemplates = {
  GRADE_FEEDBACK: {
    id: "GRADE_FEEDBACK",
    version: "1.0.0",
    build: (input: ConsumerPromptInput): BuiltPrompt => ({
      system: buildCommonSystemPrompt(input.language),
      messages: [{ role: "user", content: input.userPrompt }],
      responseFormat: "json",
    }),
  },
  NOTES_ANALYSIS: {
    id: "NOTES_ANALYSIS",
    version: "1.0.0",
    build: (input: ConsumerPromptInput): BuiltPrompt => ({
      system: buildCommonSystemPrompt(input.language),
      messages: [{ role: "user", content: input.userPrompt }],
      responseFormat: "json",
    }),
  },
  PAGE_DEEPEN: {
    id: "PAGE_DEEPEN",
    version: "1.0.0",
    build: (input: PageDeepenPromptInput): BuiltPrompt => ({
      system: withCommonSystemPrompt(
        [
          "Profundiza el contenido de la página de la lección indicada: explica los conceptos con más detalle, agrega ejemplos y relaciónalos con la práctica de la ventilación mecánica.",
          "Mantente dentro del tema de la página.",
        ].join("\n"),
        input.language,
      ),
      messages: [
        {
          role: "user",
          content: [
            delimit("titulo_pagina", input.pageTitle, 300),
            delimit("pagina", input.pageContent),
            input.question ? delimit("pregunta", input.question, 1000) : "Profundiza el contenido de la página.",
          ].join("\n\n"),
        },
      ],
      responseFormat: "text",
    }),
  },
  LESSON_QA: {
    id: "LESSON_QA",
    version: "1.0.0",
    build: (input: ConversationPromptInput): BuiltPrompt => ({
      system: withCommonSystemPrompt(
        [
          "Responde preguntas del estudiante sobre la lección o el módulo indicado usando el contenido de referencia.",
          "Si la respuesta no está en el contenido de referencia, dilo y responde con conocimiento general de ventilación mecánica.",
          delimit("titulo_contenido", input.contextTitle ?? "", 300),
          delimit("contenido", input.context ?? ""),
        ].join("\n"),
        input.language,
      ),
      messages: conversationMessages(input),
      responseFormat: "text",
    }),
  },
  FREE_CHAT: {
    id: "FREE_CHAT",
    version: "1.0.0",
    build: (input: ConversationPromptInput): BuiltPrompt => ({
      system: withCommonSystemPrompt(
        "Conversa con el estudiante solo sobre ventilación mecánica, fisiología respiratoria y temas clínicos relacionados; si la pregunta se sale de esos temas, indícalo amablemente.",
        input.language,
      ),
      messages: conversationMessages(input),
      responseFormat: "text",
    }),
  },
  TOPIC_CHECK: {
    id: "TOPIC_CHECK",
    version: "1.0.0",
    build: (input: TopicCheckPromptInput): BuiltPrompt => ({
      system: withCommonSystemPrompt(
        [
          "Clasifica si el mensaje del estudiante trata sobre ventilación mecánica, fisiología respiratoria o temas clínicos relacionados.",
          "Responde SOLO con un objeto JSON, sin markdown, con esta forma exacta: {\"onTopic\": true|false}",
        ].join("\n"),
      ),
      messages: [{ role: "user", content: delimit("mensaje", input.message, MAX_TOPIC_CHECK_MESSAGE_LENGTH) }],
      responseFormat: "json",
    }),
  },
  SIM_ASSIST: {
    id: "SIM_ASSIST",
    version: "1.0.0",
    build: (input: SimAssistPromptInput): BuiltPrompt => ({
      system: withCommonSystemPrompt(
        "Ayuda al estudiante a interpretar el estado del ventilador simulado y a entender el efecto de los parámetros; no des indicaciones para pacientes reales.",
        input.language,
      ),
      messages: [
        {
          role: "user",
          content: [delimit("estado_simulacion", input.simulationState, 3000), delimit("pregunta", input.question, 1000)].join("\n\n"),
        },
      ],
      responseFormat: "text",
    }),
  },
};

export function getPromptTemplate<U extends AiUseCaseValue>(useCase: U): PromptTemplate<AiPromptInputs[U]> {
  return AI_PROMPT_TEMPLATES[useCase];
}
