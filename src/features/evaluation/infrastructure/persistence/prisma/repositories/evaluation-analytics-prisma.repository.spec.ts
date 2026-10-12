/*
 * Funcionalidad: Pruebas del repositorio Prisma EvaluationAnalyticsPrismaRepository
 * Descripción: Verifica con un cliente Prisma simulado que las notas publicadas de varios usuarios salen de una sola consulta con IN (y ninguna sin usuarios), que los puntajes por pregunta usan el manual sobre el automático solo de intentos GRADED y que la referencia de una evaluación deduplica sus grupos asignados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type PublishedGradeView } from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import { type EvaluationQuestionScoreSource, type EvaluationReferenceView } from "@/features/evaluation/domain/repositories/evaluation-analytics.repository";
import { EvaluationAnalyticsPrismaRepository } from "@/features/evaluation/infrastructure/persistence/prisma/repositories/evaluation-analytics-prisma.repository";

interface PrismaMock {
  studentEvaluationAttempt: { findMany: jest.Mock; count: jest.Mock };
  evaluationQuestion: { findMany: jest.Mock };
  evaluationAnswer: { findMany: jest.Mock };
  evaluation: { findUnique: jest.Mock };
}

const PUBLISHED_AT: Date = new Date("2026-10-01T10:00:00.000Z");

describe("EvaluationAnalyticsPrismaRepository", () => {
  let prisma: PrismaMock;
  let repository: EvaluationAnalyticsPrismaRepository;

  beforeEach(() => {
    prisma = {
      studentEvaluationAttempt: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
      evaluationQuestion: { findMany: jest.fn().mockResolvedValue([]) },
      evaluationAnswer: { findMany: jest.fn().mockResolvedValue([]) },
      evaluation: { findUnique: jest.fn() },
    };
    repository = new EvaluationAnalyticsPrismaRepository(prisma as unknown as PrismaService);
  });

  it("reads the published grades of every user with one IN query", async () => {
    prisma.studentEvaluationAttempt.findMany.mockResolvedValue([
      {
        id: "attempt-1",
        evaluationId: "evaluation-1",
        userId: "student-1",
        attemptNumber: 1,
        score: 8,
        maxScore: 10,
        grade: 4,
        gradePublishedAt: PUBLISHED_AT,
        legacySource: null,
        evaluation: { title: "Ventilation basics", type: "EXAM" },
      },
    ]);

    const grades: PublishedGradeView[] = await repository.getPublishedGradesOfUsers(["student-1", "student-2"], ["evaluation-1"]);

    expect(prisma.studentEvaluationAttempt.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.studentEvaluationAttempt.findMany.mock.calls[0][0].where.AND).toEqual(
      expect.arrayContaining([{ userId: { in: ["student-1", "student-2"] } }, { evaluationId: { in: ["evaluation-1"] } }]),
    );
    expect(grades).toEqual([expect.objectContaining({ attemptId: "attempt-1", userId: "student-1", grade: 4, publishedAt: PUBLISHED_AT, legacy: false })]);
  });

  it("does not query without users", async () => {
    const grades: PublishedGradeView[] = await repository.getPublishedGradesOfUsers([]);

    expect(grades).toEqual([]);
    expect(prisma.studentEvaluationAttempt.findMany).not.toHaveBeenCalled();
  });

  it("scores answers of graded attempts with the manual score over the automatic one", async () => {
    prisma.evaluationQuestion.findMany.mockResolvedValue([{ id: "question-1", order: 1, type: "OPEN_TEXT", points: 2 }]);
    prisma.studentEvaluationAttempt.count.mockResolvedValue(2);
    prisma.evaluationAnswer.findMany.mockResolvedValue([
      { questionId: "question-1", autoScore: 0, manualScore: 1.5 },
      { questionId: "question-1", autoScore: null, manualScore: null },
    ]);

    const source: EvaluationQuestionScoreSource = await repository.getQuestionScoreSource("evaluation-1");

    expect(prisma.evaluationAnswer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { attempt: { evaluationId: "evaluation-1", status: "GRADED", grade: { not: null } } } }),
    );
    expect(source).toEqual({
      questions: [{ id: "question-1", order: 1, type: "OPEN_TEXT", points: 2 }],
      gradedAttemptCount: 2,
      answers: [
        { questionId: "question-1", earned: 1.5 },
        { questionId: "question-1", earned: undefined },
      ],
    });
  });

  it("returns the evaluation reference with its distinct assigned groups", async () => {
    prisma.evaluation.findUnique.mockResolvedValue({ id: "evaluation-1", title: "Exam", type: "EXAM", assignments: [{ groupId: "g-1" }, { groupId: "g-1" }, { groupId: "g-2" }] });

    const reference: EvaluationReferenceView | undefined = await repository.getEvaluationReference("evaluation-1");

    expect(reference).toEqual({ id: "evaluation-1", title: "Exam", type: "EXAM", assignedGroupIds: ["g-1", "g-2"] });
  });
});
