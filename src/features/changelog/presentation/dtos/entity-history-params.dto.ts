/*
 * Funcionalidad: DTOs entity-history-params.dto
 * Descripción: Define los DTOs EntityHistoryParamsDTO de la feature de historial de cambios, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsString } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { QUERYABLE_CHANGE_LOG_ENTITY_TYPES } from "@/features/changelog/domain/value-objects/change-log-entity-type";

export class EntityHistoryParamsDTO {
  @ApiProperty({ description: "Entity type", enum: QUERYABLE_CHANGE_LOG_ENTITY_TYPES, example: "Module" })
  @IsIn([...QUERYABLE_CHANGE_LOG_ENTITY_TYPES], { message: i18nValidationMessage("changelog.validation.entity_type_invalid") })
  public entityType: string;

  @ApiProperty({ description: "Entity ID", example: "module-01-inversion-fisiologica" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("changelog.validation.entity_id_required") })
  public entityId: string;
}
