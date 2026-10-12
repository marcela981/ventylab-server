/*
 * Funcionalidad: Repositorio Prisma AiRatingsAnalyticsPrismaRepository
 * Descripción: Implementa IAiRatingsAnalyticsRepository con una sola consulta $queryRaw parametrizada sobre ai_ratings unida a ai_call_logs, agrupada por usuario y caso de uso (unknown sin llamada enlazada) con IN, con conteo de valoraciones, conteo útil y media y tamaño de cada dimensión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type AiRatingUserUseCaseAggregate,
  type IAiRatingsAnalyticsRepository,
} from "@/features/ai-ratings/domain/repositories/ai-ratings-analytics.repository";
import { AiRatingsMapper, type RawAiRatingUserGroup } from "@/features/ai-ratings/infrastructure/persistence/prisma/mappers/ai-ratings.mapper";
import { DIMENSION_COLUMNS_SQL, UNKNOWN_SQL } from "@/features/ai-ratings/infrastructure/persistence/prisma/repositories/ai-ratings-prisma.repository";

@Injectable()
export class AiRatingsAnalyticsPrismaRepository implements IAiRatingsAnalyticsRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getUserUseCaseAggregates(userIds: readonly string[]): Promise<AiRatingUserUseCaseAggregate[]> {
    if (userIds.length === 0) {
      return [];
    }

    const rows: RawAiRatingUserGroup[] = await this._prisma.$queryRaw<RawAiRatingUserGroup[]>(Prisma.sql`
      SELECT
        r.user_id AS user_id,
        coalesce(l.use_case::text, ${UNKNOWN_SQL}) AS use_case,
        count(*) AS ratings,
        count(*) FILTER (WHERE r.helpful) AS helpful_count,
        ${DIMENSION_COLUMNS_SQL}
      FROM ai_ratings r
      LEFT JOIN ai_call_logs l ON l.id = r.ai_call_id
      WHERE r.user_id IN (${Prisma.join([...new Set<string>(userIds)])})
      GROUP BY 1, 2
      ORDER BY 1, 2
    `);

    return rows.map((row: RawAiRatingUserGroup) => AiRatingsMapper.toUserUseCaseAggregate(row));
  }
}
