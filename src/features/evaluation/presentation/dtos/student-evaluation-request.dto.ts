/*
 * Funcionalidad: DTOs de solicitud de intentos del estudiante
 * Descripción: Cuerpos validados con class-validator del autoguardado de una respuesta (opciones elegidas, texto o sesión del simulador) y de la entrega con respuestas finales opcionales por pregunta; la forma según el tipo de pregunta se valida en el dominio
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { MAX_OPEN_TEXT_ANSWER_LENGTH } from "@/features/evaluation/domain/services/evaluation-answer-validation";

export const MAX_SELECTED_OPTIONS: number = 20;
export const MAX_SUBMITTED_ANSWERS: number = 500;

export class SaveEvaluationAnswerDTO {
  @ApiPropertyOptional({ description: "Selected option IDs (choice questions)", example: ["cm5option01"], type: [String] })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("evaluation.validation.selected_option_ids_invalid") })
  @ArrayMaxSize(MAX_SELECTED_OPTIONS, { message: i18nValidationMessage("evaluation.validation.selected_option_ids_invalid") })
  @IsString({ each: true, message: i18nValidationMessage("evaluation.validation.selected_option_ids_invalid") })
  public selectedOptionIds?: string[];

  @ApiPropertyOptional({ description: "Text answer (OPEN_TEXT questions)", example: "I would raise PEEP to 10 cmH2O", maxLength: MAX_OPEN_TEXT_ANSWER_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(MAX_OPEN_TEXT_ANSWER_LENGTH, { message: i18nValidationMessage("evaluation.validation.text_answer_too_long") })
  public textAnswer?: string;

  @ApiPropertyOptional({ description: "Simulator session that answers a SIMULATION question; must belong to the caller", example: "cm5session01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("common.validation.string") })
  public simulationSessionId?: string;
}

export class SubmitEvaluationAnswerDTO extends SaveEvaluationAnswerDTO {
  @ApiProperty({ description: "Question ID", example: "cm5question01" })
  @IsString({ message: i18nValidationMessage("evaluation.validation.question_id_required") })
  @IsNotEmpty({ message: i18nValidationMessage("evaluation.validation.question_id_required") })
  public questionId: string;
}

export class SubmitEvaluationAttemptDTO {
  @ApiPropertyOptional({
    description: "Final answers applied before closing, only while the deadline plus 30 s grace has not passed",
    type: [SubmitEvaluationAnswerDTO],
  })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("evaluation.validation.answers_invalid") })
  @ArrayMaxSize(MAX_SUBMITTED_ANSWERS, { message: i18nValidationMessage("evaluation.validation.answers_invalid") })
  @ValidateNested({ each: true })
  @Type(() => SubmitEvaluationAnswerDTO)
  public answers?: SubmitEvaluationAnswerDTO[];
}
