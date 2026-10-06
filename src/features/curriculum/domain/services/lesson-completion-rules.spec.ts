/*
 * Funcionalidad: Pruebas de las reglas de completitud por páginas
 * Descripción: Verifica la regla de lección completada (todas las páginas publicadas vistas, lecciones sin páginas no completables, registros históricos nunca degradados), el progreso ponderado por lecciones y los módulos completados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import {
  completedModuleIdsOf,
  computeLessonWeightedProgress,
  isCompletableByPages,
  isLessonCompleted,
} from "@/features/curriculum/domain/services/lesson-completion-rules";

function fact(overrides: Partial<LessonCompletionFact>): LessonCompletionFact {
  return { lessonId: "L1", moduleId: "M1", publishedPageCount: 3, viewedPageCount: 0, hasCompletionRecord: false, ...overrides };
}

describe("lesson completion rules", () => {
  it("completes a lesson only when every published page was viewed", () => {
    const partial: LessonCompletionFact = fact({ viewedPageCount: 2 });
    const full: LessonCompletionFact = fact({ viewedPageCount: 3 });

    const results: boolean[] = [isLessonCompleted(partial), isLessonCompleted(full)];

    expect(results).toEqual([false, true]);
  });

  it("does not complete a lesson with zero published pages by pages", () => {
    const empty: LessonCompletionFact = fact({ publishedPageCount: 0, viewedPageCount: 0 });

    const completed: boolean = isLessonCompleted(empty);

    expect(isCompletableByPages(empty)).toBe(false);
    expect(completed).toBe(false);
  });

  it("never downgrades an existing completion record", () => {
    const historical: LessonCompletionFact = fact({ publishedPageCount: 5, viewedPageCount: 1, hasCompletionRecord: true });
    const historicalWithoutPages: LessonCompletionFact = fact({ publishedPageCount: 0, hasCompletionRecord: true });

    const results: boolean[] = [isLessonCompleted(historical), isLessonCompleted(historicalWithoutPages)];

    expect(results).toEqual([true, true]);
  });

  it("rounds lesson-weighted percentages down and completes only at 100%", () => {
    const almost: ReturnType<typeof computeLessonWeightedProgress> = computeLessonWeightedProgress(199, 200);
    const empty: ReturnType<typeof computeLessonWeightedProgress> = computeLessonWeightedProgress(0, 0);

    expect(almost).toEqual({ completedLessons: 199, totalLessons: 200, percentage: 99, completed: false });
    expect(empty).toEqual({ completedLessons: 0, totalLessons: 0, percentage: 0, completed: false });
  });

  it("lists modules whose published lessons are all completed", () => {
    const facts: LessonCompletionFact[] = [
      fact({ lessonId: "A1", moduleId: "A", viewedPageCount: 3 }),
      fact({ lessonId: "A2", moduleId: "A", hasCompletionRecord: true }),
      fact({ lessonId: "B1", moduleId: "B", viewedPageCount: 3 }),
      fact({ lessonId: "B2", moduleId: "B", viewedPageCount: 1 }),
    ];

    const completed: string[] = completedModuleIdsOf(facts);

    expect(completed).toEqual(["A"]);
  });
});
