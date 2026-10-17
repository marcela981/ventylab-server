/*
 * Funcionalidad: DTOs de petición de analítica
 * Descripción: Valida con class-validator y mensajes i18n el rango opcional de la línea de tiempo de un estudiante (fechas ISO 8601 estrictas) el grupo opcional de la exportación de investigación y el grupo opcional de las estadísticas de una evaluación
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsISO8601, IsOptional, IsString, MaxLength } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

const MAX_ID_LENGTH: number = 100;

export class StudentTimelineQueryDTO {
  @ApiPropertyOptional({ description: "Range start (inclusive, ISO 8601); defaults to 30 days before the end", example: "2026-09-11T00:00:00Z" })
  @IsOptional()
  @IsISO8601({ strict: true }, { message: i18nValidationMessage("analytics.validation.date_invalid") })
  public from?: string;

  @ApiPropertyOptional({ description: "Range end (exclusive, ISO 8601); defaults to now", example: "2026-10-11T00:00:00Z" })
  @IsOptional()
  @IsISO8601({ strict: true }, { message: i18nValidationMessage("analytics.validation.date_invalid") })
  public to?: string;
}

export class ResearchExportQueryDTO {
  @ApiPropertyOptional({ description: "Only students of this STUDENT group; every STUDENT group when omitted", example: "cm5x2k9a00000abcd1234efgh", maxLength: MAX_ID_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(MAX_ID_LENGTH, { message: i18nValidationMessage("analytics.validation.group_id_too_long") })
  public groupId?: string;
}

export class EvaluationStatsQueryDTO {
  @ApiPropertyOptional({
    description: "Only attempts of the assignments of this STUDENT group; teachers must manage or supervise it",
    example: "cm5x2k9a00000abcd1234efgh",
    maxLength: MAX_ID_LENGTH,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(MAX_ID_LENGTH, { message: i18nValidationMessage("analytics.validation.group_id_too_long") })
  public groupId?: string;
}
