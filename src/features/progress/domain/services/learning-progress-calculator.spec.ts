/*
 * Funcionalidad: Pruebas de la calculadora de progreso ponderado por lecciones
 * Descripción: Verifica el progreso de módulo, nivel y sección ponderado por lecciones (distinto del promedio de módulos), lecciones sin páginas, registros históricos y el desbloqueo por prerrequisitos de nivel y de módulo con la misma regla de completitud
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ComputeCurriculumUnlockUseCase } from "@/features/curriculum/application/use-cases/compute-curriculum-unlock.usecase";
import { type CurriculumUnlockSource, type CurriculumUnlockState } from "@/features/curriculum/domain/read-models/curriculum-tree.read-model";
import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { completedModuleIdsOf } from "@/features/curriculum/domain/services/lesson-completion-rules";
import {
  type LearningProgressReport,
  type LevelLearningProgress,
  type ModuleLearningProgress,
  type ProgressStructure,
} from "@/features/progress/domain/read-models/learning-progress.read-model";
import { buildLearningProgressReport } from "@/features/progress/domain/services/learning-progress-calculator";

function lesson(lessonId: string, moduleId: string, overrides: Partial<LessonCompletionFact> = {}): LessonCompletionFact {
  return { lessonId, moduleId, publishedPageCount: 2, viewedPageCount: 0, hasCompletionRecord: false, ...overrides };
}

const STRUCTURE: ProgressStructure = {
  sections: [{ id: "S1", levelIds: ["LV1", "LV2"] }],
  levels: [
    { id: "LV1", sectionId: "S1", moduleIds: ["M1", "M2"] },
    { id: "LV2", sectionId: "S1", moduleIds: ["M3"] },
  ],
  modules: [
    { id: "M1", levelId: "LV1" },
    { id: "M2", levelId: "LV1" },
    { id: "M3", levelId: "LV2" },
  ],
};

const FACTS: LessonCompletionFact[] = [
  lesson("M1-L1", "M1", { viewedPageCount: 2 }),
  lesson("M2-L1", "M2"),
  lesson("M2-L2", "M2"),
  lesson("M2-L3", "M2", { viewedPageCount: 1 }),
  lesson("M3-L1", "M3", { hasCompletionRecord: true }),
  lesson("M3-L2", "M3", { publishedPageCount: 0 }),
];

describe("buildLearningProgressReport", () => {
  it("computes module progress as completed lessons over lessons", () => {
    const report: LearningProgressReport = buildLearningProgressReport(STRUCTURE, FACTS);

    const [m1, m2, m3]: ModuleLearningProgress[] = report.modules;

    expect([m1.percentage, m1.completed]).toEqual([100, true]);
    expect([m2.completedLessons, m2.totalLessons, m2.percentage]).toEqual([0, 3, 0]);
    expect(m2.lessons[2]).toEqual({ lessonId: "M2-L3", moduleId: "M2", viewedPages: 1, totalPages: 2, completedByPages: false, completed: false });
    expect([m3.completedLessons, m3.totalLessons, m3.percentage]).toEqual([1, 2, 50]);
  });

  it("weights level progress by lessons instead of averaging module percentages", () => {
    const report: LearningProgressReport = buildLearningProgressReport(STRUCTURE, FACTS);
    const level: LevelLearningProgress = report.levels[0];
    const averageOfModules: number = Math.floor((report.modules[0].percentage + report.modules[1].percentage) / 2);

    expect(averageOfModules).toBe(50);
    expect([level.completedLessons, level.totalLessons, level.percentage]).toEqual([1, 4, 25]);
    expect([level.completedModules, level.totalModules, level.completed]).toEqual([1, 2, false]);
  });

  it("weights section and overall progress by lessons", () => {
    const report: LearningProgressReport = buildLearningProgressReport(STRUCTURE, FACTS);

    expect([report.sections[0].completedLessons, report.sections[0].totalLessons, report.sections[0].percentage]).toEqual([2, 6, 33]);
    expect([report.sections[0].completedLevels, report.sections[0].totalLevels]).toEqual([0, 2]);
    expect(report.overall).toEqual({ completedLessons: 2, totalLessons: 6, percentage: 33, completed: false });
  });

  it("keeps lessons without published pages incomplete unless they were completed before", () => {
    const report: LearningProgressReport = buildLearningProgressReport(STRUCTURE, FACTS);

    const lessons: ModuleLearningProgress["lessons"] = report.modules[2].lessons;

    expect(lessons.map((item: ModuleLearningProgress["lessons"][number]) => [item.lessonId, item.completed])).toEqual([
      ["M3-L1", true],
      ["M3-L2", false],
    ]);
  });

  it("reports a module without published lessons at 0% and not completed", () => {
    const report: LearningProgressReport = buildLearningProgressReport({ sections: [], levels: [], modules: [{ id: "EMPTY" }] }, []);

    expect(report.modules[0]).toEqual({ moduleId: "EMPTY", levelId: undefined, completedLessons: 0, totalLessons: 0, percentage: 0, completed: false, lessons: [] });
  });
});

describe("unlock with page-based completion", () => {
  const unlockSource = (facts: LessonCompletionFact[]): CurriculumUnlockSource => ({
    levels: [
      { id: "LV1", title: "Basics", moduleIds: ["M1", "M2"] },
      { id: "LV2", title: "Advanced", moduleIds: ["M3"] },
    ],
    modules: [
      { id: "M1", title: "Intro", levelId: "LV1" },
      { id: "M2", title: "Equation", levelId: "LV1" },
      { id: "M3", title: "Modes", levelId: "LV2" },
    ],
    levelEdges: [{ nodeId: "LV2", prerequisiteId: "LV1" }],
    moduleEdges: [{ nodeId: "M2", prerequisiteId: "M1" }],
    completedModuleIds: completedModuleIdsOf(facts),
  });

  it("unlocks a module once its prerequisite module has all pages viewed", () => {
    const before: CurriculumUnlockState = ComputeCurriculumUnlockUseCase.compute(unlockSource([lesson("M1-L1", "M1", { viewedPageCount: 1 })]));
    const after: CurriculumUnlockState = ComputeCurriculumUnlockUseCase.compute(unlockSource([lesson("M1-L1", "M1", { viewedPageCount: 2 })]));

    expect(before.modules.get("M2")?.locked).toBe(true);
    expect(after.modules.get("M2")?.locked).toBe(false);
  });

  it("unlocks a level once every module of its prerequisite level is completed", () => {
    const partial: LessonCompletionFact[] = [lesson("M1-L1", "M1", { viewedPageCount: 2 }), lesson("M2-L1", "M2")];
    const complete: LessonCompletionFact[] = [lesson("M1-L1", "M1", { viewedPageCount: 2 }), lesson("M2-L1", "M2", { hasCompletionRecord: true })];

    const before: CurriculumUnlockState = ComputeCurriculumUnlockUseCase.compute(unlockSource(partial));
    const after: CurriculumUnlockState = ComputeCurriculumUnlockUseCase.compute(unlockSource(complete));

    expect(before.levels.get("LV2")).toEqual({ locked: true, missingPrerequisites: [{ id: "LV1", title: "Basics" }] });
    expect(after.levels.get("LV2")).toEqual({ locked: false, missingPrerequisites: [] });
    expect(after.modules.get("M3")?.locked).toBe(false);
  });
});
