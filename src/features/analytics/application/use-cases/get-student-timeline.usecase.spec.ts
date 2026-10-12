/*
 * Funcionalidad: Pruebas de GetStudentTimelineUseCase
 * Descripción: Verifica que la línea de tiempo fusiona y ordena de la más reciente a la más antigua las lecciones completadas, intentos (inicio y entrega dentro del rango), sesiones y reservas con una lectura por fuente, que usa por defecto los últimos 30 días, que rechaza un rango inválido y que un profesor fuera de alcance recibe 403 sin leer datos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type StudentTimeline } from "@/features/analytics/application/results/analytics.results";
import { type AnalyticsHarness, buildAnalyticsHarness, buildStudents, OTHER_TEACHER, TEACHER } from "@/features/analytics/application/testing/analytics-test-doubles-spec";
import { TIMELINE_LIMIT_PER_SOURCE } from "@/features/analytics/application/use-cases/get-student-timeline.usecase";
import { AnalyticsScopeForbiddenError, InvalidAnalyticsRangeError } from "@/features/analytics/domain/analytics.errors";
import { type TimelineEntry } from "@/features/analytics/domain/services/activity-timeline";

const FROM: Date = new Date("2026-10-01T00:00:00.000Z");
const TO: Date = new Date("2026-10-11T00:00:00.000Z");

describe("GetStudentTimelineUseCase", () => {
  it("merges every source newest first with one read per source", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(1));

    harness.facades.progress.getLessonCompletionsOfUser.mockResolvedValue([
      { lessonId: "lesson-1", lessonTitle: "Compliance", moduleId: "module-1", completedAt: new Date("2026-10-03T10:00:00.000Z") },
    ]);
    harness.facades.evaluation.getAttemptActivityOfUser.mockResolvedValue([
      {
        attemptId: "attempt-1",
        evaluationId: "evaluation-1",
        evaluationTitle: "Exam",
        status: "GRADED",
        startedAt: new Date("2026-09-30T23:00:00.000Z"),
        submittedAt: new Date("2026-10-02T09:00:00.000Z"),
        publishedGrade: 4.2,
      },
    ]);
    harness.facades.simulation.getSessionActivityOfUser.mockResolvedValue([
      { sessionId: "session-1", caseId: "case-1", mode: "FREE", status: "ENDED", startedAt: new Date("2026-10-05T08:00:00.000Z"), score: 80 },
    ]);
    harness.facades.reservations.getReservationActivityOfUser.mockResolvedValue([
      { reservationId: "reservation-1", holderType: "USER", startsAt: new Date("2026-10-04T08:00:00.000Z"), endsAt: new Date("2026-10-04T09:00:00.000Z"), status: "COMPLETED" },
    ]);

    const timeline: StudentTimeline = await harness.timeline.execute(TEACHER, "student-01", FROM, TO);

    expect(timeline.entries.map((entry: TimelineEntry) => [entry.kind, entry.referenceId])).toEqual([
      ["SIMULATION_SESSION", "session-1"],
      ["RESERVATION", "reservation-1"],
      ["LESSON_COMPLETED", "lesson-1"],
      ["EVALUATION_SUBMITTED", "evaluation-1"],
    ]);
    expect(timeline.entries[3]).toMatchObject({ value: 4.2, status: "GRADED" });
    expect(timeline.truncated).toBe(false);
    expect(harness.facades.progress.getLessonCompletionsOfUser).toHaveBeenCalledWith("student-01", { from: FROM, to: TO }, TIMELINE_LIMIT_PER_SOURCE);
    expect(harness.facades.reservations.getReservationActivityOfUser).toHaveBeenCalledTimes(1);
  });

  it("defaults to the last 30 days", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(1));

    const timeline: StudentTimeline = await harness.timeline.execute(TEACHER, "student-01");

    expect(timeline.to.getTime() - timeline.from.getTime()).toBe(30 * 86_400_000);
    expect(timeline.to.getTime()).toBeGreaterThanOrEqual(Date.now() - 1);
  });

  it("rejects a range that does not start before it ends", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(1));

    await expect(harness.timeline.execute(TEACHER, "student-01", TO, FROM)).rejects.toBeInstanceOf(InvalidAnalyticsRangeError);
  });

  it("rejects a teacher who manages no group of the student", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(1));

    await expect(harness.timeline.execute(OTHER_TEACHER, "student-01", FROM, TO)).rejects.toBeInstanceOf(AnalyticsScopeForbiddenError);
    expect(harness.facades.progress.getLessonCompletionsOfUser).not.toHaveBeenCalled();
  });
});
