/*
 * Funcionalidad: Pruebas del repositorio Prisma de valoraciones de IA
 * Descripción: Verifica con un cliente Prisma simulado el upsert por (usuario, tipo de objetivo, objetivo) en la transacción activa, la lectura de la valoración propia, los agregados por caso de uso, proveedor, modelo y versión de prompt con parámetros enlazados en $queryRaw y las filas de exportación sin identificador de usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma } from "@prisma/client";

import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { AiRating } from "@/features/ai-ratings/domain/entities/ai-rating.entity";
import {
  type AiRatingExportRow,
  type AiRatingGroupAggregate,
  type AiRatingStatsFilters,
} from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";
import { AiRatingAnswers } from "@/features/ai-ratings/domain/value-objects/ai-rating-answers";
import { AiRatingsPrismaRepository } from "@/features/ai-ratings/infrastructure/persistence/prisma/repositories/ai-ratings-prisma.repository";

interface RatingDelegateMock {
  upsert: jest.Mock;
  findUnique: jest.Mock;
  findMany: jest.Mock;
}

interface PrismaMock {
  $queryRaw: jest.Mock;
  aiRating: RatingDelegateMock;
}

const CREATED_AT: Date = new Date("2026-10-02T10:00:00Z");

const UPDATED_AT: Date = new Date("2026-10-03T10:00:00Z");

const FILTERS: AiRatingStatsFilters = {
  from: new Date("2026-10-01T00:00:00Z"),
  to: new Date("2026-10-05T00:00:00Z"),
  targetType: "MESSAGE",
  useCase: "FREE_CHAT",
  provider: "gemini",
};

const ROW: Record<string, unknown> = {
  id: "rating-1",
  userId: "student-1",
  aiCallId: "call-1",
  targetType: "MESSAGE",
  targetId: "message-1",
  helpful: true,
  comment: null,
  quality: 4,
  understanding: null,
  expression: null,
  safety: 5,
  trust: null,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
};

describe("AiRatingsPrismaRepository", () => {
  let prisma: PrismaMock;
  let repository: AiRatingsPrismaRepository;

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn(), aiRating: { upsert: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() } };
    repository = new AiRatingsPrismaRepository(prisma as unknown as PrismaService);
  });

  it("upserts by the (user, target type, target) key on the transaction client without changing the identity on update", async () => {
    const transaction: PrismaMock = { $queryRaw: jest.fn(), aiRating: { upsert: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() } };
    const rating: AiRating = AiRating.create({
      userId: "student-1",
      targetType: "MESSAGE",
      targetId: "message-1",
      aiCallId: "call-1",
      answers: AiRatingAnswers.create({ helpful: false, trust: 2 }),
    });

    await repository.save(rating, transaction);

    expect(prisma.aiRating.upsert).not.toHaveBeenCalled();

    const args: Prisma.AiRatingUpsertArgs = transaction.aiRating.upsert.mock.calls[0][0] as Prisma.AiRatingUpsertArgs;

    expect(args.where).toEqual({ userId_targetType_targetId: { userId: "student-1", targetType: "MESSAGE", targetId: "message-1" } });
    expect(args.create).toEqual(expect.objectContaining({ id: rating.id, userId: "student-1", helpful: false, trust: 2, quality: null, comment: null }));
    expect(args.update).toEqual(expect.objectContaining({ helpful: false, trust: 2, aiCallId: "call-1", quality: null }));
    expect(args.update).not.toHaveProperty("id");
    expect(args.update).not.toHaveProperty("userId");
    expect(args.update).not.toHaveProperty("createdAt");
  });

  it("reads the user's rating of a target and maps nulls to undefined", async () => {
    prisma.aiRating.findUnique.mockResolvedValue(ROW);

    const rating: AiRating | undefined = await repository.getByUserAndTarget("student-1", "MESSAGE", "message-1");

    expect(prisma.aiRating.findUnique).toHaveBeenCalledWith({
      where: { userId_targetType_targetId: { userId: "student-1", targetType: "MESSAGE", targetId: "message-1" } },
    });
    expect(rating?.id).toBe("rating-1");
    expect(rating?.answers.dimensions).toEqual({ quality: 4, understanding: undefined, expression: undefined, safety: 5, trust: undefined });
    expect(rating?.answers.comment).toBeUndefined();
    expect(rating?.updatedAt).toBe(UPDATED_AT);
  });

  it("returns undefined when the user has not rated the target", async () => {
    prisma.aiRating.findUnique.mockResolvedValue(null);

    await expect(repository.getByUserAndTarget("student-1", "MESSAGE", "message-1")).resolves.toBeUndefined();
  });

  it("aggregates per call dimension with every filter bound as a SQL parameter", async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        use_case: "FREE_CHAT",
        provider: "gemini",
        model: "unknown",
        prompt_version: "1.0.0",
        ratings: BigInt(4),
        helpful_count: BigInt(3),
        quality_mean: 4.5,
        quality_n: BigInt(2),
        understanding_mean: null,
        understanding_n: BigInt(0),
        expression_mean: 3,
        expression_n: BigInt(1),
        safety_mean: null,
        safety_n: BigInt(0),
        trust_mean: 5,
        trust_n: BigInt(4),
      },
    ]);

    const groups: AiRatingGroupAggregate[] = await repository.getStatsGroups({ ...FILTERS, model: "x'; DROP TABLE ai_ratings; --", promptVersion: "1.0.0" });

    const query: Prisma.Sql = prisma.$queryRaw.mock.calls[0][0] as Prisma.Sql;

    expect(query.sql).toContain("LEFT JOIN ai_call_logs");
    expect(query.sql).toContain("GROUP BY");
    expect(query.sql).not.toContain("DROP TABLE");
    expect(query.values).toEqual(
      expect.arrayContaining([FILTERS.from, FILTERS.to, "MESSAGE", "FREE_CHAT", "gemini", "x'; DROP TABLE ai_ratings; --", "1.0.0"]),
    );
    expect(groups).toEqual([
      {
        useCase: "FREE_CHAT",
        provider: "gemini",
        model: "unknown",
        promptVersion: "1.0.0",
        ratings: 4,
        helpfulCount: 3,
        dimensions: {
          quality: { mean: 4.5, n: 2 },
          understanding: { mean: undefined, n: 0 },
          expression: { mean: 3, n: 1 },
          safety: { mean: undefined, n: 0 },
          trust: { mean: 5, n: 4 },
        },
      },
    ]);
  });

  it("binds only the range when no optional filter is given", async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    await repository.getStatsGroups({ from: FILTERS.from, to: FILTERS.to });

    const query: Prisma.Sql = prisma.$queryRaw.mock.calls[0][0] as Prisma.Sql;

    expect(query.values).toEqual([FILTERS.from, FILTERS.to]);
  });

  it("reads export rows with the call dimensions, ordered, limited and without the user id", async () => {
    prisma.aiRating.findMany.mockResolvedValue([
      { ...ROW, comment: "=SUM(A1)", aiCall: { useCase: "FREE_CHAT", provider: "gemini", model: null, promptVersion: "1.0.0" } },
      { ...ROW, id: "rating-2", aiCallId: null, aiCall: null },
    ]);

    const rows: AiRatingExportRow[] = await repository.getExportRows({ ...FILTERS, promptVersion: "1.0.0" }, 10);

    expect(prisma.aiRating.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: { gte: FILTERS.from, lt: FILTERS.to },
          targetType: "MESSAGE",
          aiCall: { useCase: "FREE_CHAT", provider: "gemini", promptVersion: "1.0.0" },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: 10,
      }),
    );
    expect(rows[0]).toEqual(
      expect.objectContaining({ targetId: "message-1", comment: "=SUM(A1)", useCase: "FREE_CHAT", model: undefined, promptVersion: "1.0.0" }),
    );
    expect(rows[1].useCase).toBeUndefined();
    expect(rows[0]).not.toHaveProperty("userId");
  });
});
