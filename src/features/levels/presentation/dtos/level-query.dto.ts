/*
 * Funcionalidad: DTOs level-query.dto
 * Descripción: Define los DTOs GetLevelsQueryDTO, IncludeInactiveQueryDTO, GetLevelsCurriculumQueryDTO de la feature de niveles, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsOptional } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { ListQueryDTO } from "@/common/presentation/dtos/list-query.dto";
import { LEVEL_TRACK_VALUES } from "@/features/levels/domain/value-objects/level-track";

export class GetLevelsQueryDTO extends ListQueryDTO {
  @ApiPropertyOptional({ description: "Include inactive levels", example: false, default: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === true || value === "true")
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public includeInactive?: boolean;
}

export class IncludeInactiveQueryDTO {
  @ApiPropertyOptional({ description: "Include inactive items", example: false, default: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === true || value === "true")
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public includeInactive?: boolean;
}

export class GetLevelsCurriculumQueryDTO {
  @ApiPropertyOptional({ description: "Curriculum track", enum: LEVEL_TRACK_VALUES, example: "mecanica" })
  @IsOptional()
  @IsIn([...LEVEL_TRACK_VALUES], { message: i18nValidationMessage("levels.validation.track_invalid") })
  public track?: string;
}
