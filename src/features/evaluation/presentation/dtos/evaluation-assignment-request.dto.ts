/*
 * Funcionalidad: DTOs de solicitud de asignaciones de evaluación
 * Descripción: Validación y documentación de la activación para varios grupos con ventana [startsAt, endsAt], de la edición de la ventana y del listado paginado de gestión filtrado por grupo, evaluación y estado derivado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsDate, IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { ListQueryDTO } from "@/common/presentation/dtos/list-query.dto";
import { EVALUATION_ASSIGNMENT_STATE_VALUES } from "@/features/evaluation/domain/value-objects/evaluation-assignment-state";

export const MAX_ASSIGNMENT_GROUPS: number = 50;

export class CreateEvaluationAssignmentsDTO {
  @ApiProperty({ description: "STUDENT groups to activate the evaluation for (all or nothing)", example: ["cm5group01", "cm5group02"], type: [String] })
  @IsArray({ message: i18nValidationMessage("evaluation.validation.group_ids_invalid") })
  @ArrayNotEmpty({ message: i18nValidationMessage("evaluation.validation.group_ids_invalid") })
  @ArrayMaxSize(MAX_ASSIGNMENT_GROUPS, { message: i18nValidationMessage("evaluation.validation.group_ids_invalid") })
  @IsString({ each: true, message: i18nValidationMessage("evaluation.validation.group_ids_invalid") })
  @IsNotEmpty({ each: true, message: i18nValidationMessage("evaluation.validation.group_ids_invalid") })
  public groupIds: string[];

  @ApiProperty({ description: "When the evaluation opens (ISO 8601)", example: "2026-10-06T08:00:00.000Z", type: Date })
  @Type(() => Date)
  @IsDate({ message: i18nValidationMessage("evaluation.validation.date_invalid") })
  public startsAt: Date;

  @ApiProperty({ description: "When the evaluation closes (ISO 8601); must be after startsAt and in the future", example: "2026-10-06T10:00:00.000Z", type: Date })
  @Type(() => Date)
  @IsDate({ message: i18nValidationMessage("evaluation.validation.date_invalid") })
  public endsAt: Date;
}

export class UpdateEvaluationAssignmentDTO {
  @ApiPropertyOptional({ description: "New opening time (ISO 8601); only for UPCOMING assignments", example: "2026-10-06T09:00:00.000Z", type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: i18nValidationMessage("evaluation.validation.date_invalid") })
  public startsAt?: Date;

  @ApiPropertyOptional({ description: "New closing time (ISO 8601); must be in the future", example: "2026-10-06T11:00:00.000Z", type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: i18nValidationMessage("evaluation.validation.date_invalid") })
  public endsAt?: Date;
}

export class GetEvaluationAssignmentsQueryDTO extends ListQueryDTO {
  @ApiPropertyOptional({ description: "Filter by group", example: "cm5group01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public groupId?: string;

  @ApiPropertyOptional({ description: "Filter by evaluation", example: "cm5evaluation01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public evaluationId?: string;

  @ApiPropertyOptional({ description: "Filter by derived state at request time", enum: EVALUATION_ASSIGNMENT_STATE_VALUES, example: "ACTIVE" })
  @IsOptional()
  @IsIn([...EVALUATION_ASSIGNMENT_STATE_VALUES], { message: i18nValidationMessage("evaluation.validation.assignment_state_invalid") })
  public state?: string;
}
