/*
 * Funcionalidad: DTOs de solicitud de actividades
 * Descripción: Valida la creación y edición de actividades, el filtro por tipo del catálogo y el filtro por grupo de las entregas de una actividad
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateIf } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { ACTIVITY_TYPE_VALUES } from "@/features/activities/domain/value-objects/activity-type";

export class CreateActivityDTO {
  @ApiProperty({ description: "Activity title", example: "Workshop on ventilation modes" })
  @IsString({ message: i18nValidationMessage("activities.validation.title_required") })
  @IsNotEmpty({ message: i18nValidationMessage("activities.validation.title_required") })
  public title: string;

  @ApiPropertyOptional({ description: "Activity description", example: "Practical workshop", nullable: true, type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public description?: string | null;

  @ApiPropertyOptional({ description: "Instructions for the student", example: "Answer every question", nullable: true, type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public instructions?: string | null;

  @ApiProperty({ description: "Activity type", enum: ACTIVITY_TYPE_VALUES, example: "TALLER" })
  @IsIn([...ACTIVITY_TYPE_VALUES], { message: i18nValidationMessage("activities.validation.type_invalid") })
  public type: string;

  @ApiPropertyOptional({ description: "Maximum score, defaults to 100", example: 100 })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage("activities.validation.max_score_invalid") })
  @IsPositive({ message: i18nValidationMessage("activities.validation.max_score_invalid") })
  public maxScore?: number;

  @ApiPropertyOptional({ description: "Time limit in minutes", example: 60, nullable: true, type: Number })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage("activities.validation.time_limit_invalid") })
  public timeLimit?: number | null;

  @ApiPropertyOptional({ description: "Due date (ISO 8601)", example: "2026-11-30T23:59:59.000Z", nullable: true, type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: i18nValidationMessage("activities.validation.date_invalid") })
  public dueDate?: Date | null;
}

export class UpdateActivityDTO {
  @ApiPropertyOptional({ description: "Activity title", example: "Workshop on ventilation modes" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("activities.validation.title_required") })
  @IsNotEmpty({ message: i18nValidationMessage("activities.validation.title_required") })
  public title?: string;

  @ApiPropertyOptional({ description: "Activity description; null clears it", example: "Practical workshop", nullable: true, type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public description?: string | null;

  @ApiPropertyOptional({ description: "Instructions; null clears them", example: "Answer every question", nullable: true, type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public instructions?: string | null;

  @ApiPropertyOptional({ description: "Activity type", enum: ACTIVITY_TYPE_VALUES, example: "EXAM" })
  @IsOptional()
  @IsIn([...ACTIVITY_TYPE_VALUES], { message: i18nValidationMessage("activities.validation.type_invalid") })
  public type?: string;

  @ApiPropertyOptional({ description: "Maximum score", example: 50 })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage("activities.validation.max_score_invalid") })
  public maxScore?: number;

  @ApiPropertyOptional({ description: "Time limit in minutes; null clears it", example: 45, nullable: true, type: Number })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage("activities.validation.time_limit_invalid") })
  public timeLimit?: number | null;

  @ApiPropertyOptional({ description: "Due date (ISO 8601); null clears it", example: "2026-11-30T23:59:59.000Z", nullable: true, type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: i18nValidationMessage("activities.validation.date_invalid") })
  public dueDate?: Date | null;

  @ApiPropertyOptional({ description: "Whether the activity is active", example: true })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public isActive?: boolean;
}

export class GetActivityCatalogQueryDTO {
  @ApiPropertyOptional({ description: "Filter by activity type", enum: ACTIVITY_TYPE_VALUES, example: "EXAM" })
  @IsOptional()
  @IsIn([...ACTIVITY_TYPE_VALUES], { message: i18nValidationMessage("activities.validation.type_invalid") })
  public type?: string;
}

export class GetActivitySubmissionsQueryDTO {
  @ApiPropertyOptional({ description: "Filter by group ID", example: "cm5group01" })
  @ValidateIf((dto: GetActivitySubmissionsQueryDTO) => dto.groupId !== undefined && dto.groupId !== "")
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public groupId?: string;
}
