/*
 * Funcionalidad: Resultados de quizzes sobre el modelo de evaluaciones
 * Descripción: Alcance, selección y conversión compartidos por las lecturas de estadísticas (logros, estadísticas de usuario, panel de administración) que antes contaban quiz_attempts: intentos de evaluaciones QUIZ heredadas de quizzes o nuevas, que sean intentos heredados de quiz o intentos GRADED con nota publicada; el porcentaje y el aprobado se calculan con QuizzesMapper igual que las rutas heredadas de quizzes
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma } from "@prisma/client";

import { type QuizAttemptSummary } from "@/features/quizzes/domain/read-models/quiz.read-model";
import {
  QUIZ_ATTEMPT_LEGACY_SOURCE,
  QUIZ_LEGACY_SOURCE,
  type QuizAttemptRow,
  QuizzesMapper,
} from "@/features/quizzes/infrastructure/persistence/prisma/mappers/quizzes.mapper";

// QUIZ evaluations migrated from quizzes or created new; activities of type QUIZ were never quiz attempts.
// OR with an explicit null because NOT (legacy_source = 'activity') would also drop the NULL rows in SQL
export const QUIZ_RESULT_ATTEMPT_SCOPE: Prisma.StudentEvaluationAttemptWhereInput = {
  evaluation: { type: "QUIZ", OR: [{ legacySource: QUIZ_LEGACY_SOURCE }, { legacySource: null }] },
  OR: [
    { legacySource: QUIZ_ATTEMPT_LEGACY_SOURCE },
    { status: "GRADED", gradePublishedAt: { not: null } },
  ],
};

export const QUIZ_RESULT_ATTEMPT_SELECT: {
  id: true;
  evaluationId: true;
  score: true;
  maxScore: true;
  submittedAt: true;
  legacySource: true;
  legacyPayload: true;
  evaluation: { select: { legacyPassingScore: true } };
} = {
  id: true,
  evaluationId: true,
  score: true,
  maxScore: true,
  submittedAt: true,
  legacySource: true,
  legacyPayload: true,
  evaluation: { select: { legacyPassingScore: true } },
};

export const PERFECT_QUIZ_PERCENT: number = 100;

export interface QuizResult {
  readonly percent: number;
  readonly passed: boolean;
}

export function toQuizResult(row: QuizAttemptRow): QuizResult {
  const summary: QuizAttemptSummary = QuizzesMapper.toAttemptSummary(row);

  return { percent: summary.score, passed: summary.passed };
}
