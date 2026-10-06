/*
 * Funcionalidad: DTOs de solicitud de progreso
 * Descripción: Define y valida los cuerpos y parámetros de consulta de las rutas de progreso (lección, pasos y detalle)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class ProgressLessonQueryDTO {
  @ApiPropertyOptional({ description: "Module ID used to resolve legacy lesson IDs", example: "module-01-inversion-fisiologica" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public moduleId?: string;
}

export class LessonProgressDetailsQueryDTO {
  @ApiProperty({ description: "Module ID that contains the lesson", example: "module-01-inversion-fisiologica" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("progress.validation.module_id_required") })
  public moduleId: string;
}

export class UpdateLessonProgressDTO {
  @ApiPropertyOptional({ description: "Whether the lesson is completed; a completed lesson is never reverted", example: false, default: false })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public completed?: boolean;

  @ApiPropertyOptional({ description: "Seconds spent since the last update", example: 30, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("progress.validation.time_spent_invalid") })
  @Min(0, { message: i18nValidationMessage("progress.validation.time_spent_invalid") })
  public timeSpent?: number;

  @ApiPropertyOptional({ description: "One-based current step; sent together with totalSteps to track step progress", example: 3, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("progress.validation.step_invalid") })
  @Min(0, { message: i18nValidationMessage("progress.validation.step_invalid") })
  public currentStep?: number;

  @ApiPropertyOptional({ description: "Number of steps in the lesson", example: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("progress.validation.total_steps_invalid") })
  @Min(1, { message: i18nValidationMessage("progress.validation.total_steps_invalid") })
  public totalSteps?: number;

  @ApiPropertyOptional({ description: "Quiz score, 0 to 100", example: 80, minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: i18nValidationMessage("progress.validation.score_invalid") })
  @Min(0, { message: i18nValidationMessage("progress.validation.score_invalid") })
  @Max(100, { message: i18nValidationMessage("progress.validation.score_invalid") })
  public quizScore?: number;
}

export class UpdateStepProgressDTO {
  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("progress.validation.module_id_required") })
  public moduleId: string;

  @ApiProperty({ description: "Lesson ID or legacy lesson ID", example: "lesson-inversion-fisiologica" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("progress.validation.lesson_id_required") })
  public lessonId: string;

  @ApiProperty({ description: "Zero-based current step index", example: 5, minimum: 0 })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("progress.validation.step_invalid") })
  @Min(0, { message: i18nValidationMessage("progress.validation.step_invalid") })
  public currentStepIndex: number;

  @ApiProperty({ description: "Number of steps in the lesson", example: 10, minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("progress.validation.total_steps_invalid") })
  @Min(1, { message: i18nValidationMessage("progress.validation.total_steps_invalid") })
  public totalSteps: number;

  @ApiPropertyOptional({ description: "Seconds spent since the last update", example: 30, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("progress.validation.time_spent_invalid") })
  @Min(0, { message: i18nValidationMessage("progress.validation.time_spent_invalid") })
  public timeSpentDelta?: number;
}
