/*
 * Funcionalidad: Pruebas del repositorio Prisma de logros
 * Descripción: Verifica con un cliente Prisma simulado que las métricas de quizzes aprobados y con puntaje perfecto se calculen sobre student_evaluation_attempts de evaluaciones QUIZ (nunca quiz_attempts), con el porcentaje heredado o round(score/maxScore*100) y el aprobado heredado o porcentaje ≥ nota mínima
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type AchievementMetrics } from "@/features/progress/domain/services/achievement-catalog";
import { QUIZ_RESULT_ATTEMPT_SCOPE, QUIZ_RESULT_ATTEMPT_SELECT } from "@/features/progress/infrastructure/persistence/prisma/quiz-results";
import { AchievementsPrismaRepository } from "@/features/progress/infrastructure/persistence/prisma/repositories/achievements-prisma.repository";

interface PrismaMock {
  lessonCompletion: { count: jest.Mock; findMany: jest.Mock };
  userProgress: { count: jest.Mock };
  studentEvaluationAttempt: { findMany: jest.Mock };
  quizAttempt: { count: jest.Mock };
}

function attemptRow(
  id: string,
  legacySource: string | null,
  score: number,
  maxScore: number,
  legacyPayload: Record<string, unknown> | null,
  legacyPassingScore: number | null,
): Record<string, unknown> {
  return { id, evaluationId: `eval-${id}`, score, maxScore, submittedAt: null, legacySource, legacyPayload, evaluation: { legacyPassingScore } };
}

describe("AchievementsPrismaRepository.getMetrics", () => {
  let prisma: PrismaMock;
  let repository: AchievementsPrismaRepository;

  beforeEach(() => {
    prisma = {
      lessonCompletion: { count: jest.fn().mockResolvedValue(4), findMany: jest.fn().mockResolvedValue([]) },
      userProgress: { count: jest.fn().mockResolvedValue(1) },
      studentEvaluationAttempt: { findMany: jest.fn().mockResolvedValue([]) },
      quizAttempt: { count: jest.fn() },
    };
    repository = new AchievementsPrismaRepository(prisma as unknown as PrismaService, { save: jest.fn() });
  });

  afterEach(() => {
    expect(prisma.quizAttempt.count).not.toHaveBeenCalled();
  });

  it("reads quiz attempts of the user from student_evaluation_attempts with the quiz result scope", async () => {
    await repository.getMetrics("user-1");

    expect(prisma.studentEvaluationAttempt.findMany).toHaveBeenCalledWith({
      where: { AND: [QUIZ_RESULT_ATTEMPT_SCOPE, { userId: "user-1" }] },
      select: QUIZ_RESULT_ATTEMPT_SELECT,
    });
  });

  it("restricts the scope to QUIZ evaluations from quizzes or new ones, and to legacy or published graded attempts", () => {
    expect(QUIZ_RESULT_ATTEMPT_SCOPE).toEqual({
      evaluation: { type: "QUIZ", OR: [{ legacySource: "quiz" }, { legacySource: null }] },
      OR: [{ legacySource: "quiz_attempt" }, { status: "GRADED", gradePublishedAt: { not: null } }],
    });
  });

  it("counts passed and perfect quizzes with the legacy flags and the percent mapping of new attempts", async () => {
    prisma.studentEvaluationAttempt.findMany.mockResolvedValue([
      attemptRow("legacy-perfect", "quiz_attempt", 100, 100, { passed: true, score: 100 }, 70),
      attemptRow("legacy-failed", "quiz_attempt", 65, 100, { passed: false, score: 65 }, 60),
      attemptRow("new-passed", null, 3, 4, null, null),
      attemptRow("new-perfect", null, 4, 4, null, null),
      attemptRow("new-failed", null, 2, 4, null, null),
    ]);

    const metrics: AchievementMetrics = await repository.getMetrics("user-1");

    expect(metrics.passedQuizzes).toBe(3);
    expect(metrics.perfectQuizzes).toBe(2);
    expect(metrics.completedLessons).toBe(4);
    expect(metrics.completedModules).toBe(1);
  });
});
