/*
 * Funcionalidad: DTOs de solicitud de entregas de actividades
 * Descripción: Valida el inicio de una entrega, el guardado del borrador (contenido JSON libre) y la calificación (puntaje y retroalimentación)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDefined, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class StartSubmissionDTO {
  @ApiProperty({ description: "Activity ID", example: "cm5activity01" })
  @IsString({ message: i18nValidationMessage("activities.validation.activity_id_required") })
  @IsNotEmpty({ message: i18nValidationMessage("activities.validation.activity_id_required") })
  public activityId: string;
}

export class SaveSubmissionDraftDTO {
  @ApiPropertyOptional({ description: "Draft content (free JSON); omit to keep the current content", example: { answers: ["A", "C"] }, type: Object })
  @IsOptional()
  public content?: unknown;
}

export class GradeSubmissionDTO {
  @ApiProperty({ description: "Score between 0 and the submission maximum score", example: 85 })
  @IsDefined({ message: i18nValidationMessage("activities.validation.score_required") })
  @Type(() => Number)
  @IsNumber({}, { message: i18nValidationMessage("activities.validation.score_required") })
  public score: number;

  @ApiPropertyOptional({ description: "Feedback for the student", example: "Good analysis of the curves", nullable: true, type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public feedback?: string | null;
}
