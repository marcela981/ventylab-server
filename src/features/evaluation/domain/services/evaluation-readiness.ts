/*
 * Funcionalidad: Validación de preparación de evaluaciones
 * Descripción: Regla pura que decide si una evaluación puede estar en READY: al menos una pregunta, puntos positivos, al menos una opción correcta en preguntas de selección (exactamente una en SINGLE_CHOICE y TRUE_FALSE, que además lleva dos opciones) y rúbrica válida (validateSimulationRubric) en preguntas SIMULATION; devuelve todos los problemas encontrados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type EvaluationQuestionTypeValue,
  isChoiceQuestionType,
  MULTIPLE_CHOICE_QUESTION_TYPE,
  SIMULATION_QUESTION_TYPE,
  TRUE_FALSE_QUESTION_TYPE,
} from "@/features/evaluation/domain/value-objects/evaluation-question-type";
import { type SimulationRubricValidation, validateSimulationRubric } from "@/features/evaluation/domain/value-objects/simulation-rubric";

export type EvaluationReadinessIssueCode =
  | "no_questions"
  | "points_not_positive"
  | "correct_option_required"
  | "single_correct_option_required"
  | "true_false_two_options_required"
  | "invalid_rubric";

export interface EvaluationReadinessIssue {
  readonly code: EvaluationReadinessIssueCode;
  readonly questionId?: string;
  readonly details?: string[];
}

export interface ReadinessQuestion {
  readonly id: string;
  readonly type: EvaluationQuestionTypeValue;
  readonly points: number;
  readonly rubric?: unknown;
  readonly options: ReadonlyArray<{ readonly isCorrect: boolean }>;
}

const TRUE_FALSE_OPTION_COUNT: number = 2;

function choiceIssues(question: ReadinessQuestion): EvaluationReadinessIssue[] {
  const issues: EvaluationReadinessIssue[] = [];
  const correctCount: number = question.options.filter((option: { readonly isCorrect: boolean }) => option.isCorrect).length;

  if (question.type === TRUE_FALSE_QUESTION_TYPE && question.options.length !== TRUE_FALSE_OPTION_COUNT) {
    issues.push({ code: "true_false_two_options_required", questionId: question.id });

    return issues;
  }

  if (correctCount === 0) {
    issues.push({ code: "correct_option_required", questionId: question.id });
  } else if (correctCount > 1 && question.type !== MULTIPLE_CHOICE_QUESTION_TYPE) {
    issues.push({ code: "single_correct_option_required", questionId: question.id });
  }

  return issues;
}

function questionIssues(question: ReadinessQuestion): EvaluationReadinessIssue[] {
  const issues: EvaluationReadinessIssue[] = [];

  if (!(Number.isFinite(question.points) && question.points > 0)) {
    issues.push({ code: "points_not_positive", questionId: question.id });
  }

  if (isChoiceQuestionType(question.type)) {
    issues.push(...choiceIssues(question));
  }

  if (question.type === SIMULATION_QUESTION_TYPE) {
    const validation: SimulationRubricValidation = validateSimulationRubric(question.rubric);

    if (!validation.valid) {
      issues.push({ code: "invalid_rubric", questionId: question.id, details: validation.errors });
    }
  }

  return issues;
}

export function validateEvaluationReadiness(questions: ReadonlyArray<ReadinessQuestion>): EvaluationReadinessIssue[] {
  if (questions.length === 0) {
    return [{ code: "no_questions" }];
  }

  return questions.flatMap((question: ReadinessQuestion) => questionIssues(question));
}
