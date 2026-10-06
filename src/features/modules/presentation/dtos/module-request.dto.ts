/*
 * Funcionalidad: DTOs module-request.dto
 * Descripción: Define los DTOs GetModulesQueryDTO, CreateModuleDTO, UpdateModuleDTO, AddModulePrerequisiteDTO de la feature de módulos, documentados para Swagger y validados con class-validator cuando son de entrada
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

import { ListQueryDTO } from "@/common/presentation/dtos/list-query.dto";
import { CONTENT_STATUS_VALUES, type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";
import { ReorderItemsDTO } from "@/features/curriculum/presentation/dtos/curriculum-write.dto";
import { MODULE_DIFFICULTY_VALUES } from "@/features/modules/domain/value-objects/module-difficulty";

export class GetModulesQueryDTO extends ListQueryDTO {
  @ApiPropertyOptional({ description: "Filter by category", example: "pathologies" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public category?: string;

  @ApiPropertyOptional({ description: "Filter by difficulty", example: "beginner" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public difficulty?: string;
}

export class CreateModuleDTO {
  @ApiProperty({ description: "Module title", example: "Inversión fisiológica", minLength: 3, maxLength: 200 })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @Length(3, 200, { message: i18nValidationMessage("modules.validation.title_length") })
  public title: string;

  @ApiPropertyOptional({ description: "Level ID the module belongs to", example: "level-beginner" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public levelId?: string;

  @ApiPropertyOptional({ description: "Module description", example: "Fundamentos", maxLength: 1000 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(1000, { message: i18nValidationMessage("modules.validation.description_max_length") })
  public description?: string;

  @ApiPropertyOptional({ description: "Module category", example: "pathologies", maxLength: 100 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(100, { message: i18nValidationMessage("modules.validation.category_max_length") })
  public category?: string;

  @ApiPropertyOptional({ description: "Module difficulty", enum: MODULE_DIFFICULTY_VALUES, example: "beginner" })
  @IsOptional()
  @IsIn([...MODULE_DIFFICULTY_VALUES], { message: i18nValidationMessage("modules.validation.difficulty_invalid") })
  public difficulty?: string;

  @ApiPropertyOptional({ description: "Estimated time in minutes", example: 45, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("modules.validation.estimated_time_invalid") })
  @Min(0, { message: i18nValidationMessage("modules.validation.estimated_time_invalid") })
  public estimatedTime?: number;

  @ApiPropertyOptional({ description: "Display order", example: 1, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("modules.validation.order_invalid") })
  @Min(0, { message: i18nValidationMessage("modules.validation.order_invalid") })
  public order?: number;

  @ApiPropertyOptional({ description: "IDs of prerequisite modules", example: ["respiratory-physiology"], type: [String] })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("modules.validation.prerequisite_ids_invalid") })
  @IsString({ each: true, message: i18nValidationMessage("modules.validation.prerequisite_ids_invalid") })
  public prerequisiteIds?: string[];

  @ApiPropertyOptional({ description: "Thumbnail URL", example: "https://example.com/thumbnail.png" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public thumbnail?: string;

  @ApiPropertyOptional({ description: "Publication status", enum: CONTENT_STATUS_VALUES, example: "PUBLISHED" })
  @IsOptional()
  @IsIn([...CONTENT_STATUS_VALUES], { message: i18nValidationMessage("curriculum.validation.status_invalid") })
  public status?: ContentStatusValue;
}

export class UpdateModuleDTO {
  @ApiPropertyOptional({ description: "Module title", example: "Inversión fisiológica", minLength: 3, maxLength: 200 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @Length(3, 200, { message: i18nValidationMessage("modules.validation.title_length") })
  public title?: string;

  @ApiPropertyOptional({ description: "Module description", example: "Fundamentos", maxLength: 1000 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(1000, { message: i18nValidationMessage("modules.validation.description_max_length") })
  public description?: string;

  @ApiPropertyOptional({ description: "Module category", example: "pathologies", maxLength: 100 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(100, { message: i18nValidationMessage("modules.validation.category_max_length") })
  public category?: string;

  @ApiPropertyOptional({ description: "Module difficulty", enum: MODULE_DIFFICULTY_VALUES, example: "intermediate" })
  @IsOptional()
  @IsIn([...MODULE_DIFFICULTY_VALUES], { message: i18nValidationMessage("modules.validation.difficulty_invalid") })
  public difficulty?: string;

  @ApiPropertyOptional({ description: "Estimated time in minutes", example: 60, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("modules.validation.estimated_time_invalid") })
  @Min(0, { message: i18nValidationMessage("modules.validation.estimated_time_invalid") })
  public estimatedTime?: number;

  @ApiPropertyOptional({ description: "Display order", example: 2, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("modules.validation.order_invalid") })
  @Min(0, { message: i18nValidationMessage("modules.validation.order_invalid") })
  public order?: number;

  @ApiPropertyOptional({ description: "Whether the module is active", example: true })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public isActive?: boolean;

  @ApiPropertyOptional({ description: "Thumbnail URL", example: "https://example.com/thumbnail.png" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public thumbnail?: string;

  @ApiPropertyOptional({ description: "Publication status", enum: CONTENT_STATUS_VALUES, example: "PUBLISHED" })
  @IsOptional()
  @IsIn([...CONTENT_STATUS_VALUES], { message: i18nValidationMessage("curriculum.validation.status_invalid") })
  public status?: ContentStatusValue;
}

export class AddModulePrerequisiteDTO {
  @ApiProperty({ description: "ID of the module that must be completed first", example: "respiratory-physiology" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("modules.validation.prerequisite_id_required") })
  public prerequisiteId: string;
}

export class SetModulePrerequisitesDTO {
  @ApiProperty({ description: "Complete list of prerequisite module IDs; an empty list removes every prerequisite", example: ["respiratory-physiology"], type: [String] })
  @IsArray({ message: i18nValidationMessage("modules.validation.prerequisite_ids_invalid") })
  @IsString({ each: true, message: i18nValidationMessage("modules.validation.prerequisite_ids_invalid") })
  public prerequisiteIds: string[];
}

export class ReorderModulesDTO extends ReorderItemsDTO {
  @ApiProperty({ description: "Level whose modules are reordered", example: "level-beginner" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("common.validation.string") })
  public levelId: string;
}
