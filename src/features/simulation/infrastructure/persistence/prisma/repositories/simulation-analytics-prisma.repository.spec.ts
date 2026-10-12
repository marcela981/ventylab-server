/*
 * Funcionalidad: Pruebas del repositorio Prisma SimulationAnalyticsPrismaRepository
 * Descripción: Verifica con un cliente Prisma simulado que las estadísticas de varios usuarios salen de una sola consulta $queryRaw con los ids como parámetros (nunca en el texto SQL), que lee el tiempo de estabilización del criterio TIME_TO_STABILIZE del resumen persistido, que convierte bigint y nulos, y que no consulta sin usuarios
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma } from "@prisma/client";

import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type SimulationUserSessionStats } from "@/features/simulation/domain/repositories/simulation-analytics.repository";
import { SimulationAnalyticsPrismaRepository } from "@/features/simulation/infrastructure/persistence/prisma/repositories/simulation-analytics-prisma.repository";

describe("SimulationAnalyticsPrismaRepository", () => {
  let queryRaw: jest.Mock;
  let repository: SimulationAnalyticsPrismaRepository;

  beforeEach(() => {
    queryRaw = jest.fn().mockResolvedValue([
      { user_id: "student-1", session_count: BigInt(3), scored_count: 2, average_score: 80, stabilized_count: 1, average_time_to_stabilize_s: 95.5 },
      { user_id: "student-2", session_count: 1, scored_count: 0, average_score: null, stabilized_count: 0, average_time_to_stabilize_s: null },
    ]);
    repository = new SimulationAnalyticsPrismaRepository({ $queryRaw: queryRaw } as unknown as PrismaService);
  });

  it("aggregates every user in one parameterized query", async () => {
    const stats: SimulationUserSessionStats[] = await repository.getSessionStatsForUsers(["student-1", "student-2", "student-1"]);
    const query: Prisma.Sql = queryRaw.mock.calls[0][0] as Prisma.Sql;

    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(query.sql).toContain("TIME_TO_STABILIZE");
    expect(query.sql).toContain("GROUP BY s.user_id");
    expect(query.sql).not.toContain("student-1");
    expect(query.values).toEqual(["student-1", "student-2"]);
    expect(stats).toEqual([
      { userId: "student-1", sessionCount: 3, scoredCount: 2, averageScore: 80, stabilizedCount: 1, averageTimeToStabilizeSeconds: 95.5 },
      { userId: "student-2", sessionCount: 1, scoredCount: 0, averageScore: null, stabilizedCount: 0, averageTimeToStabilizeSeconds: null },
    ]);
  });

  it("does not query without users", async () => {
    const stats: SimulationUserSessionStats[] = await repository.getSessionStatsForUsers([]);

    expect(stats).toEqual([]);
    expect(queryRaw).not.toHaveBeenCalled();
  });
});
