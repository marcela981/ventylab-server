/*
 * Funcionalidad: DTOs get-change-stats-query.dto
 * Descripción: Define los DTOs GetChangeStatsQueryDTO de la feature de historial de cambios, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class GetChangeStatsQueryDTO {
  @ApiProperty({ description: "Start of the period (inclusive), ISO 8601", example: "2026-01-01T00:00:00.000Z", format: "date-time" })
  @Type(() => Date)
  @IsDate({ message: i18nValidationMessage("changelog.validation.from_date_invalid") })
  public fromDate: Date;

  @ApiProperty({ description: "End of the period (inclusive), ISO 8601", example: "2026-12-31T23:59:59.999Z", format: "date-time" })
  @Type(() => Date)
  @IsDate({ message: i18nValidationMessage("changelog.validation.to_date_invalid") })
  public toDate: Date;
}
