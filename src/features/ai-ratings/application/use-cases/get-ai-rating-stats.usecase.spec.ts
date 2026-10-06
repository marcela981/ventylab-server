/*
 * Funcionalidad: Pruebas del caso de uso GetAiRatingStatsUseCase
 * Descripción: Verifica la validación del rango de fechas (422) y el cálculo de la tasa de utilidad por grupo de caso de uso, proveedor, modelo y versión de prompt
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InMemoryAiRatingsRepository } from "@/features/ai-ratings/application/testing/ai-ratings-test-doubles-spec";
import { GetAiRatingStatsUseCase } from "@/features/ai-ratings/application/use-cases/get-ai-rating-stats.usecase";
import { InvalidAiRatingsRangeError } from "@/features/ai-ratings/domain/ai-ratings.errors";
import { type AiRatingGroupAggregate, type AiRatingStats } from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";

const FROM: Date = new Date("2026-10-01T00:00:00Z");

const TO: Date = new Date("2026-10-05T00:00:00Z");

function group(overrides: Partial<AiRatingGroupAggregate>): AiRatingGroupAggregate {
  return {
    useCase: "unknown",
    provider: "unknown",
    model: "unknown",
    promptVersion: "unknown",
    ratings: 0,
    helpfulCount: 0,
    dimensions: {
      quality: { n: 0 },
      understanding: { n: 0 },
      expression: { n: 0 },
      safety: { n: 0 },
      trust: { n: 0 },
    },
    ...overrides,
  };
}

describe("GetAiRatingStatsUseCase", () => {
  let repository: InMemoryAiRatingsRepository;
  let useCase: GetAiRatingStatsUseCase;

  beforeEach(() => {
    repository = new InMemoryAiRatingsRepository();
    useCase = new GetAiRatingStatsUseCase(repository);
  });

  it("computes the helpful rate of every group", async () => {
    repository.statsGroups = [group({ useCase: "FREE_CHAT", ratings: 4, helpfulCount: 3 }), group({ ratings: 0, helpfulCount: 0 })];

    const stats: AiRatingStats = await useCase.execute({ from: FROM, to: TO });

    expect(stats.from).toBe(FROM);
    expect(stats.groups[0]).toEqual(expect.objectContaining({ useCase: "FREE_CHAT", ratings: 4, helpfulRate: 0.75 }));
    expect(stats.groups[1].helpfulRate).toBe(0);
  });

  it.each([
    ["ends before it starts", TO, FROM],
    ["is empty", FROM, FROM],
    ["spans more than 366 days", new Date("2025-01-01T00:00:00Z"), new Date("2026-01-03T00:00:00Z")],
  ])("rejects a range that %s", async (_label: string, from: Date, to: Date) => {
    await expect(useCase.execute({ from, to })).rejects.toThrow(InvalidAiRatingsRangeError);
  });
});
