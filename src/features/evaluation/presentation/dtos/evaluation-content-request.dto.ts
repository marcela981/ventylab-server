/*
 * Funcionalidad: DTOs de solicitud del contenido de evaluaciones
 * Descripción: Validación y documentación de altas y ediciones de escenarios, preguntas y opciones (contenido Tiptap, medios, puntos, rúbrica, caso clínico) y de los reordenamientos por lotes de preguntas, escenarios y opciones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { EVALUATION_QUESTION_TYPE_VALUES } from "@/features/evaluation/domain/value-objects/evaluation-question-type";

export const MAX_REORDER_ITEMS: number = 500;
export const MAX_MEDIA_PER_ITEM: number = 20;
export const MAX_OPTIONS_PER_QUESTION: number = 20;

const TIPTAP_EXAMPLE: Record<string, unknown> = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Which PEEP would you set for this patient?" }] }],
};

const RUBRIC_EXAMPLE: Record<string, unknown> = {
  criteria: [{ parameter: "peep", expectedValue: 8, min: 6, max: 10, priority: "CRITICO" }],
  justification: "Lung protective ventilation",
};

export class CreateEvaluationScenarioDTO {
  @ApiProperty({ description: "Scenario content as a Tiptap JSON document", type: "object", additionalProperties: true, example: TIPTAP_EXAMPLE })
  @IsObject({ message: i18nValidationMessage("evaluation.validation.content_must_be_object") })
  public content: Record<string, unknown>;

  @ApiPropertyOptional({ description: "Media attached to the scenario", type: [String], example: ["cm5media01"] })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("evaluation.validation.media_ids_invalid") })
  @ArrayMaxSize(MAX_MEDIA_PER_ITEM, { message: i18nValidationMessage("evaluation.validation.media_ids_invalid") })
  @IsString({ each: true, message: i18nValidationMessage("evaluation.validation.media_ids_invalid") })
  public mediaIds?: string[];
}

export class UpdateEvaluationScenarioDTO {
  @ApiPropertyOptional({ description: "Scenario content as a Tiptap JSON document", type: "object", additionalProperties: true, example: TIPTAP_EXAMPLE })
  @IsOptional()
  @IsObject({ message: i18nValidationMessage("evaluation.validation.content_must_be_object") })
  public content?: Record<string, unknown>;

  @ApiPropertyOptional({ description: "Media attached to the scenario (replaces the list)", type: [String], example: ["cm5media01"] })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("evaluation.validation.media_ids_invalid") })
  @ArrayMaxSize(MAX_MEDIA_PER_ITEM, { message: i18nValidationMessage("evaluation.validation.media_ids_invalid") })
  @IsString({ each: true, message: i18nValidationMessage("evaluation.validation.media_ids_invalid") })
  public mediaIds?: string[];
}

export class CreateEvaluationOptionDTO {
  @ApiProperty({ description: "Option text", example: "8 cmH2O" })
  @IsString({ message: i18nValidationMessage("evaluation.validation.option_content_required") })
  @IsNotEmpty({ message: i18nValidationMessage("evaluation.validation.option_content_required") })
  public content: string;

  @ApiPropertyOptional({ description: "Whether this option is correct (default false)", example: true })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public isCorrect?: boolean;

  @ApiPropertyOptional({ description: "Media shown with the option", example: "cm5media02" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public mediaId?: string;
}

export class UpdateEvaluationOptionDTO {
  @ApiPropertyOptional({ description: "Option text", example: "8 cmH2O" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("evaluation.validation.option_content_required") })
  @IsNotEmpty({ message: i18nValidationMessage("evaluation.validation.option_content_required") })
  public content?: string;

  @ApiPropertyOptional({ description: "Whether this option is correct", example: true })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public isCorrect?: boolean;

  @ApiPropertyOptional({ description: "Media shown with the option; null removes it", example: "cm5media02", nullable: true, type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public mediaId?: string | null;
}

export class CreateEvaluationQuestionDTO {
  @ApiProperty({ description: "Question type", enum: EVALUATION_QUESTION_TYPE_VALUES, example: "SINGLE_CHOICE" })
  @IsIn([...EVALUATION_QUESTION_TYPE_VALUES], { message: i18nValidationMessage("evaluation.validation.question_type_invalid") })
  public type: string;

  @ApiProperty({ description: "Question prompt as a Tiptap JSON document", type: "object", additionalProperties: true, example: TIPTAP_EXAMPLE })
  @IsObject({ message: i18nValidationMessage("evaluation.validation.content_must_be_object") })
  public prompt: Record<string, unknown>;

  @ApiPropertyOptional({ description: "Points awarded (default 1)", example: 2 })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage("evaluation.validation.points_positive") })
  @IsPositive({ message: i18nValidationMessage("evaluation.validation.points_positive") })
  public points?: number;

  @ApiPropertyOptional({ description: "Explanation shown with the results", example: "A PEEP of 8 keeps the alveoli open" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public explanation?: string;

  @ApiPropertyOptional({ description: "Scenario of the same evaluation the question belongs to", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public scenarioId?: string;

  @ApiPropertyOptional({ description: "Media attached to the question", type: [String], example: ["cm5media01"] })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("evaluation.validation.media_ids_invalid") })
  @ArrayMaxSize(MAX_MEDIA_PER_ITEM, { message: i18nValidationMessage("evaluation.validation.media_ids_invalid") })
  @IsString({ each: true, message: i18nValidationMessage("evaluation.validation.media_ids_invalid") })
  public mediaIds?: string[];

  @ApiPropertyOptional({ description: "Clinical case used by a SIMULATION question", example: "case-ards-01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public clinicalCaseId?: string;

  @ApiPropertyOptional({ description: "Rubric of a SIMULATION question", type: "object", additionalProperties: true, example: RUBRIC_EXAMPLE })
  @IsOptional()
  @IsObject({ message: i18nValidationMessage("evaluation.validation.rubric_must_be_object") })
  public rubric?: Record<string, unknown>;

  @ApiPropertyOptional({ description: "Options of a choice question, in order", type: [CreateEvaluationOptionDTO] })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("evaluation.validation.options_invalid") })
  @ArrayMaxSize(MAX_OPTIONS_PER_QUESTION, { message: i18nValidationMessage("evaluation.validation.options_invalid") })
  @ValidateNested({ each: true })
  @Type(() => CreateEvaluationOptionDTO)
  public options?: CreateEvaluationOptionDTO[];
}

export class UpdateEvaluationQuestionDTO {
  @ApiPropertyOptional({ description: "Question type", enum: EVALUATION_QUESTION_TYPE_VALUES, example: "MULTIPLE_CHOICE" })
  @IsOptional()
  @IsIn([...EVALUATION_QUESTION_TYPE_VALUES], { message: i18nValidationMessage("evaluation.validation.question_type_invalid") })
  public type?: string;

  @ApiPropertyOptional({ description: "Question prompt as a Tiptap JSON document", type: "object", additionalProperties: true, example: TIPTAP_EXAMPLE })
  @IsOptional()
  @IsObject({ message: i18nValidationMessage("evaluation.validation.content_must_be_object") })
  public prompt?: Record<string, unknown>;

  @ApiPropertyOptional({ description: "Points awarded", example: 2 })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage("evaluation.validation.points_positive") })
  @IsPositive({ message: i18nValidationMessage("evaluation.validation.points_positive") })
  public points?: number;

  @ApiPropertyOptional({ description: "Explanation; null removes it", example: "A PEEP of 8 keeps the alveoli open", nullable: true, type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public explanation?: string | null;

  @ApiPropertyOptional({ description: "Scenario of the same evaluation; null detaches it", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f", nullable: true, type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public scenarioId?: string | null;

  @ApiPropertyOptional({ description: "Media attached to the question (replaces the list)", type: [String], example: ["cm5media01"] })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("evaluation.validation.media_ids_invalid") })
  @ArrayMaxSize(MAX_MEDIA_PER_ITEM, { message: i18nValidationMessage("evaluation.validation.media_ids_invalid") })
  @IsString({ each: true, message: i18nValidationMessage("evaluation.validation.media_ids_invalid") })
  public mediaIds?: string[];

  @ApiPropertyOptional({ description: "Clinical case; null detaches it", example: "case-ards-01", nullable: true, type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public clinicalCaseId?: string | null;

  @ApiPropertyOptional({ description: "Rubric of a SIMULATION question; null removes it", type: "object", additionalProperties: true, nullable: true, example: RUBRIC_EXAMPLE })
  @IsOptional()
  @IsObject({ message: i18nValidationMessage("evaluation.validation.rubric_must_be_object") })
  public rubric?: Record<string, unknown> | null;
}

export class ReorderItemDTO {
  @ApiProperty({ description: "Item ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  @IsString({ message: i18nValidationMessage("evaluation.validation.reorder_id_required") })
  @IsNotEmpty({ message: i18nValidationMessage("evaluation.validation.reorder_id_required") })
  public id: string;

  @ApiProperty({ description: "New position (0-based)", example: 0, minimum: 0 })
  @IsInt({ message: i18nValidationMessage("evaluation.validation.order_invalid") })
  @Min(0, { message: i18nValidationMessage("evaluation.validation.order_invalid") })
  public order: number;
}

export class QuestionReorderItemDTO extends ReorderItemDTO {
  @ApiPropertyOptional({ description: "Move the question to this scenario; null detaches it; omit to keep it", example: null, nullable: true, type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public scenarioId?: string | null;
}

export class ReorderItemsDTO {
  @ApiProperty({ description: "Items with their new order", type: [ReorderItemDTO] })
  @IsArray({ message: i18nValidationMessage("evaluation.validation.items_required") })
  @ArrayMinSize(1, { message: i18nValidationMessage("evaluation.validation.items_required") })
  @ArrayMaxSize(MAX_REORDER_ITEMS, { message: i18nValidationMessage("evaluation.validation.items_required") })
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDTO)
  public items: ReorderItemDTO[];
}

export class ReorderQuestionsDTO {
  @ApiProperty({ description: "Questions with their new order and optional scenario", type: [QuestionReorderItemDTO] })
  @IsArray({ message: i18nValidationMessage("evaluation.validation.items_required") })
  @ArrayMinSize(1, { message: i18nValidationMessage("evaluation.validation.items_required") })
  @ArrayMaxSize(MAX_REORDER_ITEMS, { message: i18nValidationMessage("evaluation.validation.items_required") })
  @ValidateNested({ each: true })
  @Type(() => QuestionReorderItemDTO)
  public items: QuestionReorderItemDTO[];
}
