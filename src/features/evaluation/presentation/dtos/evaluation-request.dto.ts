/*
 * Funcionalidad: DTOs de solicitud de evaluaciones
 * Descripción: Validación y documentación de la creación, edición, cambio de estado y listado paginado de evaluaciones (descripción como texto o documento Tiptap, ubicación curricular, duración, intentos, barajado, visibilidad de resultados y filtros de tipo, estado, búsqueda y autoría)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength, Min, ValidateIf } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { ListQueryDTO } from "@/common/presentation/dtos/list-query.dto";
import { EVALUATION_SORT_BY_VALUES } from "@/features/evaluation/domain/repositories/evaluations.repository";
import { EVALUATION_STATUS_VALUES } from "@/features/evaluation/domain/value-objects/evaluation-status";
import { EVALUATION_TYPE_VALUES } from "@/features/evaluation/domain/value-objects/evaluation-type";

export const EVALUATION_TITLE_MAX_LENGTH: number = 200;

const TIPTAP_EXAMPLE: Record<string, unknown> = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Answer the questions about the ARDS patient" }] }],
};

function isRichTextObject(value: unknown): boolean {
  return value !== undefined && value !== null && typeof value !== "string";
}

export class CreateEvaluationDTO {
  @ApiProperty({ description: "Evaluation type", enum: EVALUATION_TYPE_VALUES, example: "EXAM" })
  @IsIn([...EVALUATION_TYPE_VALUES], { message: i18nValidationMessage("evaluation.validation.type_invalid") })
  public type: string;

  @ApiProperty({ description: "Evaluation title", example: "Mechanical ventilation midterm", maxLength: EVALUATION_TITLE_MAX_LENGTH })
  @IsString({ message: i18nValidationMessage("evaluation.validation.title_required") })
  @IsNotEmpty({ message: i18nValidationMessage("evaluation.validation.title_required") })
  @MaxLength(EVALUATION_TITLE_MAX_LENGTH, { message: i18nValidationMessage("evaluation.validation.title_too_long") })
  public title: string;

  @ApiPropertyOptional({ description: "Plain text or a Tiptap JSON document", oneOf: [{ type: "string" }, { type: "object" }], example: TIPTAP_EXAMPLE })
  @IsOptional()
  @ValidateIf((dto: CreateEvaluationDTO) => isRichTextObject(dto.description))
  @IsObject({ message: i18nValidationMessage("evaluation.validation.description_invalid") })
  public description?: string | Record<string, unknown>;

  @ApiPropertyOptional({ description: "Module the evaluation belongs to", example: "module-01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public moduleId?: string;

  @ApiPropertyOptional({ description: "Level the evaluation belongs to", example: "level-01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public levelId?: string;

  @ApiPropertyOptional({ description: "Lesson the evaluation belongs to", example: "lesson-01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public lessonId?: string;

  @ApiPropertyOptional({ description: "Time limit in minutes", example: 45, minimum: 1 })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage("evaluation.validation.positive_integer") })
  @Min(1, { message: i18nValidationMessage("evaluation.validation.positive_integer") })
  public durationMinutes?: number;

  @ApiPropertyOptional({ description: "Maximum attempts per student (default 1)", example: 1, minimum: 1 })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage("evaluation.validation.positive_integer") })
  @Min(1, { message: i18nValidationMessage("evaluation.validation.positive_integer") })
  public maxAttempts?: number;

  @ApiPropertyOptional({ description: "Shuffle questions for each attempt", example: false })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public shuffleQuestions?: boolean;

  @ApiPropertyOptional({ description: "Show results right after submitting (default true for QUIZ, false for EXAM and WORKSHOP)", example: false })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public showResultsImmediately?: boolean;
}

export class UpdateEvaluationDTO {
  @ApiPropertyOptional({ description: "Evaluation title", example: "Mechanical ventilation midterm", maxLength: EVALUATION_TITLE_MAX_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("evaluation.validation.title_required") })
  @IsNotEmpty({ message: i18nValidationMessage("evaluation.validation.title_required") })
  @MaxLength(EVALUATION_TITLE_MAX_LENGTH, { message: i18nValidationMessage("evaluation.validation.title_too_long") })
  public title?: string;

  @ApiPropertyOptional({
    description: "Plain text or a Tiptap JSON document; null clears it",
    oneOf: [{ type: "string" }, { type: "object" }],
    nullable: true,
    example: TIPTAP_EXAMPLE,
  })
  @IsOptional()
  @ValidateIf((dto: UpdateEvaluationDTO) => isRichTextObject(dto.description))
  @IsObject({ message: i18nValidationMessage("evaluation.validation.description_invalid") })
  public description?: string | Record<string, unknown> | null;

  @ApiPropertyOptional({ description: "Module; null detaches it", example: "module-01", nullable: true, type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public moduleId?: string | null;

  @ApiPropertyOptional({ description: "Level; null detaches it", example: "level-01", nullable: true, type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public levelId?: string | null;

  @ApiPropertyOptional({ description: "Lesson; null detaches it", example: "lesson-01", nullable: true, type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public lessonId?: string | null;

  @ApiPropertyOptional({ description: "Time limit in minutes; null removes it", example: 45, minimum: 1, nullable: true, type: Number })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage("evaluation.validation.positive_integer") })
  @Min(1, { message: i18nValidationMessage("evaluation.validation.positive_integer") })
  public durationMinutes?: number | null;

  @ApiPropertyOptional({ description: "Maximum attempts per student", example: 2, minimum: 1 })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage("evaluation.validation.positive_integer") })
  @Min(1, { message: i18nValidationMessage("evaluation.validation.positive_integer") })
  public maxAttempts?: number;

  @ApiPropertyOptional({ description: "Shuffle questions for each attempt", example: true })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public shuffleQuestions?: boolean;

  @ApiPropertyOptional({ description: "Show results right after submitting", example: false })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public showResultsImmediately?: boolean;

  @ApiPropertyOptional({ description: "Display order among evaluations", example: 0, minimum: 0 })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage("evaluation.validation.order_invalid") })
  @Min(0, { message: i18nValidationMessage("evaluation.validation.order_invalid") })
  public order?: number;
}

export class ChangeEvaluationStatusDTO {
  @ApiProperty({ description: "Target status", enum: EVALUATION_STATUS_VALUES, example: "READY" })
  @IsIn([...EVALUATION_STATUS_VALUES], { message: i18nValidationMessage("evaluation.validation.status_invalid") })
  public status: string;
}

export class GetEvaluationsQueryDTO extends ListQueryDTO {
  @ApiPropertyOptional({ description: "Filter by type", enum: EVALUATION_TYPE_VALUES, example: "QUIZ" })
  @IsOptional()
  @IsIn([...EVALUATION_TYPE_VALUES], { message: i18nValidationMessage("evaluation.validation.type_invalid") })
  public type?: string;

  @ApiPropertyOptional({ description: "Filter by status (archived evaluations are listed only when asked for)", enum: EVALUATION_STATUS_VALUES, example: "DRAFT" })
  @IsOptional()
  @IsIn([...EVALUATION_STATUS_VALUES], { message: i18nValidationMessage("evaluation.validation.status_invalid") })
  public status?: string;

  @ApiPropertyOptional({ description: "Partial, case-insensitive match on the title", example: "ventilation" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public search?: string;

  @ApiPropertyOptional({ description: "Only evaluations created by the caller", enum: ["true", "false"], example: "true" })
  @IsOptional()
  @IsIn(["true", "false"], { message: i18nValidationMessage("common.validation.boolean") })
  public mine?: string;

  @ApiPropertyOptional({ description: "Sort field (default updatedAt)", enum: EVALUATION_SORT_BY_VALUES, example: "updatedAt" })
  @IsOptional()
  @IsIn([...EVALUATION_SORT_BY_VALUES], { message: i18nValidationMessage("evaluation.validation.sort_by_invalid") })
  public sortBy?: string;
}
