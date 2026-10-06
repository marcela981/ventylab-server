/*
 * Funcionalidad: DTO GetStudentsQueryDTO
 * Descripción: Valida los parámetros de consulta del listado de estudiantes
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { ListQueryDTO } from "@/common/presentation/dtos/list-query.dto";
import { USER_SORT_BY_VALUES } from "@/features/users/domain/repositories/users.repository";

export class GetStudentsQueryDTO extends ListQueryDTO {
  @ApiPropertyOptional({
    description: "Search term, partial and case-insensitive match against name or email",
    example: "ana",
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public search?: string;

  @ApiPropertyOptional({
    description: "Sort field",
    enum: USER_SORT_BY_VALUES,
    example: "name",
  })
  @IsOptional()
  @IsIn([...USER_SORT_BY_VALUES], { message: i18nValidationMessage("users.validation.sort_by_invalid") })
  public sortBy?: string;
}
