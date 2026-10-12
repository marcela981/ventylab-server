/*
 * Funcionalidad: Pruebas de GetStudentTimelineUseCase
 * Descripción: Verifica que la línea de tiempo fusiona y ordena de la más reciente a la más antigua las lecciones completadas, intentos (inicio y entrega dentro del rango), sesiones y reservas con una lectura por fuente, que usa por defecto los últimos 30 días, que rechaza un rango inválido, que un profesor fuera de alcance o ante un usuario que no es estudiante de sus grupos recibe 403 sin leer datos, que los intentos se leen con el alcance de intentos del profesor y que marca truncated cuando una fuente alcanza su límite
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type StudentTimeline } from "@/features/analytics/application/results/analytics.results";
import { ADMIN, type AnalyticsHarness, buildAnalyticsHarness, buildStudents, GROUP_ID, OTHER_TEACHER, TEACHER } from "@/features/analytics/application/testing/analytics-test-doubles-spec";
import { TIMELINE_LIMIT_PER_SOURCE } from "@/features/analytics/application/use-cases/get-student-timeline.usecase";
import { AnalyticsScopeForbiddenError, InvalidAnalyticsRangeError } from "@/features/analytics/domain/analytics.errors";
import { type TimelineEntry } from "@/features/analytics/domain/services/activity-timeline";
import { type SimulationSessionActivityView } from "@/features/simulation/domain/repositories/simulation-analytics.repository";

const FROM: Date = new Date("2026-10-01T00:00:00.000Z");
const TO: Date = new Date("2026-10-11T00:00:00.000Z");

function sessions(count: number): SimulationSessionActivityView[] {
  return Array.from(
    { length: count },
    (_value: unknown, index: number): SimulationSessionActivityView => ({
      sessionId: `session-${index}`,
      caseId: "case-1",
      mode: "FREE",
      status: "ENDED",
      startedAt: new Date(FROM.getTime() + index * 60_000),
    }),
  );
}

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
    expect(harness.facades.progress.getLessonCompletionsOfUser).toHaveBeenCalledWith("student-01", { from: FROM, to: TO }, TIMELINE_LIMIT_PER_SOURCE + 1);
    expect(harness.facades.evaluation.getAttemptActivityOfUser).toHaveBeenCalledWith(
      "student-01",
      { from: FROM, to: TO },
      TIMELINE_LIMIT_PER_SOURCE + 1,
      { teacherId: TEACHER.id, groupIds: [GROUP_ID] },
    );
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

  it("rejects a teacher when the target is not a student of the teacher's groups", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(1));

    await expect(harness.timeline.execute(TEACHER, "teacher-3", FROM, TO)).rejects.toBeInstanceOf(AnalyticsScopeForbiddenError);
    expect(harness.facades.groups.isStudentMemberOfAny).toHaveBeenCalledWith("teacher-3", [GROUP_ID]);
    expect(harness.facades.evaluation.getAttemptActivityOfUser).not.toHaveBeenCalled();
  });

  it("reports truncation when one source reaches its limit and keeps at most the limit from it", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(1));

    harness.facades.simulation.getSessionActivityOfUser.mockResolvedValue(sessions(TIMELINE_LIMIT_PER_SOURCE + 1));

    const timeline: StudentTimeline = await harness.timeline.execute(ADMIN, "student-01", FROM, TO);

    expect(timeline.truncated).toBe(true);
    expect(timeline.entries).toHaveLength(TIMELINE_LIMIT_PER_SOURCE);
    expect(harness.facades.evaluation.getAttemptActivityOfUser.mock.calls[0][3]).toBeUndefined();
  });

  it("does not report truncation when every source stays within its limit", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(1));

    harness.facades.simulation.getSessionActivityOfUser.mockResolvedValue(sessions(TIMELINE_LIMIT_PER_SOURCE));

    const timeline: StudentTimeline = await harness.timeline.execute(ADMIN, "student-01", FROM, TO);

    expect(timeline.truncated).toBe(false);
    expect(timeline.entries).toHaveLength(TIMELINE_LIMIT_PER_SOURCE);
  });
});
