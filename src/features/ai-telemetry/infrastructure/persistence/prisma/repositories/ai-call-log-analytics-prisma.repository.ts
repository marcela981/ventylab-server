/*
 * Funcionalidad: Repositorio Prisma AiCallLogAnalyticsPrismaRepository
 * Descripción: Implementa IAiCallLogAnalyticsRepository con un solo groupBy de Prisma sobre ai_call_logs por usuario y caso de uso con IN (conteo de llamadas, suma de tokens y latencia promedio), opcionalmente desde una fecha, sin bucles por usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type AiUseCase } from "@prisma/client";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type AiUserUseCaseUsage, type IAiCallLogAnalyticsRepository } from "@/features/ai-telemetry/domain/repositories/ai-call-log-analytics.repository";

interface UsageGroupRow {
  userId: string | null;
  useCase: AiUseCase;
  _count: { _all: number };
  _sum: { inputTokens: number | null; outputTokens: number | null };
  _avg: { latencyMs: number | null };
}

function toUsage(row: UsageGroupRow): AiUserUseCaseUsage[] {
  if (row.userId === null) {
    return [];
  }

  return [
    {
      userId: row.userId,
      useCase: row.useCase,
      calls: row._count._all,
      inputTokens: row._sum.inputTokens ?? 0,
      outputTokens: row._sum.outputTokens ?? 0,
      averageLatencyMs: row._avg.latencyMs ?? null,
    },
  ];
}

@Injectable()
export class AiCallLogAnalyticsPrismaRepository implements IAiCallLogAnalyticsRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getUsageForUsers(userIds: readonly string[], since?: Date): Promise<AiUserUseCaseUsage[]> {
    if (userIds.length === 0) {
      return [];
    }

    return await this._prisma.aiCallLog
      .groupBy({
        by: ["userId", "useCase"],
        where: { userId: { in: [...new Set<string>(userIds)] }, ...(since ? { createdAt: { gte: since } } : {}) },
        _count: { _all: true },
        _sum: { inputTokens: true, outputTokens: true },
        _avg: { latencyMs: true },
      })
      .then((rows: UsageGroupRow[]) => rows.flatMap((row: UsageGroupRow) => toUsage(row)));
  }
}
