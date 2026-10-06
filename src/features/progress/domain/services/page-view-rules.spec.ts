/*
 * Funcionalidad: Pruebas de las reglas de vista de página
 * Descripción: Verifica la decisión idempotente de una vista de página (completedAt solo en la primera vista) y cuándo una vista completa la lección (última página vista, sin páginas o ya completada)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { type PageViewWrite } from "@/features/progress/domain/read-models/learning-progress.read-model";
import { decidePageView, shouldRecordLessonCompletion } from "@/features/progress/domain/services/page-view-rules";

const FIRST_VIEW: Date = new Date("2026-10-01T10:00:00.000Z");
const NOW: Date = new Date("2026-10-05T10:00:00.000Z");

function fact(overrides: Partial<LessonCompletionFact>): LessonCompletionFact {
  return { lessonId: "L1", moduleId: "M1", publishedPageCount: 3, viewedPageCount: 0, hasCompletionRecord: false, ...overrides };
}

describe("decidePageView", () => {
  it("stamps completedAt on the first view", () => {
    const write: PageViewWrite = decidePageView(undefined, NOW);

    expect(write).toEqual({ lastVisitedAt: NOW, completedAt: NOW });
  });

  it("does not reset completedAt on a repeated view", () => {
    const write: PageViewWrite = decidePageView({ pageId: "P1", completed: true, firstViewedAt: FIRST_VIEW, lastVisitedAt: FIRST_VIEW }, NOW);

    expect(write).toEqual({ lastVisitedAt: NOW });
  });

  it("fills a missing completedAt on a legacy row without moving an existing one", () => {
    const legacyWithoutDate: PageViewWrite = decidePageView({ pageId: "P1", completed: false }, NOW);
    const legacyWithDate: PageViewWrite = decidePageView({ pageId: "P1", completed: false, firstViewedAt: FIRST_VIEW }, NOW);

    expect(legacyWithoutDate).toEqual({ lastVisitedAt: NOW, completedAt: NOW });
    expect(legacyWithDate).toEqual({ lastVisitedAt: NOW, completedAt: FIRST_VIEW });
  });
});

describe("shouldRecordLessonCompletion", () => {
  it("records the completion when the last published page is viewed", () => {
    const beforeLastPage: boolean = shouldRecordLessonCompletion(fact({ viewedPageCount: 2 }));
    const afterLastPage: boolean = shouldRecordLessonCompletion(fact({ viewedPageCount: 3 }));

    expect([beforeLastPage, afterLastPage]).toEqual([false, true]);
  });

  it("never records a completion for a lesson with zero published pages", () => {
    const decision: boolean = shouldRecordLessonCompletion(fact({ publishedPageCount: 0, viewedPageCount: 0 }));

    expect(decision).toBe(false);
  });

  it("does not rewrite a lesson that is already completed", () => {
    const decision: boolean = shouldRecordLessonCompletion(fact({ viewedPageCount: 3, hasCompletionRecord: true }));

    expect(decision).toBe(false);
  });

  it("ignores pages that do not belong to a published lesson", () => {
    const decision: boolean = shouldRecordLessonCompletion(undefined);

    expect(decision).toBe(false);
  });
});
