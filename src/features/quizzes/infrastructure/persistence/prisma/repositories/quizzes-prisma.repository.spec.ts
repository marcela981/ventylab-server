/*
 * Funcionalidad: Pruebas del repositorio Prisma de quizzes
 * Descripción: Verifica con un cliente Prisma simulado que el repositorio lea y escriba solo el modelo de evaluaciones (nunca quizzes ni quiz_attempts), filtre el alcance de quizzes, conserve el orden heredado, tome los dos candados (quiz y evaluación) y numere el intento como el máximo más uno
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { QuizAttempt } from "@/features/quizzes/domain/entities/quiz-attempt.entity";
import { type QuizSummary } from "@/features/quizzes/domain/read-models/quiz.read-model";
import {
  QUIZ_EVALUATION_SCOPE,
  QuizzesPrismaRepository,
} from "@/features/quizzes/infrastructure/persistence/prisma/repositories/quizzes-prisma.repository";

interface PrismaMock {
  evaluation: { findMany: jest.Mock; findFirst: jest.Mock };
  evaluationQuestion: { findMany: jest.Mock };
  studentEvaluationAttempt: { findMany: jest.Mock; findFirst: jest.Mock; create: jest.Mock };
  evaluationAnswer: { createMany: jest.Mock };
  quiz: { findMany: jest.Mock };
  quizAttempt: { findMany: jest.Mock; upsert: jest.Mock };
  $queryRaw: jest.Mock;
  $executeRaw: jest.Mock;
}

function createPrismaMock(): PrismaMock {
  return {
    evaluation: { findMany: jest.fn(), findFirst: jest.fn() },
    evaluationQuestion: { findMany: jest.fn().mockResolvedValue([]) },
    studentEvaluationAttempt: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn(), create: jest.fn() },
    evaluationAnswer: { createMany: jest.fn() },
    quiz: { findMany: jest.fn() },
    quizAttempt: { findMany: jest.fn(), upsert: jest.fn() },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };
}

function evaluationRow(id: string, moduleId: string | null, legacyModuleRef: string | null, order: number): Record<string, unknown> {
  return {
    id,
    title: id,
    description: null,
    moduleId,
    lessonId: null,
    durationMinutes: null,
    status: "READY",
    order,
    legacySource: "quiz",
    legacyPassingScore: 70,
    legacyModuleRef,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

describe("QuizzesPrismaRepository", () => {
  let prisma: PrismaMock;
  let auditLogRepository: { save: jest.Mock };
  let repository: QuizzesPrismaRepository;

  beforeEach(() => {
    prisma = createPrismaMock();
    auditLogRepository = { save: jest.fn() };
    repository = new QuizzesPrismaRepository(prisma as unknown as PrismaService, auditLogRepository);
  });

  afterEach(() => {
    expect(prisma.quiz.findMany).not.toHaveBeenCalled();
    expect(prisma.quizAttempt.findMany).not.toHaveBeenCalled();
    expect(prisma.quizAttempt.upsert).not.toHaveBeenCalled();
  });

  it("lists READY quizzes of the scope filtered by module and in legacy order", async () => {
    prisma.evaluation.findMany.mockResolvedValue([
      evaluationRow("c", null, null, 0),
      evaluationRow("b", null, "module-b", 2),
      evaluationRow("a", "module-a", "module-a", 1),
      evaluationRow("b0", "module-b", "module-b", 1),
    ]);

    const result: QuizSummary[] = await repository.getActiveQuizzes("module-b");

    expect(prisma.evaluation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        AND: [
          QUIZ_EVALUATION_SCOPE,
          { status: "READY" },
          { OR: [{ moduleId: "module-b" }, { moduleId: null, legacyModuleRef: "module-b" }] },
        ],
      },
    }));
    expect(result.map((quiz: QuizSummary) => quiz.id)).toEqual(["a", "b0", "b", "c"]);
  });

  it("restricts the scope to legacy quizzes and unassigned READY QUIZ evaluations", () => {
    expect(QUIZ_EVALUATION_SCOPE).toEqual({
      type: "QUIZ",
      OR: [
        { legacySource: "quiz" },
        { legacySource: null, status: "READY", assignments: { none: {} } },
      ],
    });
  });

  it("checks for an existing attempt on student_evaluation_attempts", async () => {
    prisma.studentEvaluationAttempt.findFirst.mockResolvedValue({ id: "attempt-1" });

    const result: boolean = await repository.hasAttempt("user-1", "quiz-1");

    expect(result).toBe(true);
    expect(prisma.studentEvaluationAttempt.findFirst).toHaveBeenCalledWith({ where: { userId: "user-1", evaluationId: "quiz-1" }, select: { id: true } });
  });

  it("takes the legacy quiz lock and the evaluation attempt lock in the transaction", async () => {
    await repository.lockUserQuiz("user-1", "quiz-1", prisma);

    expect(prisma.$queryRaw.mock.calls[0].slice(1)).toEqual(["quiz_attempt:user-1:quiz-1"]);
    expect(prisma.$executeRaw.mock.calls[0].slice(1)).toEqual(["evaluations:attempt:quiz-1:user-1"]);
  });

  it("saves the attempt as the next attempt number with its answers and audit logs", async () => {
    prisma.studentEvaluationAttempt.findFirst.mockResolvedValue({ attemptNumber: 1 });
    prisma.evaluationQuestion.findMany.mockResolvedValue([
      {
        id: "quiz-1:q1",
        order: 1,
        type: "SINGLE_CHOICE",
        prompt: {},
        points: 1,
        explanation: null,
        legacyType: "multiple_choice",
        legacyRef: "q1",
        options: [{ id: "quiz-1:q1:a", order: 1, content: "A", isCorrect: true, legacyFeedback: null, legacyRef: "a" }],
      },
    ]);
    const attempt: QuizAttempt = QuizAttempt.create({
      userId: "user-1",
      quizId: "quiz-1",
      score: 100,
      passed: true,
      answers: [{ questionId: "q1", selectedOptionId: "a" }],
    });

    await repository.save(attempt, prisma);

    expect(prisma.studentEvaluationAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ id: attempt.id, evaluationId: "quiz-1", attemptNumber: 2, status: "GRADED", score: 100, grade: 5 }),
    });
    expect(prisma.evaluationAnswer.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ attemptId: attempt.id, questionId: "quiz-1:q1", selectedOptionIds: ["quiz-1:q1:a"], autoScore: 1 })],
    });
    expect(auditLogRepository.save).toHaveBeenCalledWith("quiz_attempts", "quiz_attempt", attempt.id, attempt.auditLogs, prisma);
  });
});
