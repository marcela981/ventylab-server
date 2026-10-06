/*
 * Funcionalidad: DTOs get-changelog-query.dto
 * Descripción: Define los DTOs GetChangeLogQueryDTO de la feature de historial de cambios, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { ListQueryDTO } from "@/common/presentation/dtos/list-query.dto";
import { CHANGE_LOG_ACTION_VALUES } from "@/features/changelog/domain/value-objects/change-log-action";
import { QUERYABLE_CHANGE_LOG_ENTITY_TYPES } from "@/features/changelog/domain/value-objects/change-log-entity-type";

export class GetChangeLogQueryDTO extends ListQueryDTO {
  @ApiPropertyOptional({ description: "Filter by entity type", enum: QUERYABLE_CHANGE_LOG_ENTITY_TYPES, example: "Level" })
  @IsOptional()
  @IsIn([...QUERYABLE_CHANGE_LOG_ENTITY_TYPES], { message: i18nValidationMessage("changelog.validation.entity_type_invalid") })
  public entityType?: string;

  @ApiPropertyOptional({ description: "Filter by entity ID", example: "level-beginner" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public entityId?: string;

  @ApiPropertyOptional({ description: "Filter by action", enum: CHANGE_LOG_ACTION_VALUES, example: "update" })
  @IsOptional()
  @IsIn([...CHANGE_LOG_ACTION_VALUES], { message: i18nValidationMessage("changelog.validation.action_invalid") })
  public action?: string;

  @ApiPropertyOptional({ description: "Filter by the user who made the change. Ignored for teachers, who only see their own changes.", example: "cm5x2k9a00000abcd1234efgh" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public changedBy?: string;
}
