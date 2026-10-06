/*
 * Funcionalidad: DTOs de solicitud de quizzes
 * Descripción: Valida el filtro por módulo del listado y el cuerpo del intento (respuestas con questionId y selectedOptionId)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class GetQuizzesQueryDTO {
  @ApiPropertyOptional({ description: "Filter by module ID; omit to list every active quiz", example: "module-01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public moduleId?: string;
}

export class QuizAnswerDTO {
  @ApiProperty({ description: "Question identifier inside the quiz", example: "q1" })
  @IsString({ message: i18nValidationMessage("quizzes.validation.answer_invalid") })
  public questionId: string;

  @ApiProperty({ description: "Identifier of the selected option", example: "q1-b" })
  @IsString({ message: i18nValidationMessage("quizzes.validation.answer_invalid") })
  public selectedOptionId: string;
}

export class AttemptQuizDTO {
  @ApiProperty({ description: "Selected option per question", type: QuizAnswerDTO, isArray: true })
  @IsArray({ message: i18nValidationMessage("quizzes.validation.answers_required") })
  @ArrayMinSize(1, { message: i18nValidationMessage("quizzes.validation.answers_required") })
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDTO)
  public answers: QuizAnswerDTO[];
}
