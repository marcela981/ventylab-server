/*
 * Funcionalidad: Pruebas de AiRatingsFacade
 * Descripción: Verifica que la utilidad por usuario y caso de uso de varios usuarios se pide al repositorio de analítica en una sola llamada y que la tasa de útiles es la proporción de valoraciones útiles (nula sin valoraciones)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AiRatingsFacade, type AiRatingUserUseCaseStats } from "@/features/ai-ratings/application/services/ai-ratings.facade";
import { type AiRatingDimensionStats, type AiRatingDimension } from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";
import { type IAiRatingsAnalyticsRepository } from "@/features/ai-ratings/domain/repositories/ai-ratings-analytics.repository";

const DIMENSIONS: Readonly<Record<AiRatingDimension, AiRatingDimensionStats>> = {
  quality: { mean: 4, n: 2 },
  understanding: { n: 0 },
  expression: { n: 0 },
  safety: { n: 0 },
  trust: { n: 0 },
};

describe("AiRatingsFacade", () => {
  it("computes the helpful rate per user and use case from one repository call", async () => {
    const repository: jest.Mocked<IAiRatingsAnalyticsRepository> = {
      getUserUseCaseAggregates: jest.fn().mockResolvedValue([
        { userId: "student-1", useCase: "FREE_CHAT", ratings: 4, helpfulCount: 3, dimensions: DIMENSIONS },
        { userId: "student-2", useCase: "unknown", ratings: 0, helpfulCount: 0, dimensions: DIMENSIONS },
      ]),
    };
    const facade: AiRatingsFacade = new AiRatingsFacade(repository);

    const stats: AiRatingUserUseCaseStats[] = await facade.getHelpfulnessForUsers(["student-1", "student-2"]);

    expect(repository.getUserUseCaseAggregates).toHaveBeenCalledTimes(1);
    expect(repository.getUserUseCaseAggregates).toHaveBeenCalledWith(["student-1", "student-2"]);
    expect(stats.map((item: AiRatingUserUseCaseStats) => item.helpfulRate)).toEqual([0.75, null]);
  });
});
