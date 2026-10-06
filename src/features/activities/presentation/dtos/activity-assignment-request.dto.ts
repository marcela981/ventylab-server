/*
 * Funcionalidad: DTOs de solicitud de asignaciones de actividades
 * Descripción: Valida la asignación de una actividad a un grupo (ventana de visibilidad, fecha límite y estado) y el filtro obligatorio por actividad del listado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class AssignActivityDTO {
  @ApiProperty({ description: "Activity ID", example: "cm5activity01" })
  @IsString({ message: i18nValidationMessage("activities.validation.activity_and_group_required") })
  @IsNotEmpty({ message: i18nValidationMessage("activities.validation.activity_and_group_required") })
  public activityId: string;

  @ApiProperty({ description: "Group ID", example: "cm5group01" })
  @IsString({ message: i18nValidationMessage("activities.validation.activity_and_group_required") })
  @IsNotEmpty({ message: i18nValidationMessage("activities.validation.activity_and_group_required") })
  public groupId: string;

  @ApiPropertyOptional({ description: "Date from which the activity is visible (ISO 8601); null clears it", example: "2026-11-01T00:00:00.000Z", nullable: true, type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: i18nValidationMessage("activities.validation.date_invalid") })
  public visibleFrom?: Date | null;

  @ApiPropertyOptional({ description: "Due date for this group (ISO 8601); null clears it", example: "2026-11-30T23:59:59.000Z", nullable: true, type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: i18nValidationMessage("activities.validation.date_invalid") })
  public dueDate?: Date | null;

  @ApiPropertyOptional({ description: "Whether the assignment is active", example: true })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public isActive?: boolean;
}

export class GetActivityAssignmentsQueryDTO {
  @ApiProperty({ description: "Activity ID", example: "cm5activity01" })
  @IsString({ message: i18nValidationMessage("activities.validation.activity_id_required") })
  @IsNotEmpty({ message: i18nValidationMessage("activities.validation.activity_id_required") })
  public activityId: string;
}
