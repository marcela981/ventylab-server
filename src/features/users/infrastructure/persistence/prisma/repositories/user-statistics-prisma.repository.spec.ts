/*
 * Funcionalidad: Pruebas del repositorio Prisma de estadísticas de usuario
 * Descripción: Verifica con un cliente Prisma simulado que el total y el promedio de intentos de quiz se calculen sobre student_evaluation_attempts de evaluaciones QUIZ (nunca quiz_attempts) con el porcentaje heredado o round(score/maxScore*100)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { QUIZ_RESULT_ATTEMPT_SCOPE, QUIZ_RESULT_ATTEMPT_SELECT } from "@/features/progress/infrastructure/persistence/prisma/quiz-results";
import { type UserStats } from "@/features/users/domain/value-objects/user-stats";
import { UserStatisticsPrismaRepository } from "@/features/users/infrastructure/persistence/prisma/repositories/user-statistics-prisma.repository";

interface PrismaMock {
  lessonCompletion: { count: jest.Mock };
  achievement: { count: jest.Mock };
  studentEvaluationAttempt: { findMany: jest.Mock };
  quizAttempt: { aggregate: jest.Mock };
}

describe("UserStatisticsPrismaRepository.getUserStats", () => {
  let prisma: PrismaMock;
  let repository: UserStatisticsPrismaRepository;

  beforeEach(() => {
    prisma = {
      lessonCompletion: { count: jest.fn().mockResolvedValue(2) },
      achievement: { count: jest.fn().mockResolvedValue(1) },
      studentEvaluationAttempt: { findMany: jest.fn().mockResolvedValue([]) },
      quizAttempt: { aggregate: jest.fn() },
    };
    repository = new UserStatisticsPrismaRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    expect(prisma.quizAttempt.aggregate).not.toHaveBeenCalled();
  });

  it("averages the legacy score and the percent of new graded attempts", async () => {
    prisma.studentEvaluationAttempt.findMany.mockResolvedValue([
      { id: "a1", evaluationId: "q1", score: 80, maxScore: 100, submittedAt: null, legacySource: "quiz_attempt", legacyPayload: { passed: true }, evaluation: { legacyPassingScore: 70 } },
      { id: "a2", evaluationId: "q2", score: 1, maxScore: 2, submittedAt: null, legacySource: null, legacyPayload: null, evaluation: { legacyPassingScore: null } },
    ]);

    const stats: UserStats = await repository.getUserStats("user-1");

    expect(prisma.studentEvaluationAttempt.findMany).toHaveBeenCalledWith({
      where: { AND: [QUIZ_RESULT_ATTEMPT_SCOPE, { userId: "user-1" }] },
      select: QUIZ_RESULT_ATTEMPT_SELECT,
    });
    expect(stats.totalQuizAttempts).toBe(2);
    expect(stats.averageQuizScore).toBe(65);
  });

  it("returns zero attempts and a zero average without quiz attempts", async () => {
    const stats: UserStats = await repository.getUserStats("user-1");

    expect(stats.totalQuizAttempts).toBe(0);
    expect(stats.averageQuizScore).toBe(0);
  });
});
