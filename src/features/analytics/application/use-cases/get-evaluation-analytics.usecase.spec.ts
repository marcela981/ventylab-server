/*
 * Funcionalidad: Pruebas de GetEvaluationAnalyticsUseCase y GetMySummaryUseCase
 * Descripción: Verifica que las estadísticas de una evaluación solo se entregan al administrador, a un profesor que gestiona un grupo asignado o al creador de una evaluación sin asignaciones (403 si no, 404 si no existe), que un profesor solo agrega intentos de sus grupos (el de un grupo A no ve los del grupo B) mientras el administrador ve la evaluación completa, que combinan notas y dificultad por pregunta con caché por solicitante y alcance, y que el resumen propio compone las fachadas para el usuario autenticado con el conteo de notificaciones sin leer del puerto y las evaluaciones separadas en activas y próximas
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationAnalytics, type MySummary } from "@/features/analytics/application/results/analytics.results";
import {
  ADMIN,
  type AnalyticsHarness,
  buildAnalyticsHarness,
  buildStudents,
  GROUP_ID,
  LEGACY_EVALUATION_ID,
  OTHER_GROUP_ID,
  OTHER_TEACHER,
  SHARED_EVALUATION_ID,
  TEACHER,
} from "@/features/analytics/application/testing/analytics-test-doubles-spec";
import { MY_SUMMARY_LATEST_LIMIT } from "@/features/analytics/application/use-cases/get-my-summary.usecase";
import { AnalyticsEvaluationNotFoundError, AnalyticsScopeForbiddenError } from "@/features/analytics/domain/analytics.errors";

describe("GetEvaluationAnalyticsUseCase", () => {
  it("combines grade statistics and question analysis for a teacher of an assigned group", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(1));

    const analytics: EvaluationAnalytics = await harness.evaluation.execute(TEACHER, "evaluation-1");
    await harness.evaluation.execute(TEACHER, "evaluation-1");

    expect(analytics).toMatchObject({ evaluationId: "evaluation-1", title: "Exam", type: "EXAM", stats: { medianGrade: 3, passRate: 0.5 }, questions: [] });
    expect(harness.facades.evaluation.getEvaluationStats).toHaveBeenCalledTimes(1);
  });

  it("rejects a teacher without an assigned group in scope and a missing evaluation", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(1));

    await expect(harness.evaluation.execute(OTHER_TEACHER, "evaluation-1")).rejects.toBeInstanceOf(AnalyticsScopeForbiddenError);
    await expect(harness.evaluation.execute(ADMIN, "missing")).rejects.toBeInstanceOf(AnalyticsEvaluationNotFoundError);
    expect(harness.facades.evaluation.getEvaluationStats).not.toHaveBeenCalled();
  });

  it("aggregates only the attempts of the requester's groups for a shared evaluation", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(1));

    await harness.evaluation.execute(TEACHER, SHARED_EVALUATION_ID);
    await harness.evaluation.execute(OTHER_TEACHER, SHARED_EVALUATION_ID);
    await harness.evaluation.execute(ADMIN, SHARED_EVALUATION_ID);

    const statsScopes: unknown[] = harness.facades.evaluation.getEvaluationStats.mock.calls.map((call: unknown[]) => call[1]);
    const questionScopes: unknown[] = harness.facades.evaluation.getEvaluationQuestionStats.mock.calls.map((call: unknown[]) => call[1]);

    expect(statsScopes).toEqual([{ teacherId: TEACHER.id, groupIds: [GROUP_ID] }, { teacherId: OTHER_TEACHER.id, groupIds: [OTHER_GROUP_ID] }, undefined]);
    expect(questionScopes).toEqual(statsScopes);
    expect(harness.facades.groups.getManageableStudentGroupIds).toHaveBeenCalledWith(TEACHER, [GROUP_ID, OTHER_GROUP_ID]);
    expect(harness.facades.groups.getManageableStudentGroupIds).toHaveBeenCalledTimes(2);
  });

  it("lets the creator of an evaluation without assignments read it and rejects other teachers", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(1));

    await harness.evaluation.execute(TEACHER, LEGACY_EVALUATION_ID);

    await expect(harness.evaluation.execute(OTHER_TEACHER, LEGACY_EVALUATION_ID)).rejects.toBeInstanceOf(AnalyticsScopeForbiddenError);
    expect(harness.facades.evaluation.getEvaluationStats).toHaveBeenCalledWith(LEGACY_EVALUATION_ID, { teacherId: TEACHER.id, groupIds: [] });
    expect(harness.facades.groups.getManageableStudentGroupIds).not.toHaveBeenCalled();
  });
});

describe("GetMySummaryUseCase", () => {
  it("composes the summary of the authenticated user only", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness([]);

    harness.facades.evaluation.getOpenAssignmentsOfStudent.mockResolvedValue([
      { id: "assignment-1", state: "ACTIVE" },
      { id: "assignment-2", state: "UPCOMING" },
    ]);

    const summary: MySummary = await harness.summary.execute({ id: "student-01", role: "STUDENT" });

    expect(summary.unreadNotifications).toBe(4);
    expect(summary.progress.sections).toHaveLength(1);
    expect(summary.activeEvaluations.map((item: { id: string }) => item.id)).toEqual(["assignment-1"]);
    expect(summary.upcomingEvaluations.map((item: { id: string }) => item.id)).toEqual(["assignment-2"]);
    expect(harness.facades.unread.countUnread).toHaveBeenCalledWith("student-01");
    expect(harness.facades.notes.getLatestNotes).toHaveBeenCalledWith("student-01", MY_SUMMARY_LATEST_LIMIT);
    expect(harness.facades.simulation.getUserSessions).toHaveBeenCalledWith("student-01", { page: 1, limit: MY_SUMMARY_LATEST_LIMIT, sortOrder: "desc" });
    expect(harness.facades.reservations.getUpcomingReservationsOfUser).toHaveBeenCalledWith("student-01", "STUDENT", expect.any(Date), MY_SUMMARY_LATEST_LIMIT);
  });
});
