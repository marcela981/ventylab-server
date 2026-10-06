/*
 * Funcionalidad: Calificador automático de intentos de evaluación
 * Descripción: Función pura que califica un intento al entregarlo: preguntas de selección todo-o-nada (conjunto elegido igual al conjunto correcto), sin respuesta 0, OPEN_TEXT pendiente de revisión manual, SIMULATION con el puntaje práctico disponible (puntos × puntaje, 2 decimales) o pendiente; suma puntaje y máximo, decide GRADED o PENDING_REVIEW y calcula la nota 0.0–5.0 con un decimal y la aprobación; resume además los puntajes de un intento ya cerrado tras la calificación docente (puntaje manual sobre el automático, preguntas sin puntaje pendientes, nota solo sin pendientes)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationOptionItem, type EvaluationQuestionItem } from "@/features/evaluation/domain/entities/evaluation-items";
import {
  type EvaluationAttemptStatusValue,
  GRADED_ATTEMPT_STATUS,
  PENDING_REVIEW_ATTEMPT_STATUS,
} from "@/features/evaluation/domain/value-objects/evaluation-attempt-status";
import { isChoiceQuestionType, SIMULATION_QUESTION_TYPE } from "@/features/evaluation/domain/value-objects/evaluation-question-type";

export const MAX_EVALUATION_GRADE: number = 5;

export interface GradableAnswer {
  readonly questionId: string;
  readonly selectedOptionIds: ReadonlyArray<string>;
  readonly textAnswer?: string;
  readonly simulationSessionId?: string;
}

export interface QuestionGrade {
  readonly questionId: string;
  readonly autoScore?: number;
  readonly pendingManual: boolean;
}

export interface ScoredAnswer {
  readonly questionId: string;
  readonly autoScore?: number;
  readonly manualScore?: number;
}

export interface AttemptScoreSummary {
  readonly score: number;
  readonly maxScore: number;
  readonly pendingQuestionIds: ReadonlyArray<string>;
  readonly grade?: number;
}

export interface EvaluationAttemptGrading {
  readonly questions: ReadonlyArray<QuestionGrade>;
  readonly score: number;
  readonly maxScore: number;
  readonly status: EvaluationAttemptStatusValue;
  readonly grade?: number;
  readonly zeroMaxScore: boolean;
}

export function roundTo(value: number, decimals: number): number {
  const factor: number = 10 ** decimals;

  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function computeEvaluationGrade(score: number, maxScore: number): number {
  if (maxScore <= 0) {
    return 0;
  }

  return roundTo((MAX_EVALUATION_GRADE * score) / maxScore, 1);
}

export function hasPassedEvaluation(grade: number, passingGrade: number): boolean {
  return grade >= passingGrade;
}

function sameSet(left: ReadonlyArray<string>, right: ReadonlyArray<string>): boolean {
  const leftSet: Set<string> = new Set<string>(left);
  const rightSet: Set<string> = new Set<string>(right);

  return leftSet.size === rightSet.size && [...leftSet].every((id: string) => rightSet.has(id));
}

function gradeQuestion(question: EvaluationQuestionItem, answer: GradableAnswer | undefined, practicalScore: number | undefined): QuestionGrade {
  if (isChoiceQuestionType(question.type)) {
    const correct: string[] = question.options.filter((option: EvaluationOptionItem) => option.isCorrect).map((option: EvaluationOptionItem) => option.id);
    const isRight: boolean = answer !== undefined && sameSet(answer.selectedOptionIds, correct);

    return { questionId: question.id, autoScore: isRight ? question.points : 0, pendingManual: false };
  }

  if (question.type === SIMULATION_QUESTION_TYPE && answer?.simulationSessionId !== undefined && practicalScore !== undefined) {
    const bounded: number = Math.min(1, Math.max(0, practicalScore));

    return { questionId: question.id, autoScore: roundTo(question.points * bounded, 2), pendingManual: false };
  }

  return { questionId: question.id, pendingManual: true };
}

export function gradeEvaluationAttempt(
  questions: ReadonlyArray<EvaluationQuestionItem>,
  answers: ReadonlyMap<string, GradableAnswer>,
  practicalScores: ReadonlyMap<string, number>,
): EvaluationAttemptGrading {
  const grades: QuestionGrade[] = questions.map((question: EvaluationQuestionItem) =>
    gradeQuestion(question, answers.get(question.id), practicalScores.get(question.id)),
  );

  const score: number = roundTo(
    grades.reduce((total: number, grade: QuestionGrade) => total + (grade.autoScore ?? 0), 0),
    2,
  );

  const maxScore: number = roundTo(
    questions.reduce((total: number, question: EvaluationQuestionItem) => total + question.points, 0),
    2,
  );

  const pending: boolean = grades.some((grade: QuestionGrade) => grade.pendingManual);

  return {
    questions: grades,
    score,
    maxScore,
    status: pending ? PENDING_REVIEW_ATTEMPT_STATUS : GRADED_ATTEMPT_STATUS,
    grade: pending ? undefined : computeEvaluationGrade(score, maxScore),
    zeroMaxScore: maxScore <= 0,
  };
}

export function earnedScore(answer: ScoredAnswer | undefined): number | undefined {
  return answer?.manualScore ?? answer?.autoScore;
}

export function summarizeAttemptScores(
  questions: ReadonlyArray<Pick<EvaluationQuestionItem, "id" | "points">>,
  answers: ReadonlyMap<string, ScoredAnswer>,
): AttemptScoreSummary {
  const pendingQuestionIds: string[] = questions
    .filter((question: Pick<EvaluationQuestionItem, "id" | "points">) => earnedScore(answers.get(question.id)) === undefined)
    .map((question: Pick<EvaluationQuestionItem, "id" | "points">) => question.id);

  const score: number = roundTo(
    questions.reduce((total: number, question: Pick<EvaluationQuestionItem, "id" | "points">) => total + (earnedScore(answers.get(question.id)) ?? 0), 0),
    2,
  );

  const maxScore: number = roundTo(
    questions.reduce((total: number, question: Pick<EvaluationQuestionItem, "id" | "points">) => total + question.points, 0),
    2,
  );

  return { score, maxScore, pendingQuestionIds, grade: pendingQuestionIds.length > 0 ? undefined : computeEvaluationGrade(score, maxScore) };
}
