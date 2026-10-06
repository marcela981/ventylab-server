/*
 * Funcionalidad: Pruebas de EvaluationFacade
 * Descripción: Verifica con repositorios simulados las notas publicadas de un usuario y de un grupo con su aprobación según la nota mínima configurada, las estadísticas de una evaluación (conteos por estado, publicadas, promedio, mínimo, máximo y tasa de aprobación) y el conteo de intentos pendientes de revisión en el alcance de un profesor
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationGradeStats, type EvaluationUserGrade } from "@/features/evaluation/application/results/evaluation-grading.result";
import { type EvaluationAssignmentAccess } from "@/features/evaluation/application/services/evaluation-assignment-access";
import { EvaluationFacade } from "@/features/evaluation/application/services/evaluation.facade";
import { type PublishedGradeView } from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import { type IEvaluationGradingRepository } from "@/features/evaluation/domain/repositories/evaluation-grading.repository";

const PUBLISHED_AT: Date = new Date("2026-10-06T10:00:00.000Z");

function view(overrides: Partial<PublishedGradeView> = {}): PublishedGradeView {
  return {
    attemptId: "attempt-1",
    evaluationId: "evaluation-1",
    evaluationTitle: "Ventilation basics",
    evaluationType: "EXAM",
    userId: "student-1",
    attemptNumber: 1,
    score: 8,
    maxScore: 10,
    grade: 4,
    publishedAt: PUBLISHED_AT,
    legacy: false,
    ...overrides,
  };
}

function build(): { facade: EvaluationFacade; repository: jest.Mocked<IEvaluationGradingRepository>; scopeFor: jest.Mock } {
  const repository: jest.Mocked<IEvaluationGradingRepository> = {
    getQueue: jest.fn(),
    getExpiredInProgressAttemptIds: jest.fn(),
    isAttemptInScope: jest.fn(),
    getPublishableAttempts: jest.fn(),
    getPublishedGradesOfUser: jest.fn().mockResolvedValue([view(), view({ attemptId: "attempt-legacy", grade: 2.9, legacy: true, evaluationType: "QUIZ" })]),
    getPublishedGradesOfGroup: jest.fn().mockResolvedValue([view({ userId: "student-2", grade: 3 })]),
    getEvaluationStats: jest.fn().mockResolvedValue({
      evaluationId: "evaluation-1",
      attemptsByStatus: { IN_PROGRESS: 1, SUBMITTED: 0, PENDING_REVIEW: 2, GRADED: 4 },
      publishedCount: 3,
      gradedCount: 4,
      averageGrade: 3.456,
      minGrade: 1.5,
      maxGrade: 5,
      passedCount: 3,
    }),
    countPendingReview: jest.fn().mockResolvedValue(7),
  };

  const scopeFor: jest.Mock = jest.fn().mockResolvedValue({ teacherId: "teacher-1", supervisedGroupIds: ["group-2"] });
  const access: EvaluationAssignmentAccess = { scopeFor } as unknown as EvaluationAssignmentAccess;

  return { facade: new EvaluationFacade(repository, access, { passingGrade: 3 }), repository, scopeFor };
}

describe("EvaluationFacade", () => {
  it("returns the published grades of a user, legacy included, with the pass flag", async () => {
    const { facade, repository } = build();

    const grades: EvaluationUserGrade[] = await facade.getUserGrades("student-1");

    expect(repository.getPublishedGradesOfUser).toHaveBeenCalledWith("student-1");
    expect(grades).toEqual([
      expect.objectContaining({ attemptId: "attempt-1", evaluationTitle: "Ventilation basics", evaluationType: "EXAM", grade: 4, passed: true, publishedAt: PUBLISHED_AT }),
      expect.objectContaining({ attemptId: "attempt-legacy", grade: 2.9, passed: false, legacy: true }),
    ]);
  });

  it("returns the published grades of a group, optionally for one evaluation", async () => {
    const { facade, repository } = build();

    const grades: EvaluationUserGrade[] = await facade.getGroupGrades("group-1", "evaluation-1");

    expect(repository.getPublishedGradesOfGroup).toHaveBeenCalledWith("group-1", "evaluation-1");
    expect(grades[0]).toMatchObject({ userId: "student-2", grade: 3, passed: true });
  });

  it("computes evaluation statistics with the configured passing grade", async () => {
    const { facade, repository } = build();

    const stats: EvaluationGradeStats = await facade.getEvaluationStats("evaluation-1");

    expect(repository.getEvaluationStats).toHaveBeenCalledWith("evaluation-1", 3);
    expect(stats).toEqual({
      evaluationId: "evaluation-1",
      attemptsByStatus: { IN_PROGRESS: 1, SUBMITTED: 0, PENDING_REVIEW: 2, GRADED: 4 },
      totalAttempts: 7,
      publishedCount: 3,
      gradedCount: 4,
      averageGrade: 3.46,
      minGrade: 1.5,
      maxGrade: 5,
      passRate: 0.75,
      passingGrade: 3,
    });
  });

  it("leaves the averages and the pass rate undefined without graded attempts", async () => {
    const { facade, repository } = build();

    repository.getEvaluationStats.mockResolvedValueOnce({
      evaluationId: "evaluation-1",
      attemptsByStatus: { IN_PROGRESS: 0, SUBMITTED: 0, PENDING_REVIEW: 0, GRADED: 0 },
      publishedCount: 0,
      gradedCount: 0,
      passedCount: 0,
    });

    const stats: EvaluationGradeStats = await facade.getEvaluationStats("evaluation-1");

    expect(stats).toMatchObject({ totalAttempts: 0, averageGrade: undefined, passRate: undefined });
  });

  it("counts PENDING_REVIEW attempts in the teacher scope", async () => {
    const { facade, repository, scopeFor } = build();

    const count: number = await facade.getPendingReviewCount("teacher-1");

    expect(scopeFor).toHaveBeenCalledWith({ id: "teacher-1", role: "TEACHER" });
    expect(repository.countPendingReview).toHaveBeenCalledWith({ teacherId: "teacher-1", supervisedGroupIds: ["group-2"] });
    expect(count).toBe(7);
  });
});
