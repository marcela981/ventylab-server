/*
 * Funcionalidad: Pruebas de GetGroupDashboardUseCase
 * Descripción: Verifica con fachadas falsas que el panel de un grupo de 30 estudiantes llama exactamente una vez a cada función por lotes (sin N+1) con los 30 identificadores y una vez a los miembros, que reutiliza la caché del mismo solicitante, que combina una fila por estudiante (nota vigente = último intento publicado, porcentaje de útiles), que las notas de un profesor se leen con el alcance de intentos de sus grupos (el administrador sin alcance) y que aplica el alcance con una sola lectura de grupos gestionables (403 fuera de alcance, 404 grupo inexistente)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GroupDashboard, type StudentDashboardRow } from "@/features/analytics/application/results/analytics.results";
import {
  ADMIN,
  type AnalyticsHarness,
  batchMocks,
  buildAnalyticsHarness,
  buildStudents,
  GROUP_ID,
  OTHER_TEACHER,
  TEACHER,
} from "@/features/analytics/application/testing/analytics-test-doubles-spec";
import { AnalyticsGroupNotFoundError, AnalyticsScopeForbiddenError } from "@/features/analytics/domain/analytics.errors";
import { type GroupMemberSummary } from "@/features/groups/application/services/groups.facade";

describe("GetGroupDashboardUseCase", () => {
  it("calls each facade batch method exactly once for a 30-student group", async () => {
    const students: GroupMemberSummary[] = buildStudents(30);
    const harness: AnalyticsHarness = buildAnalyticsHarness(students);
    const studentIds: string[] = students.map((student: GroupMemberSummary) => student.userId);

    const dashboard: GroupDashboard = await harness.dashboard.execute(TEACHER, GROUP_ID);

    expect(dashboard.students).toHaveLength(30);
    expect(harness.facades.groups.getGroupMembers).toHaveBeenCalledTimes(1);

    for (const batch of batchMocks(harness.facades)) {
      expect(batch).toHaveBeenCalledTimes(1);
      expect(batch.mock.calls[0][0]).toEqual(studentIds);
    }
  });

  it("keeps the number of batch calls independent of the group size", async () => {
    const small: AnalyticsHarness = buildAnalyticsHarness(buildStudents(2));
    const large: AnalyticsHarness = buildAnalyticsHarness(buildStudents(30));

    await small.dashboard.execute(ADMIN, GROUP_ID);
    await large.dashboard.execute(ADMIN, GROUP_ID);

    const calls = (harness: AnalyticsHarness): number[] => batchMocks(harness.facades).map((batch: jest.Mock) => batch.mock.calls.length);

    expect(calls(large)).toEqual(calls(small));
  });

  it("serves a second request of the same requester from the cache while still checking the scope", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(3));

    const first: GroupDashboard = await harness.dashboard.execute(TEACHER, GROUP_ID);
    const second: GroupDashboard = await harness.dashboard.execute(TEACHER, GROUP_ID);

    expect(second).toBe(first);
    expect(harness.facades.progress.getProgressForUsers).toHaveBeenCalledTimes(1);
    expect(harness.facades.groups.getManageableStudentGroupIds).toHaveBeenCalledTimes(2);
    expect(harness.facades.groups.getGroupSummary).toHaveBeenCalledTimes(2);
  });

  it("limits a teacher's grades to the attempt scope of the managed groups and leaves the admin unscoped", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(2));

    await harness.dashboard.execute(TEACHER, GROUP_ID);
    await harness.dashboard.execute(ADMIN, GROUP_ID);

    expect(harness.facades.evaluation.getGradesForUsers.mock.calls[0][2]).toEqual({ teacherId: TEACHER.id, groupIds: [GROUP_ID] });
    expect(harness.facades.evaluation.getGradesForUsers.mock.calls[1][2]).toBeUndefined();
  });

  it("builds one row per student with the counted grade, simulation and AI usage", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(1));

    const dashboard: GroupDashboard = await harness.dashboard.execute(ADMIN, GROUP_ID);
    const row: StudentDashboardRow = dashboard.students[0];

    expect(dashboard).toMatchObject({ groupId: GROUP_ID, groupName: "Group A" });
    expect(row).toMatchObject({
      userId: "student-01",
      name: "Student Name 1",
      grades: { averageGrade: 4, evaluations: [expect.objectContaining({ evaluationId: "evaluation-1", attemptNumber: 2, grade: 4, passed: true })] },
      simulation: { sessionCount: 2, averageScore: 81.23, averageTimeToStabilizeSeconds: 120.1 },
      aiUsage: [{ useCase: "FREE_CHAT", calls: 3, inputTokens: 30, outputTokens: 10, ratings: 3, helpfulRate: 66.7 }],
      ventilatorHours: 1.25,
    });
    expect(row.progress.sections).toEqual([{ id: "section-1", percentage: 50, completedLessons: 2, totalLessons: 4, completed: false }]);
    expect(row.progress.levels).toHaveLength(1);
    expect(row.progress.modules).toHaveLength(1);
  });

  it("rejects a teacher outside the group scope without loading any data", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(3));

    await expect(harness.dashboard.execute(OTHER_TEACHER, GROUP_ID)).rejects.toBeInstanceOf(AnalyticsScopeForbiddenError);
    expect(harness.facades.groups.getGroupMembers).not.toHaveBeenCalled();
  });

  it("answers not found for a missing group", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(3));

    await expect(harness.dashboard.execute(ADMIN, "missing-group")).rejects.toBeInstanceOf(AnalyticsGroupNotFoundError);
  });
});
