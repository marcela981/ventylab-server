/*
 * Funcionalidad: DTOs de solicitud de valoraciones de IA
 * Descripción: Cuerpo de PUT /api/ai-ratings (objetivo, aiCallId opcional, útil, comentario y escalas QUEST opcionales; el rango 1–5 y la longitud del comentario los valida el dominio con 422), consulta de la valoración propia y consulta de estadísticas y exportación (rango from/to ISO 8601, por defecto los últimos 30 días, y filtros opcionales)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { AI_RATING_TARGET_TYPE_VALUES } from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";
import { AI_TELEMETRY_USE_CASE_VALUES } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

const MAX_ID_LENGTH: number = 100;

const MAX_FILTER_LENGTH: number = 100;

const LIKERT_DESCRIPTION: string = "Optional Likert score from 1 (worst) to 5 (best); values outside the range are rejected with 422";

export class UpsertAiRatingDTO {
  @ApiProperty({ description: "Kind of AI output being rated", enum: AI_RATING_TARGET_TYPE_VALUES, example: "MESSAGE" })
  @IsIn([...AI_RATING_TARGET_TYPE_VALUES], { message: i18nValidationMessage("ai-ratings.validation.target_type_invalid") })
  public targetType: string;

  @ApiProperty({
    description:
      "Rated output: the grade feedback id (GRADE_FEEDBACK), the assistant message id (MESSAGE) or the AI call id of the analysis (NOTES_ANALYSIS)",
    example: "cm1x2y3z40000abcd1234efgh",
  })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("ai-ratings.validation.target_id_invalid") })
  @MaxLength(MAX_ID_LENGTH, { message: i18nValidationMessage("ai-ratings.validation.target_id_invalid") })
  public targetId: string;

  @ApiPropertyOptional({
    description: "AI call that produced the output; must match the call known for the target, otherwise 422",
    example: "0192f0c4-7b1e-7a3d-9c2b-3f4e5d6a7b8c",
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(MAX_ID_LENGTH, { message: i18nValidationMessage("ai-ratings.validation.ai_call_id_invalid") })
  public aiCallId?: string;

  @ApiProperty({ description: "Whether the output was helpful", example: true })
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public helpful: boolean;

  @ApiPropertyOptional({ description: "Free-text comment (at most 2000 characters)", example: "Clear explanation of PEEP" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public comment?: string;

  @ApiPropertyOptional({ description: `Overall quality. ${LIKERT_DESCRIPTION}`, minimum: 1, maximum: 5, example: 4 })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: i18nValidationMessage("ai-ratings.validation.score_number") })
  public quality?: number;

  @ApiPropertyOptional({ description: `Understanding of the question. ${LIKERT_DESCRIPTION}`, minimum: 1, maximum: 5, example: 5 })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: i18nValidationMessage("ai-ratings.validation.score_number") })
  public understanding?: number;

  @ApiPropertyOptional({ description: `Expression style and clarity. ${LIKERT_DESCRIPTION}`, minimum: 1, maximum: 5, example: 4 })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: i18nValidationMessage("ai-ratings.validation.score_number") })
  public expression?: number;

  @ApiPropertyOptional({ description: `Safety and harm avoidance. ${LIKERT_DESCRIPTION}`, minimum: 1, maximum: 5, example: 5 })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: i18nValidationMessage("ai-ratings.validation.score_number") })
  public safety?: number;

  @ApiPropertyOptional({ description: `Trust and confidence in the answer. ${LIKERT_DESCRIPTION}`, minimum: 1, maximum: 5, example: 3 })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: i18nValidationMessage("ai-ratings.validation.score_number") })
  public trust?: number;
}

export class GetMyAiRatingQueryDTO {
  @ApiProperty({ description: "Kind of AI output", enum: AI_RATING_TARGET_TYPE_VALUES, example: "MESSAGE" })
  @IsIn([...AI_RATING_TARGET_TYPE_VALUES], { message: i18nValidationMessage("ai-ratings.validation.target_type_invalid") })
  public targetType: string;

  @ApiProperty({ description: "Rated output id", example: "cm1x2y3z40000abcd1234efgh" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("ai-ratings.validation.target_id_invalid") })
  @MaxLength(MAX_ID_LENGTH, { message: i18nValidationMessage("ai-ratings.validation.target_id_invalid") })
  public targetId: string;
}

export class GetAiRatingsStatsQueryDTO {
  @ApiPropertyOptional({ description: "Range start (inclusive, ISO 8601); defaults to 30 days before `to`", example: "2026-09-01T00:00:00Z" })
  @IsOptional()
  @IsISO8601({ strict: true }, { message: i18nValidationMessage("ai-ratings.validation.date_invalid") })
  public from?: string;

  @ApiPropertyOptional({ description: "Range end (exclusive, ISO 8601); defaults to now. The range spans at most 366 days", example: "2026-10-01T00:00:00Z" })
  @IsOptional()
  @IsISO8601({ strict: true }, { message: i18nValidationMessage("ai-ratings.validation.date_invalid") })
  public to?: string;

  @ApiPropertyOptional({ description: "Only ratings of this kind of output", enum: AI_RATING_TARGET_TYPE_VALUES, example: "MESSAGE" })
  @IsOptional()
  @IsIn([...AI_RATING_TARGET_TYPE_VALUES], { message: i18nValidationMessage("ai-ratings.validation.target_type_invalid") })
  public targetType?: string;

  @ApiPropertyOptional({ description: "Only ratings linked to calls of this use case", enum: AI_TELEMETRY_USE_CASE_VALUES, example: "FREE_CHAT" })
  @IsOptional()
  @IsIn([...AI_TELEMETRY_USE_CASE_VALUES], { message: i18nValidationMessage("ai-ratings.validation.use_case_invalid") })
  public useCase?: string;

  @ApiPropertyOptional({ description: "Only ratings linked to calls served by this provider", example: "gemini" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(MAX_FILTER_LENGTH, { message: i18nValidationMessage("ai-ratings.validation.filter_too_long") })
  public provider?: string;

  @ApiPropertyOptional({ description: "Only ratings linked to calls served by this model", example: "gemini-2.0-flash" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(MAX_FILTER_LENGTH, { message: i18nValidationMessage("ai-ratings.validation.filter_too_long") })
  public model?: string;

  @ApiPropertyOptional({ description: "Only ratings linked to calls with this prompt version", example: "1.0.0" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(MAX_FILTER_LENGTH, { message: i18nValidationMessage("ai-ratings.validation.filter_too_long") })
  public promptVersion?: string;
}
