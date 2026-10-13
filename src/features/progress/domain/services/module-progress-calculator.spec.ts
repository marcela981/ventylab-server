/*
 * Funcionalidad: Pruebas del cálculo de progreso de módulo
 * Descripción: Verifica los contadores y el estado de un módulo según las lecciones completadas, el porcentaje por pasos de una lección, la fracción en curso acotada al 99 %, la escritura de puntaje (mejor y último) y la vista de progreso de una lección con y sin registro
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LessonCompletionSnapshot } from "@/features/progress/domain/read-models/progress-records.read-model";
import {
  buildScoreWrite,
  computeInProgressFraction,
  computeModuleCounters,
  computeStepPercentage,
  MAX_IN_PROGRESS_FRACTION,
  toLessonProgressView,
} from "@/features/progress/domain/services/module-progress-calculator";

const ACCESSED: Date = new Date("2026-10-10T12:00:00.000Z");

function completion(overrides: Partial<LessonCompletionSnapshot> = {}): LessonCompletionSnapshot {
  return { lessonId: "L1", currentStepIndex: 1, totalSteps: 4, timeSpent: 90, lastAccessed: ACCESSED, isCompleted: false, updatedAt: ACCESSED, ...overrides };
}

describe("module progress calculator", () => {
  it.each<[number, number, string, boolean, number]>([
    [0, 4, "NOT_STARTED", false, 0],
    [1, 4, "IN_PROGRESS", false, 25],
    [4, 4, "COMPLETED", true, 100],
    [0, 0, "NOT_STARTED", false, 0],
  ])("derives %i of %i lessons as %s", (completed: number, total: number, status: string, isModuleCompleted: boolean, percentage: number) => {
    expect(computeModuleCounters(completed, total)).toEqual({ status, isModuleCompleted, completedLessonsCount: completed, totalLessons: total, progressPercentage: percentage });
  });

  it("computes the step percentage, 100 when completed and 0 without steps", () => {
    expect(computeStepPercentage(1, 3, false)).toBe(66);
    expect(computeStepPercentage(0, 3, true)).toBe(100);
    expect(computeStepPercentage(0, 0, false)).toBe(0);
  });

  it("caps the in-progress fraction below a full lesson and ignores completed or empty lessons", () => {
    expect(computeInProgressFraction(completion({ currentStepIndex: 1, totalSteps: 4 }))).toBe(0.5);
    expect(computeInProgressFraction(completion({ currentStepIndex: 3, totalSteps: 4 }))).toBe(MAX_IN_PROGRESS_FRACTION);
    expect(computeInProgressFraction(completion({ isCompleted: true }))).toBe(0);
    expect(computeInProgressFraction(completion({ totalSteps: 0 }))).toBe(0);
    expect(computeInProgressFraction(undefined)).toBe(0);
  });

  it("keeps the best quiz score and always records the last one", () => {
    expect(buildScoreWrite(undefined, 80)).toBeUndefined();
    expect(buildScoreWrite(60, 80)).toEqual({ best: 80, last: 60 });
    expect(buildScoreWrite(90, 80)).toEqual({ best: 90, last: 90 });
    expect(buildScoreWrite(40, undefined)).toEqual({ best: 40, last: 40 });
  });

  it("renders an untouched lesson as not started", () => {
    expect(toLessonProgressView("L9", undefined)).toEqual({ lessonId: "L9", completed: false, timeSpent: 0, completionPercentage: 0, currentStep: 0, totalSteps: 0 });
  });

  it("renders a stored lesson with one-based current step", () => {
    expect(toLessonProgressView("L1", completion())).toEqual({
      lessonId: "L1",
      completed: false,
      timeSpent: 90,
      lastAccessed: ACCESSED,
      completionPercentage: 50,
      currentStep: 2,
      totalSteps: 4,
    });
  });
});
