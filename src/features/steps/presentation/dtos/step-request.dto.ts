/*
 * Funcionalidad: DTOs step-request.dto
 * Descripción: Define los DTOs GetStepsQueryDTO, CreateStepDTO, UpdateStepDTO, ReorderStepsDTO de la feature de pasos (tarjetas), documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { ListQueryDTO } from "@/common/presentation/dtos/list-query.dto";
import { STEP_CONTENT_TYPE_VALUES } from "@/features/steps/domain/value-objects/step-content-type";

export class GetStepsQueryDTO extends ListQueryDTO {
  @ApiPropertyOptional({ description: "Filter by lesson ID", example: "lesson-01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public lessonId?: string;

  @ApiPropertyOptional({ description: "Include inactive steps", example: false, default: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === true || value === "true")
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public includeInactive?: boolean;
}

export class CreateStepDTO {
  @ApiProperty({ description: "Lesson ID", example: "lesson-01" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("steps.validation.lesson_id_required") })
  public lessonId: string;

  @ApiPropertyOptional({ description: "Step title", example: "Concepto clave", maxLength: 200 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(200, { message: i18nValidationMessage("steps.validation.title_max_length") })
  public title?: string;

  @ApiProperty({ description: "Step content, JSON or HTML", example: "<p>Contenido</p>" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("steps.validation.content_required") })
  public content: string;

  @ApiPropertyOptional({ description: "Content type", enum: STEP_CONTENT_TYPE_VALUES, example: "text", default: "text" })
  @IsOptional()
  @IsIn([...STEP_CONTENT_TYPE_VALUES], { message: i18nValidationMessage("steps.validation.content_type_invalid") })
  public contentType?: string;

  @ApiPropertyOptional({ description: "Display order, defaults to the end of the lesson", example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("steps.validation.order_invalid") })
  @Min(0, { message: i18nValidationMessage("steps.validation.order_invalid") })
  public order?: number;
}

export class UpdateStepDTO {
  @ApiPropertyOptional({ description: "Step title", example: "Concepto clave", maxLength: 200 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(200, { message: i18nValidationMessage("steps.validation.title_max_length") })
  public title?: string;

  @ApiPropertyOptional({ description: "Step content, JSON or HTML", example: "<p>Contenido actualizado</p>" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public content?: string;

  @ApiPropertyOptional({ description: "Content type", enum: STEP_CONTENT_TYPE_VALUES, example: "image" })
  @IsOptional()
  @IsIn([...STEP_CONTENT_TYPE_VALUES], { message: i18nValidationMessage("steps.validation.content_type_invalid") })
  public contentType?: string;

  @ApiPropertyOptional({ description: "Display order", example: 1, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("steps.validation.order_invalid") })
  @Min(0, { message: i18nValidationMessage("steps.validation.order_invalid") })
  public order?: number;

  @ApiPropertyOptional({ description: "Whether the step is active", example: true })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public isActive?: boolean;
}

export class ReorderStepsDTO {
  @ApiProperty({ description: "Lesson ID", example: "lesson-01" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("steps.validation.lesson_id_required") })
  public lessonId: string;

  @ApiProperty({ description: "Step IDs in the desired order", example: ["step-02", "step-01"], type: [String] })
  @IsArray({ message: i18nValidationMessage("steps.validation.step_ids_invalid") })
  @ArrayMinSize(1, { message: i18nValidationMessage("steps.validation.step_ids_invalid") })
  @IsString({ each: true, message: i18nValidationMessage("steps.validation.step_ids_invalid") })
  public stepIds: string[];
}
