/*
 * Funcionalidad: DTOs lesson-request.dto
 * Descripción: Define los DTOs CreateLessonDTO, UpdateLessonDTO, CompleteLessonDTO, LessonStepsQueryDTO, DeleteLessonQueryDTO de la feature de lecciones, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { CONTENT_STATUS_VALUES, type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";
import { ReorderItemsDTO } from "@/features/curriculum/presentation/dtos/curriculum-write.dto";

export class CreateLessonDTO {
  @ApiProperty({ description: "Lesson title", example: "Introducción a la ventilación", minLength: 3, maxLength: 200 })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @Length(3, 200, { message: i18nValidationMessage("lessons.validation.title_length") })
  public title: string;

  @ApiProperty({
    description: "Lesson content as a JSON object or JSON string with a type and a non-empty sections array",
    example: { type: "theory", sections: [{ type: "theory", title: "Conceptos" }] },
  })
  @IsNotEmpty({ message: i18nValidationMessage("lessons.validation.content_required") })
  public content: unknown;

  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("lessons.validation.module_id_required") })
  public moduleId: string;

  @ApiPropertyOptional({ description: "Display order within the module", example: 0, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("lessons.validation.order_invalid") })
  @Min(0, { message: i18nValidationMessage("lessons.validation.order_invalid") })
  public order?: number;

  @ApiPropertyOptional({ description: "Estimated time in minutes", example: 15, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("lessons.validation.estimated_time_invalid") })
  @Min(0, { message: i18nValidationMessage("lessons.validation.estimated_time_invalid") })
  public estimatedTime?: number;

  @ApiPropertyOptional({ description: "Whether the lesson was generated with AI", example: false, default: false })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public aiGenerated?: boolean;

  @ApiPropertyOptional({ description: "Prompt used to generate the lesson", example: "Explica la ecuación de movimiento" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public sourcePrompt?: string;

  @ApiPropertyOptional({ description: "Publication status", enum: CONTENT_STATUS_VALUES, example: "PUBLISHED" })
  @IsOptional()
  @IsIn([...CONTENT_STATUS_VALUES], { message: i18nValidationMessage("curriculum.validation.status_invalid") })
  public status?: ContentStatusValue;
}

export class UpdateLessonDTO {
  @ApiPropertyOptional({ description: "Lesson title", example: "Introducción a la ventilación", minLength: 3, maxLength: 200 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @Length(3, 200, { message: i18nValidationMessage("lessons.validation.title_length") })
  public title?: string;

  @ApiPropertyOptional({
    description: "Lesson content as a JSON object or JSON string with a type and a non-empty sections array",
    example: { type: "theory", sections: [{ type: "theory", title: "Conceptos" }] },
  })
  @IsOptional()
  public content?: unknown;

  @ApiPropertyOptional({ description: "Display order within the module", example: 1, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("lessons.validation.order_invalid") })
  @Min(0, { message: i18nValidationMessage("lessons.validation.order_invalid") })
  public order?: number;

  @ApiPropertyOptional({ description: "Estimated time in minutes", example: 20, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("lessons.validation.estimated_time_invalid") })
  @Min(0, { message: i18nValidationMessage("lessons.validation.estimated_time_invalid") })
  public estimatedTime?: number;

  @ApiPropertyOptional({ description: "Whether the lesson was generated with AI", example: false })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public aiGenerated?: boolean;

  @ApiPropertyOptional({ description: "Prompt used to generate the lesson", example: "Explica la ecuación de movimiento" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public sourcePrompt?: string;

  @ApiPropertyOptional({ description: "Publication status", enum: CONTENT_STATUS_VALUES, example: "PUBLISHED" })
  @IsOptional()
  @IsIn([...CONTENT_STATUS_VALUES], { message: i18nValidationMessage("curriculum.validation.status_invalid") })
  public status?: ContentStatusValue;
}

export class CompleteLessonDTO {
  @ApiPropertyOptional({ description: "Time spent in the lesson, in seconds", example: 300, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("lessons.validation.time_spent_invalid") })
  @Min(0, { message: i18nValidationMessage("lessons.validation.time_spent_invalid") })
  public timeSpent?: number;
}

export class LessonStepsQueryDTO {
  @ApiPropertyOptional({ description: "Include inactive steps", example: false, default: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === true || value === "true")
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public includeInactive?: boolean;
}

export class ReorderLessonsDTO extends ReorderItemsDTO {
  @ApiProperty({ description: "Module whose lessons are reordered", example: "module-01-inversion-fisiologica" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("common.validation.string") })
  public moduleId: string;
}
