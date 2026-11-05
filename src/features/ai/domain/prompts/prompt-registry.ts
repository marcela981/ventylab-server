/*
 * Funcionalidad: Registro de plantillas de prompt de IA
 * Descripción: Define una plantilla versionada (semver) por caso de uso de IA con su entrada tipada (LESSON_QA y MODULE_QA comparten la plantilla de preguntas sobre contenido); el contenido externo va siempre delimitado; SIM_ASSIST guía al estudiante (qué va bien, qué revisar y por qué) sin dictar valores y, sin pregunta, analiza el estado actual; v1.3: GRADE_FEEDBACK de evaluaciones y NOTES_ANALYSIS (2.0.0) se arman aquí con entrada estructurada e idioma en lugar de recibir el prompt del consumidor, así promptVersion sigue el texto real; la retroalimentación de casos clínicos sigue enviando su prompt de consumidor (variante 1.0.0 de GRADE_FEEDBACK)
 * Versión: 1.4 (SIM_ASSIST 1.2.0 con tendencias y sugerencias priorizadas; SIM_CASE_INTERPRETATION y SIM_ALARM_HELP)
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LanguageValue } from "@/common/domain/value-objects/language";
import { buildCommonSystemPrompt, withCommonSystemPrompt } from "@/features/ai/domain/prompts/common-system-prompt";
import { delimit } from "@/features/ai/domain/prompts/delimit";
import { buildGradeFeedbackPrompt, GRADE_FEEDBACK_PROMPT_VERSION, type GradeFeedbackPromptInput } from "@/features/ai/domain/prompts/grade-feedback-prompt";
import { buildNotesAnalysisPrompt, NOTES_ANALYSIS_PROMPT_VERSION, type NotesAnalysisPromptInput } from "@/features/ai/domain/prompts/notes-analysis-prompt";
import { type AiMessage, type BuiltPrompt, type PromptTemplate } from "@/features/ai/domain/prompts/prompt-template";
import {
  buildSimAlarmHelpPrompt,
  buildSimCaseInterpretationPrompt,
  SIM_ALARM_HELP_PROMPT_VERSION,
  SIM_CASE_INTERPRETATION_PROMPT_VERSION,
  type SimAlarmHelpPromptInput,
  type SimCaseInterpretationPromptInput,
} from "@/features/ai/domain/prompts/simulator-prompts";
import { type AiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";

export const MAX_TOPIC_CHECK_MESSAGE_LENGTH: number = 2000;

const SIM_ASSIST_STATE_MAX_LENGTH: number = 4000;
const SIM_ASSIST_QUESTION_MAX_LENGTH: number = 1000;
const SIM_ASSIST_DEFAULT_QUESTION: string = "(Sin pregunta: analiza el estado actual de la simulación.)";

// The assistant tutors during practice: it explains the reasoning so the student learns to adjust the ventilator instead of receiving the values to program.
const SIM_ASSIST_INSTRUCTIONS: string = [
  "Eres un tutor que acompaña al estudiante mientras ajusta un ventilador simulado. Tu objetivo es que aprenda a razonar, no resolverle el caso.",
  "1. Señala primero qué está bien (objetivos cumplidos, presiones seguras) y por qué.",
  "2. Explica qué está mal o en riesgo (alarmas, presión meseta o de distensión altas, volumen por kg excesivo, auto-PEEP, oxigenación o ventilación fuera de objetivo) y qué mecanismo fisiológico lo explica.",
  "3. Prioriza como máximo tres sugerencias: qué variable conviene revisar, en qué dirección y por qué, relacionándola con los cambios recientes de parámetros y con las tendencias (estado del paciente, gases, hemodinamia); no dictes el valor exacto a programar.",
  "4. Para cada sugerencia di qué se espera ver en las curvas y en el monitor si funciona (por ejemplo, el flujo espiratorio que llega a cero, una meseta más baja, la SpO2 que sube en minutos).",
  "5. Si el estudiante hace una pregunta, respóndela con ese mismo enfoque guiado.",
  "Sé breve. Usa solo los datos del estado de la simulación y dilo cuando falte información. No des indicaciones para pacientes reales.",
].join("\n");

// Prompt built by the consumer (clinical case evaluation feedback); only the common system prompt is added.
export interface ConsumerPromptInput {
  readonly userPrompt: string;
  readonly language?: LanguageValue;
}

export const CONSUMER_PROMPT_VERSION: string = "1.0.0";

export function isConsumerPromptInput(input: object): input is ConsumerPromptInput {
  return typeof (input as Partial<ConsumerPromptInput>).userPrompt === "string";
}

function consumerPrompt(input: ConsumerPromptInput): BuiltPrompt {
  return { system: buildCommonSystemPrompt(input.language), messages: [{ role: "user", content: input.userPrompt }], responseFormat: "json" };
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
  GRADE_FEEDBACK: GradeFeedbackPromptInput | ConsumerPromptInput;
  NOTES_ANALYSIS: NotesAnalysisPromptInput;
  PAGE_DEEPEN: PageDeepenPromptInput;
  LESSON_QA: ConversationPromptInput;
  MODULE_QA: ConversationPromptInput;
  FREE_CHAT: ConversationPromptInput;
  TOPIC_CHECK: TopicCheckPromptInput;
  SIM_ASSIST: SimAssistPromptInput;
  SIM_CASE_INTERPRETATION: SimCaseInterpretationPromptInput;
  SIM_ALARM_HELP: SimAlarmHelpPromptInput;
}

export type AiPromptTemplates = { [K in AiUseCaseValue]: PromptTemplate<AiPromptInputs[K]> };

function conversationMessages(input: ConversationPromptInput): AiMessage[] {
  return [...input.history, { role: "user", content: input.question }];
}

// LESSON_QA and MODULE_QA share the template; separate use cases let telemetry and ratings tell lesson and module questions apart.
function contentQuestionPrompt(input: ConversationPromptInput): BuiltPrompt {
  return {
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
  };
}

export const AI_PROMPT_TEMPLATES: AiPromptTemplates = {
  GRADE_FEEDBACK: {
    id: "GRADE_FEEDBACK",
    version: GRADE_FEEDBACK_PROMPT_VERSION,
    versionFor: (input: GradeFeedbackPromptInput | ConsumerPromptInput): string => (isConsumerPromptInput(input) ? CONSUMER_PROMPT_VERSION : GRADE_FEEDBACK_PROMPT_VERSION),
    build: (input: GradeFeedbackPromptInput | ConsumerPromptInput): BuiltPrompt => (isConsumerPromptInput(input) ? consumerPrompt(input) : buildGradeFeedbackPrompt(input)),
  },
  NOTES_ANALYSIS: {
    id: "NOTES_ANALYSIS",
    version: NOTES_ANALYSIS_PROMPT_VERSION,
    build: buildNotesAnalysisPrompt,
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
    build: contentQuestionPrompt,
  },
  MODULE_QA: {
    id: "MODULE_QA",
    version: "1.0.0",
    build: contentQuestionPrompt,
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
    // 1.2.0: prioritized suggestions with the expected change on the curves; the state carries trends and the patient status.
    version: "1.2.0",
    build: (input: SimAssistPromptInput): BuiltPrompt => ({
      system: withCommonSystemPrompt(SIM_ASSIST_INSTRUCTIONS, input.language),
      messages: [
        {
          role: "user",
          content: [
            delimit("estado_simulacion", input.simulationState, SIM_ASSIST_STATE_MAX_LENGTH),
            delimit("pregunta", input.question.trim().length > 0 ? input.question : SIM_ASSIST_DEFAULT_QUESTION, SIM_ASSIST_QUESTION_MAX_LENGTH),
          ].join("\n\n"),
        },
      ],
      responseFormat: "text",
    }),
  },
  SIM_CASE_INTERPRETATION: {
    id: "SIM_CASE_INTERPRETATION",
    version: SIM_CASE_INTERPRETATION_PROMPT_VERSION,
    build: buildSimCaseInterpretationPrompt,
  },
  SIM_ALARM_HELP: {
    id: "SIM_ALARM_HELP",
    version: SIM_ALARM_HELP_PROMPT_VERSION,
    build: buildSimAlarmHelpPrompt,
  },
};

export function getPromptTemplate<U extends AiUseCaseValue>(useCase: U): PromptTemplate<AiPromptInputs[U]> {
  return AI_PROMPT_TEMPLATES[useCase];
}
