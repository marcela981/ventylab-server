/*
 * Funcionalidad: DTOs get-recent-changes-query.dto
 * Descripción: Define los DTOs GetRecentChangesQueryDTO de la feature de historial de cambios, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class GetRecentChangesQueryDTO {
  @ApiPropertyOptional({ description: "Number of recent changes to return", example: 20, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("common.validation.limit.must_be_integer") })
  @Min(1, { message: i18nValidationMessage("common.validation.limit.min") })
  @Max(100, { message: i18nValidationMessage("common.validation.limit.max") })
  public limit: number = 20;
}
