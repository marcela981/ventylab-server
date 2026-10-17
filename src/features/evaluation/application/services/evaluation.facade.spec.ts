/*
 * Funcionalidad: Pruebas de EvaluationFacade
 * Descripción: Verifica con repositorios simulados las notas publicadas de un usuario y de un grupo con su aprobación según la nota mínima configurada, las estadísticas de una evaluación (conteos por estado, publicadas, promedio, mínimo, máximo y tasa de aprobación) el conteo de intentos pendientes de revisión en el alcance de un profesor y las lecturas para analítica (mediana e histograma, notas de varios usuarios en una sola llamada al repositorio, índice de dificultad por pregunta, reenvío del alcance de intentos de un profesor y asignaciones abiertas de un estudiante)
 * Versión: 1.4
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationAssignmentResult } from "@/features/evaluation/application/results/evaluation-assignment.result";
import { type EvaluationGradeStats, type EvaluationUserGrade } from "@/features/evaluation/application/results/evaluation-grading.result";
import { type EvaluationAssignmentAccess } from "@/features/evaluation/application/services/evaluation-assignment-access";
import { EvaluationFacade } from "@/features/evaluation/application/services/evaluation.facade";
import { type GetStudentEvaluationAssignmentsUseCase } from "@/features/evaluation/application/use-cases/get-student-evaluation-assignments.usecase";
import { type PublishedGradeView } from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import { type EvaluationAttemptScope, type IEvaluationAnalyticsRepository } from "@/features/evaluation/domain/repositories/evaluation-analytics.repository";
import { type IEvaluationGradingRepository } from "@/features/evaluation/domain/repositories/evaluation-grading.repository";
import { type EvaluationQuestionStats } from "@/features/evaluation/domain/services/evaluation-analytics";

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

interface FacadeHarness {
  facade: EvaluationFacade;
  repository: jest.Mocked<IEvaluationGradingRepository>;
  analytics: jest.Mocked<IEvaluationAnalyticsRepository>;
  assignments: jest.Mock;
  scopeFor: jest.Mock;
}

function assignment(id: string, state: EvaluationAssignmentResult["state"]): EvaluationAssignmentResult {
  return { id, state } as unknown as EvaluationAssignmentResult;
}

function build(): FacadeHarness {
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
    countQueue: jest.fn().mockResolvedValue(0),
  };

  const scopeFor: jest.Mock = jest.fn().mockResolvedValue({ teacherId: "teacher-1", supervisedGroupIds: ["group-2"] });
  const access: EvaluationAssignmentAccess = { scopeFor } as unknown as EvaluationAssignmentAccess;

  const analytics: jest.Mocked<IEvaluationAnalyticsRepository> = {
    getPublishedGradesOfUsers: jest.fn().mockResolvedValue([view(), view({ attemptId: "attempt-2", userId: "student-2", grade: 2.5 })]),
    getGradedGrades: jest.fn().mockResolvedValue([1.5, 3, 4.5, 5]),
    getQuestionScoreSource: jest.fn().mockResolvedValue({
      questions: [{ id: "question-1", order: 1, type: "SINGLE_CHOICE", points: 2 }],
      gradedAttemptCount: 2,
      answers: [{ questionId: "question-1", earned: 2 }, { questionId: "question-1", earned: 0 }],
    }),
    getEvaluationReference: jest.fn(),
    getAttemptActivityOfUser: jest.fn(),
  };
  const assignments: jest.Mock = jest
    .fn()
    .mockResolvedValue([assignment("assignment-active", "ACTIVE"), assignment("assignment-closed", "CLOSED"), assignment("assignment-upcoming", "UPCOMING")]);
  const assignmentsUseCase: GetStudentEvaluationAssignmentsUseCase = { execute: assignments } as unknown as GetStudentEvaluationAssignmentsUseCase;

  return {
    facade: new EvaluationFacade(repository, access, { passingGrade: 3, submitGraceMs: 30_000 }, analytics, assignmentsUseCase),
    repository,
    analytics,
    assignments,
    scopeFor,
  };
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

    expect(repository.getEvaluationStats).toHaveBeenCalledWith("evaluation-1", 3, undefined);
    expect(stats).toEqual({
      evaluationId: "evaluation-1",
      attemptsByStatus: { IN_PROGRESS: 1, SUBMITTED: 0, PENDING_REVIEW: 2, GRADED: 4 },
      totalAttempts: 7,
      publishedCount: 3,
      gradedCount: 4,
      averageGrade: 3.46,
      minGrade: 1.5,
      maxGrade: 5,
      medianGrade: 3.75,
      histogram: [
        { from: 0, to: 0.5, count: 0 },
        { from: 0.5, to: 1, count: 0 },
        { from: 1, to: 1.5, count: 0 },
        { from: 1.5, to: 2, count: 1 },
        { from: 2, to: 2.5, count: 0 },
        { from: 2.5, to: 3, count: 0 },
        { from: 3, to: 3.5, count: 1 },
        { from: 3.5, to: 4, count: 0 },
        { from: 4, to: 4.5, count: 0 },
        { from: 4.5, to: 5, count: 2 },
      ],
      passRate: 0.75,
      passingGrade: 3,
    });
  });

  it("leaves the averages and the pass rate undefined without graded attempts", async () => {
    const { facade, repository, analytics } = build();

    repository.getEvaluationStats.mockResolvedValueOnce({
      evaluationId: "evaluation-1",
      attemptsByStatus: { IN_PROGRESS: 0, SUBMITTED: 0, PENDING_REVIEW: 0, GRADED: 0 },
      publishedCount: 0,
      gradedCount: 0,
      passedCount: 0,
    });

    analytics.getGradedGrades.mockResolvedValueOnce([]);

    const stats: EvaluationGradeStats = await facade.getEvaluationStats("evaluation-1");

    expect(stats).toMatchObject({ totalAttempts: 0, averageGrade: undefined, medianGrade: undefined, passRate: undefined });
    expect(stats.histogram.every((bucket: { count: number }) => bucket.count === 0)).toBe(true);
  });

  it("counts PENDING_REVIEW attempts in the teacher scope", async () => {
    const { facade, repository, scopeFor } = build();

    const count: number = await facade.getPendingReviewCount("teacher-1");

    expect(scopeFor).toHaveBeenCalledWith({ id: "teacher-1", role: "TEACHER" });
    expect(repository.countPendingReview).toHaveBeenCalledWith({ teacherId: "teacher-1", supervisedGroupIds: ["group-2"] });
    expect(count).toBe(7);
  });

  it("reads the published grades of many users with one repository call", async () => {
    const { facade, analytics } = build();

    const grades: EvaluationUserGrade[] = await facade.getGradesForUsers(["student-1", "student-2"], ["evaluation-1"]);

    expect(analytics.getPublishedGradesOfUsers).toHaveBeenCalledTimes(1);
    expect(analytics.getPublishedGradesOfUsers).toHaveBeenCalledWith(["student-1", "student-2"], ["evaluation-1"], undefined);
    expect(grades.map((grade: EvaluationUserGrade) => [grade.userId, grade.passed])).toEqual([
      ["student-1", true],
      ["student-2", false],
    ]);
  });

  it("computes the difficulty index and the correct rate of each question", async () => {
    const { facade } = build();

    const questions: EvaluationQuestionStats[] = await facade.getEvaluationQuestionStats("evaluation-1");

    expect(questions).toEqual([
      { questionId: "question-1", order: 1, type: "SINGLE_CHOICE", points: 2, answeredCount: 2, correctCount: 1, correctRate: 0.5, difficultyIndex: 0.5 },
    ]);
  });

  it("forwards the teacher attempt scope to every statistics read", async () => {
    const { facade, repository, analytics } = build();
    const scope: EvaluationAttemptScope = { teacherId: "teacher-1", groupIds: ["group-a"] };

    await facade.getEvaluationStats("evaluation-1", scope);
    await facade.getEvaluationQuestionStats("evaluation-1", scope);

    expect(repository.getEvaluationStats).toHaveBeenCalledWith("evaluation-1", 3, scope);
    expect(analytics.getGradedGrades).toHaveBeenCalledWith("evaluation-1", scope);
    expect(analytics.getQuestionScoreSource).toHaveBeenCalledWith("evaluation-1", scope);
  });

  it("keeps only the active and upcoming assignments of a student", async () => {
    const { facade, assignments } = build();

    const open: EvaluationAssignmentResult[] = await facade.getOpenAssignmentsOfStudent("student-1");

    expect(assignments).toHaveBeenCalledWith("student-1");
    expect(open.map((item: EvaluationAssignmentResult) => item.id)).toEqual(["assignment-active", "assignment-upcoming"]);
  });
});
