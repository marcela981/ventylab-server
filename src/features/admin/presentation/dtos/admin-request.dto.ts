/*
 * Funcionalidad: DTOs de petición del panel de administración
 * Descripción: Validación y documentación Swagger de los filtros del listado de estudiantes y profesores y del cuerpo para cambiar el rol de un usuario
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { ADMIN_STUDENT_SORT_BY_VALUES } from "@/features/admin/domain/read-models/admin-dashboard.read-model";
import { USER_ROLE_VALUES } from "@/features/users/domain/value-objects/user-role";

export class GetAdminStudentsQueryDTO {
  @ApiPropertyOptional({ description: "Page number (1-based)", example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("common.validation.page.must_be_integer") })
  @Min(1, { message: i18nValidationMessage("common.validation.page.min") })
  public page: number = 1;

  @ApiPropertyOptional({ description: "Number of students per page", example: 20, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("common.validation.limit.must_be_integer") })
  @Min(1, { message: i18nValidationMessage("common.validation.limit.min") })
  @Max(100, { message: i18nValidationMessage("common.validation.limit.max") })
  public limit: number = 20;

  @ApiPropertyOptional({ description: "Only students of this group", example: "cm5group01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public groupId?: string;

  @ApiPropertyOptional({ description: "Partial, case-insensitive match against name or email", example: "ana" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public search?: string;

  @ApiPropertyOptional({ description: "Sort field", enum: ADMIN_STUDENT_SORT_BY_VALUES, example: "name", default: "name" })
  @IsOptional()
  @IsIn([...ADMIN_STUDENT_SORT_BY_VALUES], { message: i18nValidationMessage("admin.validation.sort_by_invalid") })
  public sortBy?: string;

  @ApiPropertyOptional({ description: "Sort direction", enum: ["asc", "desc"], example: "asc", default: "asc" })
  @IsOptional()
  @IsIn(["asc", "desc"], { message: i18nValidationMessage("common.validation.sort_order.must_be_valid") })
  public sortOrder?: "asc" | "desc";

  @ApiPropertyOptional({ description: "Only students of the groups where the caller is a teacher (ignored when groupId is sent)", enum: ["true", "false"], example: "true" })
  @IsOptional()
  @IsIn(["true", "false"], { message: i18nValidationMessage("common.validation.boolean") })
  public myGroups?: string;
}

export class GetAdminTeachersQueryDTO {
  @ApiPropertyOptional({ description: "Partial, case-insensitive match against name or email", example: "ana" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public search?: string;
}

export class ChangeUserRoleDTO {
  @ApiProperty({ description: "New role", enum: USER_ROLE_VALUES, example: "TEACHER" })
  @IsIn([...USER_ROLE_VALUES], { message: i18nValidationMessage("admin.validation.role_invalid") })
  public role: string;
}
