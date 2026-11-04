/*
 * Funcionalidad: Parser de retroalimentación de calificación
 * Descripción: Interpreta de forma tolerante la respuesta JSON del modelo de lenguaje a la retroalimentación de una evaluación calificada (texto con o sin JSON rodeado, ID de pregunta desconocidos, textos vacíos o largos) completando con retroalimentación determinística las preguntas faltantes; v1.1: el prompt pasó al registro versionado de prompts de IA (GRADE_FEEDBACK 2.0.0)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { buildDeterministicQuestionFeedback } from "@/features/evaluation/domain/services/deterministic-grade-feedback";
import {
  type GradeFeedbackContent,
  type GradeFeedbackContext,
  type GradeFeedbackQuestionContext,
  type QuestionFeedback,
} from "@/features/evaluation/domain/value-objects/grade-feedback";

export const MAX_FEEDBACK_LENGTH: number = 2000;

interface ParsedQuestionFeedback {
  questionId?: unknown;
  feedback?: unknown;
  content?: unknown;
}

interface ParsedGradeFeedback {
  overall?: unknown;
  perQuestion?: unknown;
}

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function extractJSON(text: string): ParsedGradeFeedback | undefined {
  const match: RegExpMatchArray | null = text.match(/\{[\s\S]*\}/);

  if (!match) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(match[0]);

    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function collectQuestionFeedback(raw: unknown, questionIds: Set<string>): Map<string, string> {
  const feedbackById: Map<string, string> = new Map<string, string>();

  if (!Array.isArray(raw)) {
    return feedbackById;
  }

  for (const item of raw as ParsedQuestionFeedback[]) {
    if (typeof item !== "object" || item === null || typeof item.questionId !== "string" || !questionIds.has(item.questionId)) {
      continue;
    }

    const text: unknown = item.feedback ?? item.content;

    if (typeof text === "string" && text.trim() !== "" && !feedbackById.has(item.questionId)) {
      feedbackById.set(item.questionId, truncate(text.trim(), MAX_FEEDBACK_LENGTH));
    }
  }

  return feedbackById;
}

export function parseGradeFeedbackResponse(text: string, context: GradeFeedbackContext): GradeFeedbackContent | undefined {
  const parsed: ParsedGradeFeedback | undefined = extractJSON(text);

  if (!parsed || typeof parsed.overall !== "string" || parsed.overall.trim() === "") {
    return undefined;
  }

  const questionIds: Set<string> = new Set<string>(context.questions.map((question: GradeFeedbackQuestionContext) => question.questionId));
  const feedbackById: Map<string, string> = collectQuestionFeedback(parsed.perQuestion, questionIds);
  const perQuestion: QuestionFeedback[] = context.questions.map((question: GradeFeedbackQuestionContext) => ({
    questionId: question.questionId,
    content: feedbackById.get(question.questionId) ?? buildDeterministicQuestionFeedback(question),
  }));

  return { overall: truncate(parsed.overall.trim(), MAX_FEEDBACK_LENGTH), perQuestion };
}
