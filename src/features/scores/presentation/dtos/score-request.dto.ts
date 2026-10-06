/*
 * Funcionalidad: DTOs de petición de calificaciones
 * Descripción: Validación y documentación Swagger del cuerpo para registrar una calificación y del filtro por estudiante de las calificaciones propias
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { SCORE_ENTITY_TYPE_VALUES } from "@/features/scores/domain/value-objects/score-entity-type";

export class UpsertScoreDTO {
  @ApiProperty({ description: "Student user ID", example: "cm5student01" })
  @IsString({ message: i18nValidationMessage("scores.validation.required_fields") })
  @IsNotEmpty({ message: i18nValidationMessage("scores.validation.required_fields") })
  public studentId: string;

  @ApiProperty({ description: "Type of the graded element", enum: SCORE_ENTITY_TYPE_VALUES, example: "MODULE" })
  @IsIn([...SCORE_ENTITY_TYPE_VALUES], { message: i18nValidationMessage("scores.validation.entity_type_invalid") })
  public entityType: string;

  @ApiProperty({ description: "ID of the graded element, or a custom label", example: "cm5module01" })
  @IsString({ message: i18nValidationMessage("scores.validation.required_fields") })
  @IsNotEmpty({ message: i18nValidationMessage("scores.validation.required_fields") })
  public entityId: string;

  @ApiProperty({ description: "Points awarded", example: 85 })
  @Type(() => Number)
  @IsNumber({}, { message: i18nValidationMessage("scores.validation.required_fields") })
  public score: number;

  @ApiPropertyOptional({ description: "Maximum points (defaults to 100)", example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: i18nValidationMessage("scores.validation.max_score_invalid") })
  public maxScore?: number;

  @ApiPropertyOptional({ description: "Teacher notes; when omitted on an update the previous notes are kept", example: "Good work" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public notes?: string;
}

export class GetMyScoresQueryDTO {
  @ApiPropertyOptional({ description: "Only scores given to this student", example: "cm5student01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public studentId?: string;
}
