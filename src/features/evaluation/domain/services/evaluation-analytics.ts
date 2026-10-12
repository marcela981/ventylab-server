/*
 * Funcionalidad: Analítica de evaluaciones
 * Descripción: Funciones puras de analítica sobre la escala de notas 0.0–5.0: mediana, histograma en intervalos de 0.5 (el último incluye 5.0) y, por pregunta, el índice de dificultad (proporción media del puntaje obtenido sobre los intentos calificados, sin respuesta cuenta 0) y la tasa de acierto (puntaje completo)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type EvaluationAnswerScoreView,
  type EvaluationQuestionItemView,
  type EvaluationQuestionScoreSource,
} from "@/features/evaluation/domain/repositories/evaluation-analytics.repository";
import { MAX_EVALUATION_GRADE, roundTo } from "@/features/evaluation/domain/services/evaluation-attempt-grader";
import { type EvaluationQuestionTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-question-type";

export const GRADE_HISTOGRAM_BUCKET_WIDTH: number = 0.5;

// Absorbs floating point noise so a grade such as 2.5 lands in [2.5, 3.0) and not in [2.0, 2.5)
const BUCKET_EPSILON: number = 1e-9;

export interface GradeHistogramBucket {
  readonly from: number;
  readonly to: number;
  readonly count: number;
}

export interface EvaluationQuestionStats {
  readonly questionId: string;
  readonly order: number;
  readonly type: EvaluationQuestionTypeValue;
  readonly points: number;
  readonly answeredCount: number;
  readonly correctCount: number;
  readonly correctRate?: number;
  readonly difficultyIndex?: number;
}

export function medianOf(values: ReadonlyArray<number>): number | undefined {
  if (values.length === 0) {
    return undefined;
  }

  const sorted: number[] = [...values].sort((left: number, right: number) => left - right);
  const middle: number = Math.floor(sorted.length / 2);
  const median: number = sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];

  return roundTo(median, 2);
}

export function buildGradeHistogram(grades: ReadonlyArray<number>): GradeHistogramBucket[] {
  const bucketCount: number = Math.round(MAX_EVALUATION_GRADE / GRADE_HISTOGRAM_BUCKET_WIDTH);
  const counts: number[] = new Array<number>(bucketCount).fill(0);

  for (const grade of grades) {
    const bounded: number = Math.min(MAX_EVALUATION_GRADE, Math.max(0, grade));
    const index: number = Math.min(bucketCount - 1, Math.floor(bounded / GRADE_HISTOGRAM_BUCKET_WIDTH + BUCKET_EPSILON));

    counts[index] += 1;
  }

  return counts.map(
    (count: number, index: number): GradeHistogramBucket => ({
      from: roundTo(index * GRADE_HISTOGRAM_BUCKET_WIDTH, 1),
      to: roundTo((index + 1) * GRADE_HISTOGRAM_BUCKET_WIDTH, 1),
      count,
    }),
  );
}

export function computeQuestionStats(source: EvaluationQuestionScoreSource): EvaluationQuestionStats[] {
  const answersByQuestion: Map<string, EvaluationAnswerScoreView[]> = new Map<string, EvaluationAnswerScoreView[]>();

  for (const answer of source.answers) {
    answersByQuestion.set(answer.questionId, [...(answersByQuestion.get(answer.questionId) ?? []), answer]);
  }

  const attempts: number = source.gradedAttemptCount;

  return source.questions.map((question: EvaluationQuestionItemView): EvaluationQuestionStats => {
    const scored: number[] = (answersByQuestion.get(question.id) ?? [])
      .map((answer: EvaluationAnswerScoreView) => answer.earned)
      .filter((earned: number | undefined): earned is number => earned !== undefined);
    const correctCount: number = question.points > 0 ? scored.filter((earned: number) => earned >= question.points - BUCKET_EPSILON).length : 0;
    const fractionSum: number =
      question.points > 0 ? scored.reduce((total: number, earned: number) => total + Math.min(1, Math.max(0, earned / question.points)), 0) : 0;
    const measurable: boolean = attempts > 0 && question.points > 0;

    return {
      questionId: question.id,
      order: question.order,
      type: question.type,
      points: question.points,
      answeredCount: scored.length,
      correctCount,
      correctRate: measurable ? roundTo(correctCount / attempts, 4) : undefined,
      difficultyIndex: measurable ? roundTo(fractionSum / attempts, 4) : undefined,
    };
  });
}
