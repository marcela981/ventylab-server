/*
 * Funcionalidad: DTOs de petición de notificaciones
 * Descripción: Parámetros de consulta del listado paginado de notificaciones del usuario autenticado (página, tamaño y filtro de solo no leídas)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Max, Min } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class ListNotificationsQueryDTO {
  @ApiPropertyOptional({ description: "Page number (1-based)", example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("common.validation.page.must_be_integer") })
  @Min(1, { message: i18nValidationMessage("common.validation.page.min") })
  public page: number = 1;

  @ApiPropertyOptional({ description: "Number of items per page", example: 20, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("common.validation.limit.must_be_integer") })
  @Min(1, { message: i18nValidationMessage("common.validation.limit.min") })
  @Max(100, { message: i18nValidationMessage("common.validation.limit.max") })
  public limit: number = 20;

  @ApiPropertyOptional({ description: "Only unread notifications", example: false, default: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === true || value === "true")
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public unreadOnly: boolean = false;
}
