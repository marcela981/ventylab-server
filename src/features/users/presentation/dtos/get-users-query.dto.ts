/*
 * Funcionalidad: DTO GetUsersQueryDTO
 * Descripción: Parámetros de consulta del listado paginado de usuarios: búsqueda por nombre, email o ID exacto, rol, grupo, estado activo y ordenamiento
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsOptional, IsString } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { ListQueryDTO } from "@/common/presentation/dtos/list-query.dto";
import { USER_SORT_BY_VALUES } from "@/features/users/domain/repositories/users.repository";
import { USER_ROLE_VALUES } from "@/features/users/domain/value-objects/user-role";

function toOptionalBoolean({ value }: { value: unknown }): unknown {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
}

export class GetUsersQueryDTO extends ListQueryDTO {
  @ApiPropertyOptional({
    description: "Search term: partial and case-insensitive match against name or email, or exact match against the user ID",
    example: "ana",
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public search?: string;

  @ApiPropertyOptional({ description: "Filter by role", enum: USER_ROLE_VALUES, example: "STUDENT" })
  @IsOptional()
  @IsIn([...USER_ROLE_VALUES], { message: i18nValidationMessage("users.validation.role_invalid") })
  public role?: string;

  @ApiPropertyOptional({ description: "Only members of this group", example: "cm5group01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public groupId?: string;

  @ApiPropertyOptional({ description: "Filter by account status", type: Boolean, example: true })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public isActive?: boolean;

  @ApiPropertyOptional({
    description: "Sort field",
    enum: USER_SORT_BY_VALUES,
    example: "name",
  })
  @IsOptional()
  @IsIn([...USER_SORT_BY_VALUES], { message: i18nValidationMessage("users.validation.sort_by_invalid") })
  public sortBy?: string;
}
