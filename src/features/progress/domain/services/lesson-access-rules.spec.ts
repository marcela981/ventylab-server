/*
 * Funcionalidad: Pruebas de las reglas de acceso secuencial a lecciones
 * Descripción: Verifica que solo bloquean las lecciones anteriores publicadas con páginas y sin completar (las vacías y las que no tienen hechos se saltan, un registro histórico cuenta como completada) y que la decisión prioriza el módulo bloqueado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { type SequenceLesson } from "@/features/progress/domain/read-models/lesson-access.read-model";
import { decideLessonAccess, findMissingPreviousLessons } from "@/features/progress/domain/services/lesson-access-rules";

function fact(lessonId: string, overrides: Partial<LessonCompletionFact> = {}): LessonCompletionFact {
  return { lessonId, moduleId: "M1", publishedPageCount: 2, viewedPageCount: 0, hasCompletionRecord: false, ...overrides };
}

const LESSONS: SequenceLesson[] = [
  { lessonId: "L1", title: "Empty" },
  { lessonId: "L2", title: "Done" },
  { lessonId: "L3", title: "Recorded" },
  { lessonId: "L4", title: "Pending" },
  { lessonId: "L5", title: "No facts" },
];

describe("lesson access rules", () => {
  it("keeps only previous lessons with published pages that are not completed", () => {
    const facts: LessonCompletionFact[] = [
      fact("L1", { publishedPageCount: 0 }),
      fact("L2", { viewedPageCount: 2 }),
      fact("L3", { hasCompletionRecord: true }),
      fact("L4", { viewedPageCount: 1 }),
    ];

    expect(findMissingPreviousLessons(LESSONS, facts)).toEqual([{ lessonId: "L4", title: "Pending" }]);
  });

  it("decides module_locked first, then previous_lesson_incomplete, otherwise allowed", () => {
    const missing: SequenceLesson[] = [{ lessonId: "L4", title: "Pending" }];

    expect(decideLessonAccess(false, missing)).toEqual({ allowed: false, reason: "module_locked", missing: [] });
    expect(decideLessonAccess(true, missing)).toEqual({ allowed: false, reason: "previous_lesson_incomplete", missing });
    expect(decideLessonAccess(true, [])).toEqual({ allowed: true, missing: [] });
  });
});
