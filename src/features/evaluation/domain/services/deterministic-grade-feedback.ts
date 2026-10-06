/*
 * Funcionalidad: Retroalimentación determinística de calificación
 * Descripción: Construye en español, sin modelo de lenguaje, la retroalimentación por pregunta (correcta, parcial o incorrecta, con puntos, respuesta esperada, explicación o criterios de evaluación) y la retroalimentación global (nota frente a la nota mínima de aprobación)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  DETERMINISTIC_FEEDBACK_SOURCE,
  type GeneratedGradeFeedback,
  type GradeFeedbackContext,
  type GradeFeedbackQuestionContext,
  type QuestionFeedback,
} from "@/features/evaluation/domain/value-objects/grade-feedback";

export const MAX_GRADE: number = 5;

type QuestionOutcome = "correct" | "partial" | "incorrect";

const EVALUATION_TYPE_LABELS: Record<string, string> = {
  EXAM: "el examen",
  QUIZ: "el quiz",
  WORKSHOP: "el taller",
};

const OUTCOME_LABELS: Record<QuestionOutcome, string> = {
  correct: "Respuesta correcta",
  partial: "Respuesta parcialmente correcta",
  incorrect: "Respuesta incorrecta",
};

function formatPoints(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function formatGrade(value: number): string {
  return value.toFixed(1);
}

function withFinalPeriod(text: string): string {
  const trimmed: string = text.trim();

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function classifyQuestionOutcome(question: GradeFeedbackQuestionContext): QuestionOutcome {
  if (question.points > 0 && question.earnedPoints >= question.points) {
    return "correct";
  }

  if (question.earnedPoints > 0) {
    return "partial";
  }

  return "incorrect";
}

export function buildDeterministicQuestionFeedback(question: GradeFeedbackQuestionContext): string {
  const outcome: QuestionOutcome = classifyQuestionOutcome(question);
  const parts: string[] = [`${OUTCOME_LABELS[outcome]} (${formatPoints(question.earnedPoints)}/${formatPoints(question.points)} puntos).`];

  if (outcome !== "correct") {
    if (question.correctAnswerText) {
      parts.push(`La respuesta esperada es: ${withFinalPeriod(question.correctAnswerText)}`);
    } else if (question.rubricSummary) {
      parts.push(`Revisa los criterios de evaluación: ${withFinalPeriod(question.rubricSummary)}`);
    }

    if (question.explanation) {
      parts.push(`Explicación: ${withFinalPeriod(question.explanation)}`);
    }
  }

  return parts.join(" ");
}

export function buildDeterministicOverallFeedback(context: GradeFeedbackContext): string {
  const evaluationLabel: string = EVALUATION_TYPE_LABELS[context.evaluation.type] ?? "la evaluación";
  const correctCount: number = context.questions.filter(
    (question: GradeFeedbackQuestionContext) => classifyQuestionOutcome(question) === "correct",
  ).length;
  const passed: boolean = context.grade >= context.passingGrade;
  const parts: string[] = [
    `Obtuviste una nota de ${formatGrade(context.grade)} sobre ${formatGrade(MAX_GRADE)} en ${evaluationLabel} "${context.evaluation.title}".`,
    passed
      ? `Aprobaste: la nota mínima es ${formatGrade(context.passingGrade)}.`
      : `Aún no alcanzas la nota mínima de ${formatGrade(context.passingGrade)}.`,
    `Respondiste correctamente ${correctCount} de ${context.questions.length} preguntas.`,
  ];

  if (!passed) {
    parts.push("Repasa la retroalimentación de cada pregunta para reforzar los conceptos antes de tu próximo intento.");
  }

  return parts.join(" ");
}

export function buildDeterministicGradeFeedback(context: GradeFeedbackContext): GeneratedGradeFeedback {
  const perQuestion: QuestionFeedback[] = context.questions.map((question: GradeFeedbackQuestionContext) => ({
    questionId: question.questionId,
    content: buildDeterministicQuestionFeedback(question),
  }));

  return {
    perQuestion,
    overall: buildDeterministicOverallFeedback(context),
    source: DETERMINISTIC_FEEDBACK_SOURCE,
  };
}
