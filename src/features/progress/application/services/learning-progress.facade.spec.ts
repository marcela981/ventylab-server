/*
 * Funcionalidad: Pruebas de LearningProgressFacade (lecturas por lotes)
 * Descripción: Verifica que el progreso de varios usuarios sale de una sola llamada al repositorio de analítica y se calcula por usuario con el mismo motor de progreso ponderado por lecciones, y que las lecciones completadas en un rango se piden con sus límites
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { LearningProgressFacade, type UserLearningProgress } from "@/features/progress/application/services/learning-progress.facade";
import { type CheckContentUnlockedUseCase } from "@/features/progress/application/use-cases/check-content-unlocked.usecase";
import { type GetLearningProgressSummaryUseCase } from "@/features/progress/application/use-cases/get-learning-progress-summary.usecase";
import { type GetLevelLearningProgressUseCase } from "@/features/progress/application/use-cases/get-level-learning-progress.usecase";
import { type GetModuleLearningProgressUseCase } from "@/features/progress/application/use-cases/get-module-learning-progress.usecase";
import { type GetSectionLearningProgressUseCase } from "@/features/progress/application/use-cases/get-section-learning-progress.usecase";
import { type IProgressAnalyticsRepository } from "@/features/progress/domain/repositories/progress-analytics.repository";

describe("LearningProgressFacade batch reads", () => {
  it("computes the report of every user from one repository call", async () => {
    const repository: jest.Mocked<IProgressAnalyticsRepository> = {
      getProgressSourceForUsers: jest.fn().mockResolvedValue({
        structure: { sections: [{ id: "section-1", levelIds: ["level-1"] }], levels: [{ id: "level-1", sectionId: "section-1", moduleIds: ["module-1"] }], modules: [{ id: "module-1", levelId: "level-1" }] },
        factsByUser: new Map([
          ["student-1", [{ lessonId: "lesson-1", moduleId: "module-1", levelId: "level-1", sectionId: "section-1", publishedPageCount: 1, viewedPageCount: 1, hasCompletionRecord: false }]],
          ["student-2", [{ lessonId: "lesson-1", moduleId: "module-1", levelId: "level-1", sectionId: "section-1", publishedPageCount: 1, viewedPageCount: 0, hasCompletionRecord: false }]],
        ]),
      }),
      getLessonCompletionsOfUser: jest.fn().mockResolvedValue([]),
    };
    const facade: LearningProgressFacade = new LearningProgressFacade(
      {} as GetModuleLearningProgressUseCase,
      {} as GetLevelLearningProgressUseCase,
      {} as GetSectionLearningProgressUseCase,
      {} as GetLearningProgressSummaryUseCase,
      {} as CheckContentUnlockedUseCase,
      repository,
    );
    const range: { from: Date; to: Date } = { from: new Date("2026-10-01T00:00:00Z"), to: new Date("2026-10-11T00:00:00Z") };

    const progress: UserLearningProgress[] = await facade.getProgressForUsers(["student-1", "student-2"]);
    await facade.getLessonCompletionsOfUser("student-1", range, 50);

    expect(repository.getProgressSourceForUsers).toHaveBeenCalledTimes(1);
    expect(progress.map((item: UserLearningProgress) => [item.userId, item.report.overall.percentage, item.report.sections[0].percentage])).toEqual([
      ["student-1", 100, 100],
      ["student-2", 0, 0],
    ]);
    expect(repository.getLessonCompletionsOfUser).toHaveBeenCalledWith("student-1", range.from, range.to, 50);
  });
});
