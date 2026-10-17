/*
 * Funcionalidad: Pruebas de AnalyticsMapper
 * Descripción: Verifica que el resumen del estudiante expone el título de cada sección de progreso, el intento y el módulo de cada nota publicada, el módulo, la lección y la página tituladas de cada apunte y el título del caso de cada sesión de simulación, con null cuando falta el dato
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type MySummary } from "@/features/analytics/application/results/analytics.results";
import { type MySummaryDTO } from "@/features/analytics/presentation/dtos/analytics-response.dto";
import { AnalyticsMapper } from "@/features/analytics/presentation/mappers/analytics.mapper";
import { type LessonWeightedProgress } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";

const AT: Date = new Date("2026-10-11T15:00:00.000Z");
const PROGRESS: LessonWeightedProgress = { percentage: 50, completedLessons: 1, totalLessons: 2, completed: false };

const SUMMARY: MySummary = {
  progress: { overall: PROGRESS, sections: [{ id: "section-1", title: "Basics", ...PROGRESS }, { id: "section-2", ...PROGRESS }], levels: [], modules: [] },
  grades: [
    {
      attemptId: "attempt-1",
      evaluationId: "evaluation-1",
      evaluationTitle: "Quiz 1",
      evaluationType: "QUIZ",
      moduleId: "module-1",
      moduleTitle: "PEEP",
      userId: "student-1",
      attemptNumber: 1,
      grade: 4.2,
      passed: true,
      publishedAt: AT,
      legacy: false,
    },
    { attemptId: "attempt-2", evaluationId: "evaluation-2", evaluationTitle: "Exam", evaluationType: "EXAM", userId: "student-1", attemptNumber: 1, grade: 2, passed: false, publishedAt: AT, legacy: false },
  ],
  activeEvaluations: [],
  upcomingEvaluations: [],
  latestNotes: [
    { id: "note-1", lessonId: "lesson-1", pageId: "page-1", moduleId: "module-1", lessonTitle: "PEEP basics", pageTitle: "Recruitment", excerpt: "Alveoli", createdAt: AT, updatedAt: AT },
    { id: "note-2", lessonId: "lesson-9", excerpt: "Orphan", createdAt: AT, updatedAt: AT },
  ],
  latestConversations: [],
  latestSimulationSessions: [
    {
      id: "session-1",
      userId: "student-1",
      caseId: "case-1",
      caseTitle: "Normal lung",
      mode: "FREE",
      engineVersion: "1.0.0",
      timeMultiplier: 1,
      status: "ENDED",
      startedAt: AT,
      endedAt: AT,
      lastEventAt: AT,
      lastSimTimeMs: 1000,
      score: 80,
    },
  ],
  upcomingReservations: [],
  unreadNotifications: 0,
};

describe("AnalyticsMapper.toMySummaryDTO", () => {
  it("exposes the titles and references the student panel needs, with null when unknown", () => {
    const dto: MySummaryDTO = AnalyticsMapper.toMySummaryDTO(SUMMARY);

    expect(dto.progress.overall.title).toBeNull();
    expect(dto.progress.sections.map((section: { title: string | null }) => section.title)).toEqual(["Basics", null]);
    expect(dto.grades.map((grade: { attemptId: string; moduleId: string | null; moduleTitle: string | null }) => [grade.attemptId, grade.moduleId, grade.moduleTitle])).toEqual([
      ["attempt-1", "module-1", "PEEP"],
      ["attempt-2", null, null],
    ]);
    expect(dto.latestNotes.map((note: { moduleId: string | null; lessonTitle: string | null; pageTitle: string | null }) => [note.moduleId, note.lessonTitle, note.pageTitle])).toEqual([
      ["module-1", "PEEP basics", "Recruitment"],
      [null, null, null],
    ]);
    expect(dto.latestSimulationSessions[0].caseTitle).toBe("Normal lung");
  });
});
