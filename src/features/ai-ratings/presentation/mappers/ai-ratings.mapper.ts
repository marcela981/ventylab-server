/*
 * Funcionalidad: Mapeador de presentación de valoraciones de IA
 * Descripción: Convierte el cuerpo HTTP en el comando de upsert, la consulta en filtros de estadísticas (rango por defecto: los 30 días previos a ahora) y la entidad y las estadísticas del dominio en DTOs de respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { UpsertAiRatingCommand } from "@/features/ai-ratings/application/commands/upsert-ai-rating.command";
import { type AiRating } from "@/features/ai-ratings/domain/entities/ai-rating.entity";
import {
  type AiRatingStats,
  type AiRatingStatsFilters,
  type AiRatingStatsGroup,
  type AiRatingTargetTypeValue,
} from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";
import { type GetAiRatingsStatsQueryDTO, type UpsertAiRatingDTO } from "@/features/ai-ratings/presentation/dtos/ai-rating-request.dto";
import { type AiRatingDTO, type AiRatingStatsDTO, type AiRatingStatsGroupDTO } from "@/features/ai-ratings/presentation/dtos/ai-rating-response.dto";
import { type AiTelemetryUseCaseValue } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

const DEFAULT_RANGE_DAYS: number = 30;

const DAY_MS: number = 24 * 60 * 60 * 1000;

export class AiRatingsMapper {
  public static toUpsertCommand(dto: UpsertAiRatingDTO, userId: string): UpsertAiRatingCommand {
    return new UpsertAiRatingCommand({
      userId,
      targetType: dto.targetType as AiRatingTargetTypeValue,
      targetId: dto.targetId,
      aiCallId: dto.aiCallId ?? undefined,
      helpful: dto.helpful,
      comment: dto.comment ?? undefined,
      quality: dto.quality ?? undefined,
      understanding: dto.understanding ?? undefined,
      expression: dto.expression ?? undefined,
      safety: dto.safety ?? undefined,
      trust: dto.trust ?? undefined,
    });
  }

  public static toFilters(query: GetAiRatingsStatsQueryDTO, now: Date): AiRatingStatsFilters {
    const to: Date = query.to ? new Date(query.to) : now;
    const from: Date = query.from ? new Date(query.from) : new Date(to.getTime() - DEFAULT_RANGE_DAYS * DAY_MS);

    return {
      from,
      to,
      targetType: query.targetType as AiRatingTargetTypeValue | undefined,
      useCase: query.useCase as AiTelemetryUseCaseValue | undefined,
      provider: query.provider,
      model: query.model,
      promptVersion: query.promptVersion,
    };
  }

  public static toDTO(rating: AiRating): AiRatingDTO {
    return {
      id: rating.id,
      targetType: rating.targetType,
      targetId: rating.targetId,
      helpful: rating.answers.helpful,
      comment: rating.answers.comment,
      quality: rating.answers.quality,
      understanding: rating.answers.understanding,
      expression: rating.answers.expression,
      safety: rating.answers.safety,
      trust: rating.answers.trust,
      createdAt: rating.createdAt.toISOString(),
      updatedAt: rating.updatedAt.toISOString(),
    };
  }

  public static toStatsDTO(stats: AiRatingStats): AiRatingStatsDTO {
    return {
      from: stats.from.toISOString(),
      to: stats.to.toISOString(),
      groups: stats.groups.map(
        (group: AiRatingStatsGroup): AiRatingStatsGroupDTO => ({
          useCase: group.useCase,
          provider: group.provider,
          model: group.model,
          promptVersion: group.promptVersion,
          ratings: group.ratings,
          helpfulCount: group.helpfulCount,
          helpfulRate: group.helpfulRate,
          dimensions: {
            quality: { ...group.dimensions.quality },
            understanding: { ...group.dimensions.understanding },
            expression: { ...group.dimensions.expression },
            safety: { ...group.dimensions.safety },
            trust: { ...group.dimensions.trust },
          },
        }),
      ),
    };
  }
}
