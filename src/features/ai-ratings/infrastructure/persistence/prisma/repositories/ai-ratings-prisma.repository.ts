/*
 * Funcionalidad: Repositorio Prisma de valoraciones de IA
 * Descripción: Implementa IAiRatingsRepository sobre ai_ratings con PrismaService: lectura por (usuario, tipo de objetivo, objetivo), upsert sobre esa clave única en la transacción activa, agregados con LEFT JOIN a ai_call_logs agrupados por caso de uso, proveedor, modelo y versión de prompt mediante $queryRaw parametrizado y filas de exportación sin identificador de usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type AiRating as AiRatingModel, Prisma } from "@prisma/client";

import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type AiRating } from "@/features/ai-ratings/domain/entities/ai-rating.entity";
import {
  AI_RATING_DIMENSIONS,
  type AiRatingDimension,
  type AiRatingExportRow,
  type AiRatingGroupAggregate,
  type AiRatingStatsFilters,
  type AiRatingTargetTypeValue,
  UNKNOWN_AI_RATING_GROUP,
} from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";
import { type IAiRatingsRepository } from "@/features/ai-ratings/domain/repositories/ai-ratings.repository";
import {
  type AiRatingExportModel,
  AiRatingsMapper,
  type RawAiRatingGroup,
} from "@/features/ai-ratings/infrastructure/persistence/prisma/mappers/ai-ratings.mapper";

// Built only from compile-time constants (the group label and the column names), never from request input.
const UNKNOWN_SQL: Prisma.Sql = Prisma.raw(`'${UNKNOWN_AI_RATING_GROUP}'`);

const DIMENSION_COLUMNS_SQL: Prisma.Sql = Prisma.join(
  AI_RATING_DIMENSIONS.map((dimension: AiRatingDimension) =>
    Prisma.raw(`avg(r.${dimension})::float8 AS ${dimension}_mean, count(r.${dimension}) AS ${dimension}_n`),
  ),
  ", ",
);

@Injectable()
export class AiRatingsPrismaRepository implements IAiRatingsRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getByUserAndTarget(
    userId: string,
    targetType: AiRatingTargetTypeValue,
    targetId: string,
    transaction?: unknown,
  ): Promise<AiRating | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: AiRatingModel | null = await client.aiRating.findUnique({
      where: { userId_targetType_targetId: { userId, targetType, targetId } },
    });

    return row ? AiRatingsMapper.toDomain(row) : undefined;
  }

  public async save(rating: AiRating, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.aiRating.upsert({
      where: { userId_targetType_targetId: { userId: rating.userId, targetType: rating.targetType, targetId: rating.targetId } },
      create: AiRatingsMapper.toCreate(rating),
      update: AiRatingsMapper.toUpdate(rating),
    });
  }

  public async getStatsGroups(filters: AiRatingStatsFilters): Promise<AiRatingGroupAggregate[]> {
    const rows: RawAiRatingGroup[] = await this._prisma.$queryRaw<RawAiRatingGroup[]>(Prisma.sql`
      SELECT
        coalesce(l.use_case::text, ${UNKNOWN_SQL}) AS use_case,
        coalesce(l.provider, ${UNKNOWN_SQL}) AS provider,
        coalesce(l.model, ${UNKNOWN_SQL}) AS model,
        coalesce(l.prompt_version, ${UNKNOWN_SQL}) AS prompt_version,
        count(*) AS ratings,
        count(*) FILTER (WHERE r.helpful) AS helpful_count,
        ${DIMENSION_COLUMNS_SQL}
      FROM ai_ratings r
      LEFT JOIN ai_call_logs l ON l.id = r.ai_call_id
      WHERE ${this._whereSql(filters)}
      GROUP BY 1, 2, 3, 4
      ORDER BY 1, 2, 3, 4
    `);

    return rows.map((row: RawAiRatingGroup) => AiRatingsMapper.toGroupAggregate(row));
  }

  public async getExportRows(filters: AiRatingStatsFilters, limit: number): Promise<AiRatingExportRow[]> {
    const callFilter: Prisma.AiCallLogWhereInput = {
      ...(filters.useCase ? { useCase: filters.useCase } : {}),
      ...(filters.provider ? { provider: filters.provider } : {}),
      ...(filters.model ? { model: filters.model } : {}),
      ...(filters.promptVersion ? { promptVersion: filters.promptVersion } : {}),
    };

    const rows: AiRatingExportModel[] = await this._prisma.aiRating.findMany({
      where: {
        createdAt: { gte: filters.from, lt: filters.to },
        ...(filters.targetType ? { targetType: filters.targetType } : {}),
        ...(Object.keys(callFilter).length > 0 ? { aiCall: callFilter } : {}),
      },
      select: {
        id: true,
        targetType: true,
        targetId: true,
        helpful: true,
        comment: true,
        quality: true,
        understanding: true,
        expression: true,
        safety: true,
        trust: true,
        createdAt: true,
        aiCall: { select: { useCase: true, provider: true, model: true, promptVersion: true } },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: limit,
    });

    return rows.map((row: AiRatingExportModel) => AiRatingsMapper.toExportRow(row));
  }

  private _whereSql(filters: AiRatingStatsFilters): Prisma.Sql {
    const conditions: Prisma.Sql[] = [Prisma.sql`r.created_at >= ${filters.from}`, Prisma.sql`r.created_at < ${filters.to}`];

    if (filters.targetType) {
      conditions.push(Prisma.sql`r.target_type = ${filters.targetType}::"AiRatingTargetType"`);
    }

    if (filters.useCase) {
      conditions.push(Prisma.sql`l.use_case = ${filters.useCase}::"AiUseCase"`);
    }

    if (filters.provider) {
      conditions.push(Prisma.sql`l.provider = ${filters.provider}`);
    }

    if (filters.model) {
      conditions.push(Prisma.sql`l.model = ${filters.model}`);
    }

    if (filters.promptVersion) {
      conditions.push(Prisma.sql`l.prompt_version = ${filters.promptVersion}`);
    }

    return Prisma.join(conditions, " AND ");
  }
}
