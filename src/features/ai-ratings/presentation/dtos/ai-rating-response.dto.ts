/*
 * Funcionalidad: DTOs de respuesta de valoraciones de IA
 * Descripción: Valoración propia de un usuario (para precargar el formulario) y estadísticas agregadas por caso de uso, proveedor, modelo y versión de prompt con tasa de utilidad y media con n por dimensión QUEST
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { AI_RATING_TARGET_TYPE_VALUES } from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";

export class AiRatingDTO {
  @ApiProperty({ description: "Rating id", example: "0192f0c4-7b1e-7a3d-9c2b-3f4e5d6a7b8c" })
  public id: string;

  @ApiProperty({ description: "Kind of AI output", enum: AI_RATING_TARGET_TYPE_VALUES, example: "MESSAGE" })
  public targetType: string;

  @ApiProperty({ description: "Rated output id", example: "cm1x2y3z40000abcd1234efgh" })
  public targetId: string;

  @ApiProperty({ description: "Whether the output was helpful", example: true })
  public helpful: boolean;

  @ApiPropertyOptional({ description: "Free-text comment", example: "Clear explanation of PEEP" })
  public comment?: string;

  @ApiPropertyOptional({ description: "Overall quality (1–5)", example: 4 })
  public quality?: number;

  @ApiPropertyOptional({ description: "Understanding of the question (1–5)", example: 5 })
  public understanding?: number;

  @ApiPropertyOptional({ description: "Expression style and clarity (1–5)", example: 4 })
  public expression?: number;

  @ApiPropertyOptional({ description: "Safety and harm avoidance (1–5)", example: 5 })
  public safety?: number;

  @ApiPropertyOptional({ description: "Trust and confidence in the answer (1–5)", example: 3 })
  public trust?: number;

  @ApiProperty({ description: "First rated at", example: "2026-10-05T12:00:00.000Z" })
  public createdAt: string;

  @ApiProperty({ description: "Last edited at", example: "2026-10-05T12:05:00.000Z" })
  public updatedAt: string;
}

export class AiRatingDimensionStatsDTO {
  @ApiPropertyOptional({ description: "Mean score; absent when no rating answered this dimension", example: 4.2 })
  public mean?: number;

  @ApiProperty({ description: "Ratings that answered this dimension", example: 18 })
  public n: number;
}

export class AiRatingDimensionsStatsDTO {
  @ApiProperty({ description: "Overall quality", type: AiRatingDimensionStatsDTO })
  public quality: AiRatingDimensionStatsDTO;

  @ApiProperty({ description: "Understanding of the question", type: AiRatingDimensionStatsDTO })
  public understanding: AiRatingDimensionStatsDTO;

  @ApiProperty({ description: "Expression style and clarity", type: AiRatingDimensionStatsDTO })
  public expression: AiRatingDimensionStatsDTO;

  @ApiProperty({ description: "Safety and harm avoidance", type: AiRatingDimensionStatsDTO })
  public safety: AiRatingDimensionStatsDTO;

  @ApiProperty({ description: "Trust and confidence", type: AiRatingDimensionStatsDTO })
  public trust: AiRatingDimensionStatsDTO;
}

export class AiRatingStatsGroupDTO {
  @ApiProperty({ description: "Use case of the linked AI call, or \"unknown\"", example: "FREE_CHAT" })
  public useCase: string;

  @ApiProperty({ description: "Provider of the linked AI call, or \"unknown\"", example: "gemini" })
  public provider: string;

  @ApiProperty({ description: "Model of the linked AI call, or \"unknown\"", example: "gemini-2.0-flash" })
  public model: string;

  @ApiProperty({ description: "Prompt version of the linked AI call, or \"unknown\"", example: "1.0.0" })
  public promptVersion: string;

  @ApiProperty({ description: "Ratings in the group", example: 20 })
  public ratings: number;

  @ApiProperty({ description: "Ratings marked helpful", example: 17 })
  public helpfulCount: number;

  @ApiProperty({ description: "helpfulCount / ratings (0 when there are none)", example: 0.85 })
  public helpfulRate: number;

  @ApiProperty({ description: "Mean and n per QUEST dimension", type: AiRatingDimensionsStatsDTO })
  public dimensions: AiRatingDimensionsStatsDTO;
}

export class AiRatingStatsDTO {
  @ApiProperty({ description: "Range start (inclusive)", example: "2026-09-05T00:00:00.000Z" })
  public from: string;

  @ApiProperty({ description: "Range end (exclusive)", example: "2026-10-05T00:00:00.000Z" })
  public to: string;

  @ApiProperty({ description: "One entry per use case, provider, model and prompt version", type: AiRatingStatsGroupDTO, isArray: true })
  public groups: AiRatingStatsGroupDTO[];
}
