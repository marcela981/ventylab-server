/*
 * Funcionalidad: DTOs de petición de grupos
 * Descripción: Validación y documentación Swagger de los cuerpos y filtros de /api/groups (crear con tipo, actualizar, listar, agregar miembro y asignar líder del simulador)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { GROUP_MEMBER_ROLE_VALUES } from "@/features/groups/domain/value-objects/group-member-role";
import { GROUP_TYPE_VALUES } from "@/features/groups/domain/value-objects/group-type";

export class CreateGroupDTO {
  @ApiProperty({ description: "Group name", example: "Grupo A 2026-2" })
  @IsString({ message: i18nValidationMessage("groups.validation.name_required") })
  @IsNotEmpty({ message: i18nValidationMessage("groups.validation.name_required") })
  public name: string;

  @ApiPropertyOptional({ description: "Group type; teachers may only create STUDENT groups", enum: GROUP_TYPE_VALUES, default: "STUDENT", example: "STUDENT" })
  @IsOptional()
  @IsIn(GROUP_TYPE_VALUES, { message: i18nValidationMessage("groups.validation.type_invalid") })
  public type?: string;

  @ApiPropertyOptional({ description: "Group description", example: "Morning section" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public description?: string;

  @ApiPropertyOptional({ description: "Parent group ID to create a subgroup (maximum three levels)", example: "cm5group01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public parentGroupId?: string;

  @ApiPropertyOptional({ description: "Semester", example: "2026-2" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public semester?: string;

  @ApiPropertyOptional({ description: "Academic year", example: "2026" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public academicYear?: string;

  @ApiPropertyOptional({ description: "Maximum number of students", example: 30 })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage("groups.validation.max_students_invalid") })
  @Min(1, { message: i18nValidationMessage("groups.validation.max_students_invalid") })
  public maxStudents?: number;
}

export class UpdateGroupDTO {
  @ApiPropertyOptional({ description: "Group name", example: "Grupo A 2026-2" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("groups.validation.name_required") })
  @IsNotEmpty({ message: i18nValidationMessage("groups.validation.name_required") })
  public name?: string;

  @ApiPropertyOptional({ description: "Group description; null clears it", example: "Morning section", nullable: true, type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public description?: string | null;

  @ApiPropertyOptional({ description: "Semester; null clears it", example: "2026-2", nullable: true, type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public semester?: string | null;

  @ApiPropertyOptional({ description: "Academic year; null clears it", example: "2026", nullable: true, type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public academicYear?: string | null;

  @ApiPropertyOptional({ description: "Maximum number of students; null removes the limit", example: 30, nullable: true, type: Number })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage("groups.validation.max_students_invalid") })
  @Min(1, { message: i18nValidationMessage("groups.validation.max_students_invalid") })
  public maxStudents?: number | null;

  @ApiPropertyOptional({ description: "Whether the group is active", example: true })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public isActive?: boolean;
}

export class GetGroupsQueryDTO {
  @ApiPropertyOptional({ description: "Only groups where this user is a TEACHER member", example: "cm5teacher01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public teacherId?: string;

  @ApiPropertyOptional({ description: "Only groups where this user is a STUDENT member (takes precedence over teacherId)", example: "cm5student01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public studentId?: string;

  @ApiPropertyOptional({ description: "Parent group ID, or the literal null for root groups", example: "null" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public parentGroupId?: string;

  @ApiPropertyOptional({ description: "Hierarchy depth (0, 1 or 2)", example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("groups.validation.depth_invalid") })
  public depth?: number;

  @ApiPropertyOptional({ description: "Filter by active state", enum: ["true", "false"], example: "true" })
  @IsOptional()
  @IsIn(["true", "false"], { message: i18nValidationMessage("common.validation.boolean") })
  public isActive?: string;

  @ApiPropertyOptional({ description: "Filter by group type", enum: GROUP_TYPE_VALUES, example: "STUDENT" })
  @IsOptional()
  @IsIn(GROUP_TYPE_VALUES, { message: i18nValidationMessage("groups.validation.type_invalid") })
  public type?: string;

  @ApiPropertyOptional({
    description: "Only groups the caller manages as a teacher (student groups they created or supervise) and teacher groups they belong to",
    enum: ["true", "false"],
    example: "true",
  })
  @IsOptional()
  @IsIn(["true", "false"], { message: i18nValidationMessage("common.validation.boolean") })
  public myGroups?: string;
}

export class AddGroupMemberDTO {
  @ApiProperty({ description: "User ID to add", example: "cm5student01" })
  @IsString({ message: i18nValidationMessage("groups.validation.user_id_required") })
  @IsNotEmpty({ message: i18nValidationMessage("groups.validation.user_id_required") })
  public userId: string;

  @ApiPropertyOptional({
    description: "Deprecated and ignored: the legacy member role is derived from the user's platform role",
    enum: GROUP_MEMBER_ROLE_VALUES,
    example: "STUDENT",
    deprecated: true,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public role?: string;
}

export class SetSimulatorLeadDTO {
  @ApiPropertyOptional({ description: "Member ID to set as simulator leader; null or empty clears it", example: "cm5student01", nullable: true, type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public userId?: string | null;
}
