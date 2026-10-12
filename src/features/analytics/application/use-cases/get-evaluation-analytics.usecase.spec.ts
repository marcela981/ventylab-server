/*
 * Funcionalidad: Pruebas de GetEvaluationAnalyticsUseCase y GetMySummaryUseCase
 * Descripción: Verifica que las estadísticas de una evaluación solo se entregan al administrador o a un profesor que gestiona un grupo asignado (403 si no, 404 si no existe), que combinan notas y dificultad por pregunta con caché por solicitante, y que el resumen propio compone las fachadas para el usuario autenticado con el conteo de notificaciones sin leer del puerto y las evaluaciones separadas en activas y próximas
 * Versión: 1.0
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
  OTHER_TEACHER,
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
