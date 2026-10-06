/*
 * Funcionalidad: Mapeador de persistencia de valoraciones de IA
 * Descripción: Convierte filas de ai_ratings en la entidad AiRating y viceversa (null ↔ undefined), las filas de agregados crudos de $queryRaw (bigint y nulos) en agregados de dominio y las filas de exportación con la llamada enlazada en filas sin identificador de usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiRating as AiRatingModel, type Prisma } from "@prisma/client";

import { AiRating } from "@/features/ai-ratings/domain/entities/ai-rating.entity";
import {
  type AiRatingDimension,
  type AiRatingDimensionStats,
  type AiRatingExportRow,
  type AiRatingGroupAggregate,
} from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";
import { AiRatingAnswers } from "@/features/ai-ratings/domain/value-objects/ai-rating-answers";

export type RawAiRatingGroup = {
  readonly use_case: string;
  readonly provider: string;
  readonly model: string;
  readonly prompt_version: string;
  readonly ratings: bigint | number;
  readonly helpful_count: bigint | number;
} & Readonly<Record<`${AiRatingDimension}_mean`, number | null>> &
  Readonly<Record<`${AiRatingDimension}_n`, bigint | number>>;

export interface AiRatingExportModel {
  readonly id: string;
  readonly targetType: AiRatingModel["targetType"];
  readonly targetId: string;
  readonly helpful: boolean;
  readonly comment: string | null;
  readonly quality: number | null;
  readonly understanding: number | null;
  readonly expression: number | null;
  readonly safety: number | null;
  readonly trust: number | null;
  readonly createdAt: Date;
  readonly aiCall: { useCase: string; provider: string; model: string | null; promptVersion: string } | null;
}

export type AiRatingWriteData = Omit<Prisma.AiRatingUncheckedCreateInput, "id" | "userId" | "targetType" | "targetId" | "createdAt">;

export class AiRatingsMapper {
  public static toDomain(row: AiRatingModel): AiRating {
    return AiRating.reconstitute({
      id: row.id,
      userId: row.userId,
      targetType: row.targetType,
      targetId: row.targetId,
      aiCallId: row.aiCallId ?? undefined,
      answers: AiRatingAnswers.create({
        helpful: row.helpful,
        comment: row.comment ?? undefined,
        quality: row.quality ?? undefined,
        understanding: row.understanding ?? undefined,
        expression: row.expression ?? undefined,
        safety: row.safety ?? undefined,
        trust: row.trust ?? undefined,
      }),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  public static toCreate(rating: AiRating): Prisma.AiRatingUncheckedCreateInput {
    return {
      id: rating.id,
      userId: rating.userId,
      targetType: rating.targetType,
      targetId: rating.targetId,
      createdAt: rating.createdAt,
      ...AiRatingsMapper.toUpdate(rating),
    };
  }

  public static toUpdate(rating: AiRating): AiRatingWriteData {
    return {
      aiCallId: rating.aiCallId ?? null,
      helpful: rating.answers.helpful,
      comment: rating.answers.comment ?? null,
      quality: rating.answers.quality ?? null,
      understanding: rating.answers.understanding ?? null,
      expression: rating.answers.expression ?? null,
      safety: rating.answers.safety ?? null,
      trust: rating.answers.trust ?? null,
      updatedAt: rating.updatedAt,
    };
  }

  public static toGroupAggregate(row: RawAiRatingGroup): AiRatingGroupAggregate {
    const dimensions: Record<AiRatingDimension, AiRatingDimensionStats> = {
      quality: AiRatingsMapper._toDimensionStats(row, "quality"),
      understanding: AiRatingsMapper._toDimensionStats(row, "understanding"),
      expression: AiRatingsMapper._toDimensionStats(row, "expression"),
      safety: AiRatingsMapper._toDimensionStats(row, "safety"),
      trust: AiRatingsMapper._toDimensionStats(row, "trust"),
    };

    return {
      useCase: row.use_case,
      provider: row.provider,
      model: row.model,
      promptVersion: row.prompt_version,
      ratings: Number(row.ratings),
      helpfulCount: Number(row.helpful_count),
      dimensions,
    };
  }

  public static toExportRow(row: AiRatingExportModel): AiRatingExportRow {
    return {
      targetType: row.targetType,
      targetId: row.targetId,
      helpful: row.helpful,
      quality: row.quality ?? undefined,
      understanding: row.understanding ?? undefined,
      expression: row.expression ?? undefined,
      safety: row.safety ?? undefined,
      trust: row.trust ?? undefined,
      comment: row.comment ?? undefined,
      createdAt: row.createdAt,
      useCase: row.aiCall?.useCase,
      provider: row.aiCall?.provider,
      model: row.aiCall?.model ?? undefined,
      promptVersion: row.aiCall?.promptVersion,
    };
  }

  private static _toDimensionStats(row: RawAiRatingGroup, dimension: AiRatingDimension): AiRatingDimensionStats {
    const mean: number | null = row[`${dimension}_mean`];

    return { mean: mean === null ? undefined : Number(mean), n: Number(row[`${dimension}_n`]) };
  }
}

