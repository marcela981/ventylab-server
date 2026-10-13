/*
 * Funcionalidad: Pruebas de los módulos compuestos
 * Descripción: Verifica la resolución de los submódulos de un módulo compuesto y el resumen agregado: submódulos completados al 100 %, avance por lecciones (completadas, en curso acotadas al 99 %, sin pasos), porcentaje guardado cuando el submódulo no tiene lecciones activas, tiempo total y fecha de finalización solo cuando todos están completos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type LessonCompletionSnapshot,
  type ModuleLessonSource,
  type ModuleProgressSnapshot,
} from "@/features/progress/domain/read-models/progress-records.read-model";
import { type ModuleProgressSummary } from "@/features/progress/domain/read-models/progress-views.read-model";
import { computeCompositeModuleSummary, getCompositeSubModuleIds } from "@/features/progress/domain/services/composite-modules";

const DONE_AT: Date = new Date("2026-10-01T09:00:00.000Z");

function progress(moduleId: string, overrides: Partial<ModuleProgressSnapshot> = {}): ModuleProgressSnapshot {
  return {
    moduleId,
    status: "IN_PROGRESS",
    isModuleCompleted: false,
    completedLessonsCount: 0,
    totalLessons: 1,
    progressPercentage: 0,
    timeSpent: 60,
    lastAccessedAt: DONE_AT,
    ...overrides,
  };
}

function completion(lessonId: string, overrides: Partial<LessonCompletionSnapshot> = {}): LessonCompletionSnapshot {
  return { lessonId, currentStepIndex: 0, totalSteps: 4, timeSpent: 10, isCompleted: false, updatedAt: DONE_AT, ...overrides };
}

describe("composite modules", () => {
  it("resolves the sub-modules of a composite module and nothing for a regular one", () => {
    expect(getCompositeSubModuleIds("respiratory-physiology")).toEqual(["module-01-inversion-fisiologica", "module-02-ecuacion-movimiento", "module-03-variables-fase"]);
    expect(getCompositeSubModuleIds("module-01-inversion-fisiologica")).toBeUndefined();
  });

  it("averages completed, lesson-based and stored sub-module progress", () => {
    const lessons: ModuleLessonSource[] = [
      { id: "B1", moduleId: "B" },
      { id: "B2", moduleId: "B" },
      { id: "B3", moduleId: "B" },
      { id: "B4", moduleId: "B" },
    ];

    const summary: ModuleProgressSummary = computeCompositeModuleSummary({
      moduleId: "composite",
      subModuleIds: ["A", "B", "C", "D"],
      progresses: [progress("A", { isModuleCompleted: true, completedAt: DONE_AT }), progress("B"), progress("C", { progressPercentage: 40 })],
      lessons,
      completions: [
        completion("B1", { isCompleted: true }),
        completion("B2", { currentStepIndex: 1, totalSteps: 4 }),
        completion("B3", { currentStepIndex: 3, totalSteps: 4 }),
        completion("B4", { totalSteps: 0 }),
      ],
    });

    expect(summary).toEqual({
      moduleId: "composite",
      totalLessons: 4,
      completedLessons: 1,
      completionPercentage: Math.round((100 + (100 + 50 + 99 + 0) / 4 + 40 + 0) / 4),
      isModuleCompleted: false,
      timeSpent: 180,
      completedAt: undefined,
      lessons: [],
      source: "composite_aggregate",
    });
  });

  it("is completed with the first completion date when every sub-module is completed", () => {
    const summary: ModuleProgressSummary = computeCompositeModuleSummary({
      moduleId: "composite",
      subModuleIds: ["A", "B"],
      progresses: [progress("A", { isModuleCompleted: true }), progress("B", { isModuleCompleted: true, completedAt: DONE_AT })],
      lessons: [],
      completions: [],
    });

    expect([summary.isModuleCompleted, summary.completionPercentage, summary.completedAt]).toEqual([true, 100, DONE_AT]);
  });

  it("reports zero for a composite without sub-modules", () => {
    const summary: ModuleProgressSummary = computeCompositeModuleSummary({ moduleId: "composite", subModuleIds: [], progresses: [], lessons: [], completions: [] });

    expect([summary.isModuleCompleted, summary.completionPercentage]).toEqual([false, 0]);
  });
});
