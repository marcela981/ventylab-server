/*
 * Funcionalidad: Pruebas de GetModuleProgressSummaryUseCase
 * Descripción: Verifica las tres fuentes del resumen de un módulo: el progreso guardado cuando tiene lecciones, el cálculo en tiempo real (lecciones activas con su avance y contadores refrescados, o ceros si no hay contadores) y, para un módulo inexistente, el agregado de un módulo compuesto o un resumen vacío marcado como no encontrado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  ACCESSED_AT,
  buildProgressQueriesRepository,
  buildProgressRepository,
  lessonCompletion,
  moduleProgress,
} from "@/features/progress/application/testing/progress-test-doubles-spec";
import { GetModuleProgressSummaryUseCase } from "@/features/progress/application/use-cases/get-module-progress-summary.usecase";
import { type ModuleProgressSummary } from "@/features/progress/domain/read-models/progress-views.read-model";
import { type IProgressQueriesRepository } from "@/features/progress/domain/repositories/progress-queries.repository";
import { type IProgressRepository } from "@/features/progress/domain/repositories/progress.repository";

interface Harness {
  progress: jest.Mocked<IProgressRepository>;
  queries: jest.Mocked<IProgressQueriesRepository>;
  useCase: GetModuleProgressSummaryUseCase;
}

function buildHarness(): Harness {
  const progress: jest.Mocked<IProgressRepository> = buildProgressRepository();
  const queries: jest.Mocked<IProgressQueriesRepository> = buildProgressQueriesRepository();

  return { progress, queries, useCase: new GetModuleProgressSummaryUseCase(progress, queries) };
}

describe("GetModuleProgressSummaryUseCase", () => {
  it("answers from the stored module progress when it has lessons", async () => {
    const { progress, useCase } = buildHarness();

    progress.getModuleProgress.mockResolvedValue(
      moduleProgress("M1", { totalLessons: 4, completedLessonsCount: 4, progressPercentage: 100, isModuleCompleted: true, timeSpent: 600, completedAt: ACCESSED_AT }),
    );

    const summary: ModuleProgressSummary = await useCase.execute("U1", "M1");

    expect(summary).toEqual({
      moduleId: "M1",
      totalLessons: 4,
      completedLessons: 4,
      completionPercentage: 100,
      isModuleCompleted: true,
      timeSpent: 600,
      completedAt: ACCESSED_AT,
      lessons: [],
      source: "user_progress",
    });
    expect(progress.refreshModuleCounters).not.toHaveBeenCalled();
  });

  it("calculates in real time when nothing useful is stored", async () => {
    const { progress, queries, useCase } = buildHarness();

    progress.getModuleProgress.mockResolvedValue(moduleProgress("M1", { totalLessons: 0 }));
    progress.ensureModuleProgress.mockResolvedValue(moduleProgress("M1", { timeSpent: 120 }));
    queries.getActiveLessonIds.mockResolvedValue(["L1", "L2"]);
    progress.getLessonCompletions.mockResolvedValue([lessonCompletion("L2", { isCompleted: true })]);
    progress.refreshModuleCounters.mockResolvedValue({ status: "IN_PROGRESS", isModuleCompleted: false, completedLessonsCount: 1, totalLessons: 2, progressPercentage: 50 });

    const summary: ModuleProgressSummary = await useCase.execute("U1", "M1");

    expect(summary).toMatchObject({ totalLessons: 2, completedLessons: 1, completionPercentage: 50, isModuleCompleted: false, timeSpent: 120, source: "realtime_calculation" });
    expect(summary.lessons.map((lesson: ModuleProgressSummary["lessons"][number]): [string, boolean] => [lesson.lessonId, lesson.completed])).toEqual([
      ["L1", false],
      ["L2", true],
    ]);
  });

  it("falls back to zero counters when the module counters cannot be refreshed", async () => {
    const { useCase } = buildHarness();

    const summary: ModuleProgressSummary = await useCase.execute("U1", "M1");

    expect(summary).toMatchObject({ totalLessons: 0, completedLessons: 0, completionPercentage: 0, isModuleCompleted: false, source: "realtime_calculation" });
  });

  it("aggregates the sub-modules of a composite module that is not an active module", async () => {
    const { progress, queries, useCase } = buildHarness();

    queries.isActiveModule.mockResolvedValue(false);
    progress.getModuleProgresses.mockResolvedValue([moduleProgress("module-01-inversion-fisiologica", { isModuleCompleted: true, timeSpent: 50 })]);

    const summary: ModuleProgressSummary = await useCase.execute("U1", "respiratory-physiology");

    expect(progress.getModuleProgresses).toHaveBeenCalledWith("U1", ["module-01-inversion-fisiologica", "module-02-ecuacion-movimiento", "module-03-variables-fase"]);
    expect(summary).toMatchObject({ moduleId: "respiratory-physiology", totalLessons: 3, completedLessons: 1, completionPercentage: 33, timeSpent: 50, source: "composite_aggregate" });
  });

  it("returns an empty not-found summary for an unknown module", async () => {
    const { queries, useCase } = buildHarness();

    queries.isActiveModule.mockResolvedValue(false);

    const summary: ModuleProgressSummary = await useCase.execute("U1", "ghost");

    expect(summary).toEqual({ moduleId: "ghost", totalLessons: 0, completedLessons: 0, completionPercentage: 0, isModuleCompleted: false, timeSpent: 0, lessons: [], source: "not_found" });
  });
});
