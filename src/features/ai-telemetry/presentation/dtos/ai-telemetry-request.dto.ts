/*
 * Funcionalidad: DTO de consulta de la telemetría de IA
 * Descripción: Parámetros de consulta de estadísticas y exportación CSV de llamadas de IA: rango from/to ISO 8601 (por defecto los últimos 30 días) y filtros opcionales de caso de uso, proveedor y modelo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsISO8601, IsOptional, IsString, MaxLength } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { AI_TELEMETRY_USE_CASE_VALUES } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

const MAX_FILTER_LENGTH: number = 100;

export class GetAiTelemetryQueryDTO {
  @ApiPropertyOptional({ description: "Range start (inclusive, ISO 8601); defaults to 30 days before `to`", example: "2026-09-01T00:00:00Z" })
  @IsOptional()
  @IsISO8601({ strict: true }, { message: i18nValidationMessage("ai-telemetry.validation.date_invalid") })
  public from?: string;

  @ApiPropertyOptional({ description: "Range end (exclusive, ISO 8601); defaults to now. The range spans at most 366 days", example: "2026-10-01T00:00:00Z" })
  @IsOptional()
  @IsISO8601({ strict: true }, { message: i18nValidationMessage("ai-telemetry.validation.date_invalid") })
  public to?: string;

  @ApiPropertyOptional({ description: "Only calls of this use case", enum: AI_TELEMETRY_USE_CASE_VALUES, example: "FREE_CHAT" })
  @IsOptional()
  @IsIn([...AI_TELEMETRY_USE_CASE_VALUES], { message: i18nValidationMessage("ai-telemetry.validation.use_case_invalid") })
  public useCase?: string;

  @ApiPropertyOptional({ description: "Only calls served by this provider", example: "gemini" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(MAX_FILTER_LENGTH, { message: i18nValidationMessage("ai-telemetry.validation.filter_too_long") })
  public provider?: string;

  @ApiPropertyOptional({ description: "Only calls served by this model", example: "gemini-2.0-flash" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(MAX_FILTER_LENGTH, { message: i18nValidationMessage("ai-telemetry.validation.filter_too_long") })
  public model?: string;
}
