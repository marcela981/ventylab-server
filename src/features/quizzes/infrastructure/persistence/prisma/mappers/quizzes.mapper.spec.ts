/*
 * Funcionalidad: Pruebas del mapper de persistencia de quizzes
 * Descripción: Verifica que las filas de evaluaciones migradas desde quizzes (según migration.sql) se reconstruyan exactamente con la forma JSON de los 26 quizzes del seed, el mapeo de evaluaciones QUIZ nuevas, el resumen de intentos heredados y nuevos, y la persistencia de un intento como intento calificado con sus respuestas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import * as fs from "fs";
import * as path from "path";

import { QuizAttempt } from "@/features/quizzes/domain/entities/quiz-attempt.entity";
import {
  type QuizAttemptSummary,
  type QuizDetail,
  type QuizQuestion,
  type QuizSummary,
} from "@/features/quizzes/domain/read-models/quiz.read-model";
import {
  QUIZ_DEFAULT_PASSING_SCORE,
  type QuizAttemptPersistence,
  type QuizEvaluationRow,
  type QuizQuestionRow,
  QuizzesMapper,
  quizGradeFromPercent,
} from "@/features/quizzes/infrastructure/persistence/prisma/mappers/quizzes.mapper";

interface SeedQuiz {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  passingScore: number;
  questions: QuizQuestion[];
}

const SEED_QUIZZES_DIR: string = path.join(process.cwd(), "prisma", "seed-data", "evaluation", "quizzes");

function listJsonFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry: fs.Dirent) => {
    const fullPath: string = path.join(directory, entry.name);

    return entry.isDirectory() ? listJsonFiles(fullPath) : entry.name.endsWith(".json") ? [fullPath] : [];
  });
}

function richText(text: string): unknown {
  return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] };
}

// Mirrors sections 4 and 6 of migration 20261007120000_evaluation_feature for a quiz with unique JSON ids
function migrateQuiz(seed: SeedQuiz): QuizEvaluationRow {
  const now: Date = new Date("2026-01-01T00:00:00Z");

  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    moduleId: null,
    lessonId: null,
    durationMinutes: null,
    status: "READY",
    order: 0,
    legacySource: "quiz",
    legacyPassingScore: seed.passingScore,
    legacyModuleRef: seed.moduleId,
    createdAt: now,
    updatedAt: now,
    questions: seed.questions.map((question: QuizQuestion, index: number) => ({
      id: `${seed.id}:${question.id}`,
      order: index + 1,
      type: question.type === "true_false" ? "TRUE_FALSE" : "SINGLE_CHOICE",
      prompt: richText(question.text) as QuizQuestionRow["prompt"],
      points: 1,
      explanation: question.explanation ?? null,
      legacyType: question.type,
      legacyRef: question.id,
      options: question.options.map((option: QuizQuestion["options"][number], optionIndex: number) => ({
        id: `${seed.id}:${question.id}:${option.id}`,
        order: optionIndex + 1,
        content: option.text,
        isCorrect: option.isCorrect,
        legacyFeedback: option.feedback ?? null,
        legacyRef: option.id,
      })),
    })),
  };
}

describe("QuizzesMapper", () => {
  const seedFiles: string[] = listJsonFiles(SEED_QUIZZES_DIR);

  it("finds the 26 seeded quizzes", () => {
    expect(seedFiles).toHaveLength(26);
  });

  it.each(seedFiles.map((file: string) => [path.basename(file), file]))(
    "rebuilds the exact seed JSON questions of %s from its migrated rows",
    (_name: string, file: string) => {
      const seed: SeedQuiz = JSON.parse(fs.readFileSync(file, "utf8")) as SeedQuiz;
      const row: QuizEvaluationRow = migrateQuiz(seed);
      row.questions.reverse();

      const detail: QuizDetail = QuizzesMapper.toDetail(row);

      expect(JSON.parse(JSON.stringify(detail.questions))).toStrictEqual(seed.questions);
      expect(detail).toMatchObject({
        id: seed.id,
        title: seed.title,
        description: seed.description,
        moduleId: seed.moduleId,
        passingScore: seed.passingScore,
        isActive: true,
      });
      expect(detail.timeLimit).toBeUndefined();
    },
  );

  it("maps a new unassigned QUIZ evaluation with default passing score, enum types and plain-text description", () => {
    const now: Date = new Date("2026-02-01T00:00:00Z");
    const row: QuizEvaluationRow = {
      id: "eval-1",
      title: "New quiz",
      description: JSON.stringify(richText("Plain description")),
      moduleId: "module-1",
      lessonId: "lesson-1",
      durationMinutes: 15,
      status: "READY",
      order: 3,
      legacySource: null,
      legacyPassingScore: null,
      legacyModuleRef: null,
      createdAt: now,
      updatedAt: now,
      questions: [
        {
          id: "question-uuid",
          order: 1,
          type: "TRUE_FALSE",
          prompt: richText("Is PEEP positive?") as QuizQuestionRow["prompt"],
          points: 2,
          explanation: null,
          legacyType: null,
          legacyRef: null,
          options: [
            { id: "option-true", order: 1, content: "True", isCorrect: true, legacyFeedback: null, legacyRef: null },
            { id: "option-false", order: 2, content: "False", isCorrect: false, legacyFeedback: "No", legacyRef: null },
          ],
        },
      ],
    };

    const detail: QuizDetail = QuizzesMapper.toDetail(row);

    expect(detail).toStrictEqual({
      id: "eval-1",
      title: "New quiz",
      description: "Plain description",
      moduleId: "module-1",
      passingScore: QUIZ_DEFAULT_PASSING_SCORE,
      timeLimit: 15,
      order: 3,
      createdAt: now,
      lessonId: "lesson-1",
      isActive: true,
      updatedAt: now,
      questions: [
        {
          id: "question-uuid",
          type: "true_false",
          text: "Is PEEP positive?",
          options: [
            { id: "option-true", text: "True", isCorrect: true },
            { id: "option-false", text: "False", isCorrect: false, feedback: "No" },
          ],
        },
      ],
    });
  });

  it("reports an archived legacy quiz as inactive and prefers module_id over legacy_module_ref", () => {
    const seed: SeedQuiz = JSON.parse(fs.readFileSync(seedFiles[0], "utf8")) as SeedQuiz;
    const row: QuizEvaluationRow = { ...migrateQuiz(seed), status: "ARCHIVED", moduleId: "existing-module" };

    const summary: QuizSummary = QuizzesMapper.toSummary(row);
    const detail: QuizDetail = QuizzesMapper.toDetail(row);

    expect(summary.moduleId).toBe("existing-module");
    expect(detail.isActive).toBe(false);
  });

  it("maps a migrated legacy attempt with its stored score and passed flag", () => {
    const completedAt: Date = new Date("2025-05-05T10:00:00Z");

    const summary: QuizAttemptSummary = QuizzesMapper.toAttemptSummary({
      id: "attempt-1",
      evaluationId: "quiz-1",
      score: 70,
      maxScore: 100,
      submittedAt: completedAt,
      legacySource: "quiz_attempt",
      legacyPayload: { answers: [], passed: false, score: 70 },
      evaluation: { legacyPassingScore: 60 },
    });

    expect(summary).toStrictEqual({ id: "attempt-1", quizId: "quiz-1", score: 70, passed: false, completedAt });
  });

  it("maps a non-legacy attempt to a percentage and derives passed from the passing score", () => {
    const summary: QuizAttemptSummary = QuizzesMapper.toAttemptSummary({
      id: "attempt-2",
      evaluationId: "eval-1",
      score: 3,
      maxScore: 4,
      submittedAt: null,
      legacySource: null,
      legacyPayload: null,
      evaluation: { legacyPassingScore: null },
    });

    expect(summary).toStrictEqual({ id: "attempt-2", quizId: "eval-1", score: 75, passed: true, completedAt: undefined });
  });

  it("persists an attempt as a GRADED attempt with legacy payload and answers mapped through legacy refs", () => {
    const seed: SeedQuiz = JSON.parse(fs.readFileSync(seedFiles[0], "utf8")) as SeedQuiz;
    const row: QuizEvaluationRow = migrateQuiz(seed);
    const [first, second] = seed.questions;
    const correct: string = first.options.find((option: QuizQuestion["options"][number]) => option.isCorrect)?.id ?? "";
    const attempt: QuizAttempt = QuizAttempt.create({
      userId: "user-1",
      quizId: seed.id,
      score: 87,
      passed: true,
      answers: [
        { questionId: first.id, selectedOptionId: correct },
        { questionId: first.id, selectedOptionId: "ignored-duplicate" },
        { questionId: second.id, selectedOptionId: "unknown-option" },
        { questionId: "unknown-question", selectedOptionId: "a" },
      ],
    });

    const data: QuizAttemptPersistence = QuizzesMapper.toAttemptPersistence(attempt, 2, row.questions);

    expect(data.attempt).toMatchObject({
      id: attempt.id,
      evaluationId: seed.id,
      userId: "user-1",
      attemptNumber: 2,
      status: "GRADED",
      score: 87,
      maxScore: 100,
      grade: 4.4,
      submittedAt: attempt.completedAt,
      gradePublishedAt: attempt.completedAt,
      legacySource: "quiz_attempt",
      legacyPayload: {
        answers: attempt.answers.map((answer: { questionId: string; selectedOptionId: string }) => ({ ...answer })),
        passed: true,
        score: 87,
      },
    });
    expect(data.answers).toMatchObject([
      { id: `${attempt.id}:${seed.id}:${first.id}`, questionId: `${seed.id}:${first.id}`, selectedOptionIds: [`${seed.id}:${first.id}:${correct}`], autoScore: 1 },
      { id: `${attempt.id}:${seed.id}:${second.id}`, questionId: `${seed.id}:${second.id}`, selectedOptionIds: [], autoScore: 0 },
    ]);
  });

  it("rounds grades like the migration's numeric ROUND", () => {
    expect([0, 59, 60, 87, 99, 100].map((percent: number) => quizGradeFromPercent(percent))).toEqual([0, 3, 3, 4.4, 5, 5]);
  });
});
