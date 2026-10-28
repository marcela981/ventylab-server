/*
 * Funcionalidad: Pruebas de GetContinueLearningUseCase
 * Descripción: Verifica que devuelve la última lección accedida con el porcentaje del módulo calculado por páginas, y undefined cuando no hay lección accedida o el módulo dejó de estar publicado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { buildLearningProgressRepository } from "@/features/progress/application/testing/progress-test-doubles-spec";
import { GetContinueLearningUseCase } from "@/features/progress/application/use-cases/get-continue-learning.usecase";
import { type ILearningProgressRepository } from "@/features/progress/domain/repositories/learning-progress.repository";
import { type IProgressAnalyticsRepository } from "@/features/progress/domain/repositories/progress-analytics.repository";

function build(last: object | undefined): { useCase: GetContinueLearningUseCase; learning: jest.Mocked<ILearningProgressRepository> } {
  const analytics: IProgressAnalyticsRepository = { getLastAccessedLesson: jest.fn().mockResolvedValue(last) } as unknown as IProgressAnalyticsRepository;
  const learning: jest.Mocked<ILearningProgressRepository> = buildLearningProgressRepository();

  return { useCase: new GetContinueLearningUseCase(analytics, learning), learning };
}

const LAST: object = { moduleId: "M1", moduleTitle: "PEEP", lessonId: "L2", lessonTitle: "Recruitment" };

describe("GetContinueLearningUseCase", () => {
  it("returns the last accessed lesson with the module completion percentage", async () => {
    const { useCase, learning } = build(LAST);

    learning.getProgressSource.mockResolvedValue({
      structure: { sections: [], levels: [], modules: [{ id: "M1" }] },
      facts: [
        { lessonId: "L1", moduleId: "M1", publishedPageCount: 2, viewedPageCount: 2, hasCompletionRecord: false },
        { lessonId: "L2", moduleId: "M1", publishedPageCount: 2, viewedPageCount: 1, hasCompletionRecord: false },
      ],
    });

    expect(await useCase.execute("U1")).toEqual({ ...LAST, percent: 50 });
    expect(learning.getProgressSource).toHaveBeenCalledWith("U1", { type: "module", id: "M1" });
  });

  it("returns undefined without an accessed lesson or when the module is no longer published", async () => {
    expect(await build(undefined).useCase.execute("U1")).toBeUndefined();
    expect(await build(LAST).useCase.execute("U1")).toBeUndefined();
  });
});
