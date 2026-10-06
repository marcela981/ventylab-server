/*
 * Funcionalidad: Constructor del contexto de retroalimentación de calificación
 * Descripción: Arma el GradeFeedbackContext de un intento calificado sin datos personales ni identificadores del estudiante: tipo y título de la evaluación, nota y nota mínima, y por pregunta (en orden) el enunciado en texto plano, puntos, puntos obtenidos (manual sobre automático), texto de la respuesta del estudiante, respuesta correcta de las preguntas de opción, resumen de la rúbrica y explicación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationOptionItem, type EvaluationQuestionItem } from "@/features/evaluation/domain/entities/evaluation-items";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type EvaluationAnswerRecord, type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import {
  isChoiceQuestionType,
  OPEN_TEXT_QUESTION_TYPE,
  SIMULATION_QUESTION_TYPE,
} from "@/features/evaluation/domain/value-objects/evaluation-question-type";
import { type GradeFeedbackContext, type GradeFeedbackQuestionContext } from "@/features/evaluation/domain/value-objects/grade-feedback";
import {
  type SimulationRubricCriterion,
  type SimulationRubricValidation,
  validateSimulationRubric,
} from "@/features/evaluation/domain/value-objects/simulation-rubric";
import { sanitizeTiptapDocument, tiptapToPlainText } from "@/features/notes/domain/services/tiptap-document";

export const NO_ANSWER_TEXT: string = "Sin respuesta";
export const SIMULATION_ANSWER_TEXT: string = "Entregó una sesión del simulador";

const OPTION_SEPARATOR: string = "; ";

function promptText(prompt: Record<string, unknown>): string {
  try {
    return tiptapToPlainText(sanitizeTiptapDocument(prompt));
  } catch {
    return "";
  }
}

function sortedOptions(question: EvaluationQuestionItem): EvaluationOptionItem[] {
  return [...question.options].sort((left: EvaluationOptionItem, right: EvaluationOptionItem) => left.order - right.order);
}

function joinOptions(options: ReadonlyArray<EvaluationOptionItem>): string | undefined {
  return options.length > 0 ? options.map((option: EvaluationOptionItem) => option.content).join(OPTION_SEPARATOR) : undefined;
}

function studentAnswerText(question: EvaluationQuestionItem, answer: EvaluationAnswerRecord | undefined): string {
  if (!answer) {
    return NO_ANSWER_TEXT;
  }

  if (isChoiceQuestionType(question.type)) {
    return joinOptions(sortedOptions(question).filter((option: EvaluationOptionItem) => answer.selectedOptionIds.includes(option.id))) ?? NO_ANSWER_TEXT;
  }

  if (question.type === OPEN_TEXT_QUESTION_TYPE) {
    const text: string = answer.textAnswer?.trim() ?? "";

    return text.length > 0 ? text : NO_ANSWER_TEXT;
  }

  if (question.type === SIMULATION_QUESTION_TYPE && answer.simulationSessionId !== undefined) {
    return SIMULATION_ANSWER_TEXT;
  }

  return NO_ANSWER_TEXT;
}

function describeCriterion(criterion: SimulationRubricCriterion): string {
  const details: string[] = [];

  if (criterion.min !== undefined && criterion.max !== undefined) {
    details.push(`rango ${criterion.min}–${criterion.max}`);
  }

  if (criterion.priority !== undefined) {
    details.push(criterion.priority);
  }

  return details.length > 0 ? `${criterion.parameter}: ${criterion.expectedValue} (${details.join(", ")})` : `${criterion.parameter}: ${criterion.expectedValue}`;
}

function rubricSummary(question: EvaluationQuestionItem): string | undefined {
  const rubric: unknown = question.rubric;

  if (question.type === SIMULATION_QUESTION_TYPE) {
    const validation: SimulationRubricValidation = validateSimulationRubric(rubric);

    if (validation.valid && validation.rubric) {
      const criteria: string = validation.rubric.criteria.map(describeCriterion).join(OPTION_SEPARATOR);

      return validation.rubric.justification ? `${criteria}. ${validation.rubric.justification}` : criteria;
    }
  }

  if (typeof rubric === "string") {
    return rubric.trim() || undefined;
  }

  if (typeof rubric === "object" && rubric !== null && "criteria" in rubric && typeof rubric.criteria === "string") {
    return rubric.criteria.trim() || undefined;
  }

  return undefined;
}

function questionContext(question: EvaluationQuestionItem, answer: EvaluationAnswerRecord | undefined): GradeFeedbackQuestionContext {
  return {
    questionId: question.id,
    type: question.type,
    promptText: promptText(question.prompt),
    points: question.points,
    earnedPoints: answer?.manualScore ?? answer?.autoScore ?? 0,
    studentAnswerText: studentAnswerText(question, answer),
    correctAnswerText: isChoiceQuestionType(question.type) ? joinOptions(sortedOptions(question).filter((option: EvaluationOptionItem) => option.isCorrect)) : undefined,
    rubricSummary: rubricSummary(question),
    explanation: question.explanation,
  };
}

export function buildGradeFeedbackContext({
  evaluation,
  attempt,
  passingGrade,
}: {
  evaluation: Evaluation;
  attempt: StudentEvaluationAttempt;
  passingGrade: number;
}): GradeFeedbackContext {
  const questions: EvaluationQuestionItem[] = [...evaluation.questions].sort(
    (left: EvaluationQuestionItem, right: EvaluationQuestionItem) => left.order - right.order,
  );

  return {
    evaluation: { type: evaluation.type, title: evaluation.title },
    grade: attempt.grade ?? 0,
    passingGrade,
    questions: questions.map((question: EvaluationQuestionItem) => questionContext(question, attempt.answerFor(question.id))),
  };
}
