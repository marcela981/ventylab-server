/*
 * Funcionalidad: DTOs de solicitud de la calificación docente de evaluaciones
 * Descripción: Consulta paginada de la cola de revisión (evaluación y grupo opcionales) y cuerpos validados con class-validator de la calificación manual de una pregunta (puntaje numérico y comentario opcional, cuyo rango y obligatoriedad se validan en el dominio) y de la publicación masiva por evaluación y grupo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { ListQueryDTO } from "@/common/presentation/dtos/list-query.dto";

export const MAX_TEACHER_COMMENT_LENGTH: number = 2000;

export class GetGradingQueueQueryDTO extends ListQueryDTO {
  @ApiPropertyOptional({ description: "Filter by evaluation", example: "cm5evaluation01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public evaluationId?: string;

  @ApiPropertyOptional({ description: "Filter by STUDENT group", example: "cm5group01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public groupId?: string;
}

export class GradeEvaluationAnswerDTO {
  @ApiProperty({ description: "Manual score between 0 and the question points", example: 2.5 })
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: i18nValidationMessage("evaluation.validation.manual_score_number") })
  public manualScore: number;

  @ApiPropertyOptional({ description: "Comment for the student; required when overriding an existing automatic or manual score", example: "Good reasoning, but the plateau pressure is missing" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(MAX_TEACHER_COMMENT_LENGTH, { message: i18nValidationMessage("evaluation.validation.teacher_comment_too_long") })
  public comment?: string;
}

export class PublishEvaluationGradesDTO {
  @ApiProperty({ description: "Evaluation whose GRADED attempts are published", example: "cm5evaluation01" })
  @IsString({ message: i18nValidationMessage("evaluation.validation.evaluation_id_required") })
  @IsNotEmpty({ message: i18nValidationMessage("evaluation.validation.evaluation_id_required") })
  public evaluationId: string;

  @ApiPropertyOptional({ description: "Only attempts of this STUDENT group", example: "cm5group01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public groupId?: string;
}
