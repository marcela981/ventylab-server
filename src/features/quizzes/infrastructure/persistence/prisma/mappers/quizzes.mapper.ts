/*
 * Funcionalidad: Mapper de persistencia de quizzes
 * Descripción: Convierte evaluaciones QUIZ (evaluations, evaluation_questions, evaluation_question_options) y sus intentos (student_evaluation_attempts) a los modelos de lectura heredados de quizzes, reconstruyendo la forma JSON original de preguntas y opciones a partir de legacy_ref; y el agregado QuizAttempt a un intento calificado con sus respuestas (evaluation_answers). Las tablas quizzes y quiz_attempts quedan congeladas
 * Versión: 2.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma } from "@prisma/client";

import { type TiptapDocument, tiptapToPlainText } from "@/features/notes/domain/services/tiptap-document";
import { type QuizAttempt } from "@/features/quizzes/domain/entities/quiz-attempt.entity";
import {
  type QuizAnswer,
  type QuizAttemptSummary,
  type QuizDetail,
  type QuizOption,
  type QuizQuestion,
  type QuizSummary,
} from "@/features/quizzes/domain/read-models/quiz.read-model";

export const QUIZ_LEGACY_SOURCE: string = "quiz";
export const QUIZ_ATTEMPT_LEGACY_SOURCE: string = "quiz_attempt";

// Global passing grade 3.0 on the 0-5 scale expressed as the legacy 0-100 percentage
export const QUIZ_DEFAULT_PASSING_SCORE: number = 60;

export const QUIZ_ATTEMPT_MAX_SCORE: number = 100;

const QUESTION_TYPE_TO_LEGACY: Readonly<Record<string, string>> = {
  TRUE_FALSE: "true_false",
  SINGLE_CHOICE: "multiple_choice",
  MULTIPLE_CHOICE: "multiple_choice",
};

export interface QuizOptionRow {
  id: string;
  order: number;
  content: string;
  isCorrect: boolean;
  legacyFeedback: string | null;
  legacyRef: string | null;
}

export interface QuizQuestionRow {
  id: string;
  order: number;
  type: string;
  prompt: Prisma.JsonValue;
  points: number;
  explanation: string | null;
  legacyType: string | null;
  legacyRef: string | null;
  options: QuizOptionRow[];
}

export interface QuizEvaluationRow {
  id: string;
  title: string;
  description: string | null;
  moduleId: string | null;
  lessonId: string | null;
  durationMinutes: number | null;
  status: string;
  order: number;
  legacySource: string | null;
  legacyPassingScore: number | null;
  legacyModuleRef: string | null;
  createdAt: Date;
  updatedAt: Date;
  questions: QuizQuestionRow[];
}

export interface QuizAttemptRow {
  id: string;
  evaluationId: string;
  score: number | null;
  maxScore: number | null;
  submittedAt: Date | null;
  legacySource: string | null;
  legacyPayload: Prisma.JsonValue;
  evaluation: { legacyPassingScore: number | null };
}

export interface QuizAttemptPersistence {
  attempt: Prisma.StudentEvaluationAttemptUncheckedCreateInput;
  answers: Prisma.EvaluationAnswerCreateManyInput[];
}

function isJsonObject(value: Prisma.JsonValue | undefined): value is Prisma.JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTiptapDocument(value: unknown): value is TiptapDocument {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    && (value as { type?: unknown }).type === "doc" && Array.isArray((value as { content?: unknown }).content);
}

function richTextToPlainText(value: Prisma.JsonValue): string {
  if (typeof value === "string") {
    return value;
  }

  return isTiptapDocument(value) ? tiptapToPlainText(value) : "";
}

function descriptionToPlainText(description: string | null, legacySource: string | null): string | undefined {
  if (description === null || legacySource !== null || !description.trimStart().startsWith("{")) {
    return description ?? undefined;
  }

  try {
    const parsed: unknown = JSON.parse(description);

    return isTiptapDocument(parsed) ? tiptapToPlainText(parsed) : description;
  } catch {
    return description;
  }
}

function byOrder(left: { order: number }, right: { order: number }): number {
  return left.order - right.order;
}

export function quizPercentScore(row: Pick<QuizAttemptRow, "score" | "maxScore" | "legacySource">): number {
  const score: number = row.score ?? 0;

  if (row.legacySource === QUIZ_ATTEMPT_LEGACY_SOURCE) {
    return score;
  }

  return row.maxScore !== null && row.maxScore > 0 ? Math.round((score / row.maxScore) * 100) : 0;
}

// Same result as ROUND((5 * score / 100)::numeric, 1) in the migration for integer percentages
export function quizGradeFromPercent(percent: number): number {
  return Math.round(percent / 2) / 10;
}

export class QuizzesMapper {
  public static toSummary(row: QuizEvaluationRow): QuizSummary {
    return {
      id: row.id,
      title: row.title,
      description: descriptionToPlainText(row.description, row.legacySource),
      moduleId: row.moduleId ?? row.legacyModuleRef ?? undefined,
      passingScore: row.legacyPassingScore ?? QUIZ_DEFAULT_PASSING_SCORE,
      timeLimit: row.durationMinutes ?? undefined,
      order: row.order,
      createdAt: row.createdAt,
    };
  }

  public static toDetail(row: QuizEvaluationRow): QuizDetail {
    return {
      ...QuizzesMapper.toSummary(row),
      lessonId: row.lessonId ?? undefined,
      questions: [...row.questions].sort(byOrder).map((question: QuizQuestionRow) => QuizzesMapper.toQuestion(question)),
      isActive: row.status === "READY",
      updatedAt: row.updatedAt,
    };
  }

  public static toQuestion(row: QuizQuestionRow): QuizQuestion {
    const question: QuizQuestion = {
      id: row.legacyRef ?? row.id,
      type: row.legacyType ?? QUESTION_TYPE_TO_LEGACY[row.type] ?? row.type.toLowerCase(),
      text: richTextToPlainText(row.prompt),
      options: [...row.options].sort(byOrder).map((option: QuizOptionRow) => QuizzesMapper.toOption(option)),
    };

    return row.explanation === null ? question : { ...question, explanation: row.explanation };
  }

  public static toOption(row: QuizOptionRow): QuizOption {
    const option: QuizOption = { id: row.legacyRef ?? row.id, text: row.content, isCorrect: row.isCorrect };

    return row.legacyFeedback === null ? option : { ...option, feedback: row.legacyFeedback };
  }

  public static toAttemptSummary(row: QuizAttemptRow): QuizAttemptSummary {
    const percent: number = quizPercentScore(row);
    const payload: Prisma.JsonValue | undefined = row.legacyPayload ?? undefined;
    const legacyPassed: Prisma.JsonValue | undefined = isJsonObject(payload) ? payload.passed : undefined;
    const passingScore: number = row.evaluation.legacyPassingScore ?? QUIZ_DEFAULT_PASSING_SCORE;

    return {
      id: row.id,
      quizId: row.evaluationId,
      score: percent,
      passed: typeof legacyPassed === "boolean" ? legacyPassed : percent >= passingScore,
      completedAt: row.submittedAt ?? undefined,
    };
  }

  public static toAttemptPersistence(attempt: QuizAttempt, attemptNumber: number, questions: QuizQuestionRow[]): QuizAttemptPersistence {
    const submittedAt: Date = attempt.completedAt ?? attempt.startedAt;
    const legacyAnswers: Prisma.InputJsonObject[] = attempt.answers.map((answer: QuizAnswer) => ({
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId,
    }));

    return {
      attempt: {
        id: attempt.id,
        evaluationId: attempt.quizId,
        assignmentId: null,
        userId: attempt.userId,
        attemptNumber,
        status: "GRADED",
        startedAt: attempt.startedAt,
        submittedAt,
        deadlineAt: null,
        score: attempt.score,
        maxScore: QUIZ_ATTEMPT_MAX_SCORE,
        grade: quizGradeFromPercent(attempt.score),
        gradePublishedAt: submittedAt,
        isLate: false,
        legacySource: QUIZ_ATTEMPT_LEGACY_SOURCE,
        legacyPayload: { answers: legacyAnswers, passed: attempt.passed, score: attempt.score },
      },
      answers: QuizzesMapper.toAnswerRows(attempt.id, attempt.answers, questions, submittedAt),
    };
  }

  // Mirrors the migration: the first answer per question wins, an unknown option becomes an empty selection scored 0
  public static toAnswerRows(
    attemptId: string,
    answers: ReadonlyArray<QuizAnswer>,
    questions: QuizQuestionRow[],
    answeredAt: Date,
  ): Prisma.EvaluationAnswerCreateManyInput[] {
    const sortedQuestions: QuizQuestionRow[] = [...questions].sort(byOrder);
    const answeredQuestionIds: Set<string> = new Set<string>();
    const rows: Prisma.EvaluationAnswerCreateManyInput[] = [];

    for (const answer of answers) {
      const question: QuizQuestionRow | undefined = sortedQuestions.find(
        (candidate: QuizQuestionRow) => (candidate.legacyRef ?? candidate.id) === answer.questionId,
      );

      if (!question || answeredQuestionIds.has(question.id)) {
        continue;
      }

      answeredQuestionIds.add(question.id);

      const option: QuizOptionRow | undefined = [...question.options]
        .sort(byOrder)
        .find((candidate: QuizOptionRow) => (candidate.legacyRef ?? candidate.id) === answer.selectedOptionId);

      rows.push({
        id: `${attemptId}:${question.id}`,
        attemptId,
        questionId: question.id,
        selectedOptionIds: option ? [option.id] : [],
        autoScore: option?.isCorrect ? question.points : 0,
        createdAt: answeredAt,
        updatedAt: answeredAt,
      });
    }

    return rows;
  }
}
