/*
 * Funcionalidad: DTOs level-request.dto
 * Descripción: Define los DTOs CreateLevelDTO, UpdateLevelDTO, ReorderLevelsDTO, AddLevelPrerequisiteDTO de la feature de niveles, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, MaxLength, Min } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { CONTENT_STATUS_VALUES, type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";
import { LEVEL_TRACK_VALUES } from "@/features/levels/domain/value-objects/level-track";

export class CreateLevelDTO {
  @ApiProperty({ description: "Level title", example: "Nivel principiante", minLength: 2, maxLength: 100 })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @Length(2, 100, { message: i18nValidationMessage("levels.validation.title_length") })
  public title: string;

  @ApiPropertyOptional({ description: "Curriculum track", enum: LEVEL_TRACK_VALUES, example: "mecanica", default: "mecanica" })
  @IsOptional()
  @IsIn([...LEVEL_TRACK_VALUES], { message: i18nValidationMessage("levels.validation.track_invalid") })
  public track?: string;

  @ApiPropertyOptional({ description: "Level description", example: "Fundamentos de ventilación mecánica", maxLength: 1000 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(1000, { message: i18nValidationMessage("levels.validation.description_max_length") })
  public description?: string;

  @ApiPropertyOptional({ description: "Display order, defaults to the next available position", example: 2, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("levels.validation.order_invalid") })
  @Min(0, { message: i18nValidationMessage("levels.validation.order_invalid") })
  public order?: number;

  @ApiPropertyOptional({ description: "Publication status", enum: CONTENT_STATUS_VALUES, example: "PUBLISHED" })
  @IsOptional()
  @IsIn([...CONTENT_STATUS_VALUES], { message: i18nValidationMessage("curriculum.validation.status_invalid") })
  public status?: ContentStatusValue;

  @ApiPropertyOptional({ description: "Section ID the level belongs to", example: "cm5x2k9a00000abcd1234efgh" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("common.validation.string") })
  public sectionId?: string;
}

export class UpdateLevelDTO {
  @ApiPropertyOptional({ description: "Level title", example: "Nivel principiante", minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @Length(2, 100, { message: i18nValidationMessage("levels.validation.title_length") })
  public title?: string;

  @ApiPropertyOptional({ description: "Curriculum track", enum: LEVEL_TRACK_VALUES, example: "ventylab" })
  @IsOptional()
  @IsIn([...LEVEL_TRACK_VALUES], { message: i18nValidationMessage("levels.validation.track_invalid") })
  public track?: string;

  @ApiPropertyOptional({ description: "Level description", example: "Fundamentos de ventilación mecánica", maxLength: 1000 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(1000, { message: i18nValidationMessage("levels.validation.description_max_length") })
  public description?: string;

  @ApiPropertyOptional({ description: "Display order", example: 3, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("levels.validation.order_invalid") })
  @Min(0, { message: i18nValidationMessage("levels.validation.order_invalid") })
  public order?: number;

  @ApiPropertyOptional({ description: "Whether the level is active", example: true })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public isActive?: boolean;

  @ApiPropertyOptional({ description: "Publication status", enum: CONTENT_STATUS_VALUES, example: "PUBLISHED" })
  @IsOptional()
  @IsIn([...CONTENT_STATUS_VALUES], { message: i18nValidationMessage("curriculum.validation.status_invalid") })
  public status?: ContentStatusValue;

  @ApiPropertyOptional({ description: "Section ID the level belongs to", example: "cm5x2k9a00000abcd1234efgh" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("common.validation.string") })
  public sectionId?: string;
}

export class ReorderLevelsDTO {
  @ApiProperty({ description: "Level IDs in the desired order", example: ["level-prerequisitos", "level-beginner"], type: [String] })
  @IsArray({ message: i18nValidationMessage("levels.validation.level_ids_invalid") })
  @IsString({ each: true, message: i18nValidationMessage("levels.validation.level_ids_invalid") })
  public levelIds: string[];
}

export class AddLevelPrerequisiteDTO {
  @ApiProperty({ description: "ID of the level that must be completed first", example: "level-beginner" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("levels.validation.prerequisite_level_id_required") })
  public prerequisiteLevelId: string;
}

export class SetLevelPrerequisitesDTO {
  @ApiProperty({ description: "Complete list of prerequisite level IDs; an empty list removes every prerequisite", example: ["level-beginner"], type: [String] })
  @IsArray({ message: i18nValidationMessage("levels.validation.level_ids_invalid") })
  @IsString({ each: true, message: i18nValidationMessage("levels.validation.level_ids_invalid") })
  public prerequisiteLevelIds: string[];
}
