/*
 * Funcionalidad: Pruebas del repositorio Prisma del panel de administración
 * Descripción: Verifica con un cliente Prisma simulado que la actividad del estudiante lea los intentos de quiz de student_evaluation_attempts de evaluaciones QUIZ (nunca quiz_attempts), con el mismo orden y límite, y los convierta a porcentaje y aprobado como las rutas heredadas de quizzes
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type AdminStudentActivity } from "@/features/admin/domain/read-models/admin-dashboard.read-model";
import { AdminDashboardPrismaRepository } from "@/features/admin/infrastructure/persistence/prisma/repositories/admin-dashboard-prisma.repository";
import { QUIZ_RESULT_ATTEMPT_SCOPE, QUIZ_RESULT_ATTEMPT_SELECT } from "@/features/progress/infrastructure/persistence/prisma/quiz-results";

interface PrismaMock {
  userProgress: { findMany: jest.Mock };
  lessonCompletion: { findMany: jest.Mock };
  evaluationAttempt: { findMany: jest.Mock };
  simulatorSession: { findMany: jest.Mock };
  studentEvaluationAttempt: { findMany: jest.Mock };
  score: { findMany: jest.Mock };
  quizAttempt: { findMany: jest.Mock };
}

describe("AdminDashboardPrismaRepository.getStudentActivity", () => {
  let prisma: PrismaMock;
  let repository: AdminDashboardPrismaRepository;

  beforeEach(() => {
    prisma = {
      userProgress: { findMany: jest.fn().mockResolvedValue([]) },
      lessonCompletion: { findMany: jest.fn().mockResolvedValue([]) },
      evaluationAttempt: { findMany: jest.fn().mockResolvedValue([]) },
      simulatorSession: { findMany: jest.fn().mockResolvedValue([]) },
      studentEvaluationAttempt: { findMany: jest.fn().mockResolvedValue([]) },
      score: { findMany: jest.fn().mockResolvedValue([]) },
      quizAttempt: { findMany: jest.fn() },
    };
    repository = new AdminDashboardPrismaRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    expect(prisma.quizAttempt.findMany).not.toHaveBeenCalled();
  });

  it("reads the 30 latest quiz attempts from student_evaluation_attempts and maps percent and passed", async () => {
    const startedAt: Date = new Date("2026-01-01T00:00:00Z");

    prisma.studentEvaluationAttempt.findMany.mockResolvedValue([
      {
        id: "a1",
        evaluationId: "quiz-1",
        score: 55,
        maxScore: 100,
        submittedAt: startedAt,
        legacySource: "quiz_attempt",
        legacyPayload: { passed: false, score: 55 },
        startedAt,
        evaluation: { legacyPassingScore: 50, title: "Legacy quiz" },
      },
      {
        id: "a2",
        evaluationId: "eval-2",
        score: 7,
        maxScore: 10,
        submittedAt: startedAt,
        legacySource: null,
        legacyPayload: null,
        startedAt,
        evaluation: { legacyPassingScore: null, title: "New quiz" },
      },
    ]);

    const activity: AdminStudentActivity = await repository.getStudentActivity("user-1");

    expect(prisma.studentEvaluationAttempt.findMany).toHaveBeenCalledWith({
      where: { AND: [QUIZ_RESULT_ATTEMPT_SCOPE, { userId: "user-1" }] },
      select: { ...QUIZ_RESULT_ATTEMPT_SELECT, startedAt: true, evaluation: { select: { legacyPassingScore: true, title: true } } },
      orderBy: { startedAt: "desc" },
      take: 30,
    });
    expect(activity.quizAttempts).toEqual([
      { quizId: "quiz-1", quizTitle: "Legacy quiz", score: 55, passed: false, startedAt },
      { quizId: "eval-2", quizTitle: "New quiz", score: 70, passed: true, startedAt },
    ]);
  });
});
