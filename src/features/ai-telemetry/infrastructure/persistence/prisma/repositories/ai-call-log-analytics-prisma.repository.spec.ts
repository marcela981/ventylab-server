/*
 * Funcionalidad: Pruebas del repositorio Prisma AiCallLogAnalyticsPrismaRepository
 * Descripción: Verifica con un cliente Prisma simulado que el uso de IA de varios usuarios sale de un solo groupBy por usuario y caso de uso con IN (ids deduplicados y fecha opcional) sin las sondas de salud, que descarta filas sin usuario y convierte sumas nulas en 0, y que no consulta sin usuarios
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type AiUserUseCaseUsage } from "@/features/ai-telemetry/domain/repositories/ai-call-log-analytics.repository";
import { EXCLUDE_HEALTH_PROBES_WHERE } from "@/features/ai-telemetry/infrastructure/persistence/prisma/filters/health-probe-exclusion";
import { AiCallLogAnalyticsPrismaRepository } from "@/features/ai-telemetry/infrastructure/persistence/prisma/repositories/ai-call-log-analytics-prisma.repository";

describe("AiCallLogAnalyticsPrismaRepository", () => {
  let groupBy: jest.Mock;
  let repository: AiCallLogAnalyticsPrismaRepository;

  beforeEach(() => {
    groupBy = jest.fn().mockResolvedValue([
      { userId: "user-1", useCase: "FREE_CHAT", _count: { _all: 3 }, _sum: { inputTokens: 300, outputTokens: null }, _avg: { latencyMs: 850 } },
      { userId: null, useCase: "TOPIC_CHECK", _count: { _all: 1 }, _sum: { inputTokens: 1, outputTokens: 1 }, _avg: { latencyMs: 10 } },
    ]);
    repository = new AiCallLogAnalyticsPrismaRepository({ aiCallLog: { groupBy } } as unknown as PrismaService);
  });

  it("groups the calls of every user by use case in one query", async () => {
    const since: Date = new Date("2026-09-01T00:00:00Z");

    const usage: AiUserUseCaseUsage[] = await repository.getUsageForUsers(["user-1", "user-2", "user-1"], since);

    expect(groupBy).toHaveBeenCalledTimes(1);
    expect(groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ by: ["userId", "useCase"], where: { userId: { in: ["user-1", "user-2"] }, createdAt: { gte: since }, AND: [EXCLUDE_HEALTH_PROBES_WHERE] } }),
    );
    expect(usage).toEqual([{ userId: "user-1", useCase: "FREE_CHAT", calls: 3, inputTokens: 300, outputTokens: 0, averageLatencyMs: 850 }]);
  });

  it("does not query without users", async () => {
    expect(await repository.getUsageForUsers([])).toEqual([]);
    expect(groupBy).not.toHaveBeenCalled();
  });
});
