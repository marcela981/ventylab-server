/*
 * Funcionalidad: DTO de consulta GetMediaListQueryDTO
 * Descripción: Valida los filtros del listado paginado de media (tipo, propietario y búsqueda por nombre original)
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
import { MEDIA_KIND_VALUES } from "@/features/media/domain/value-objects/media-kind";

export class GetMediaListQueryDTO extends ListQueryDTO {
  @ApiPropertyOptional({ description: "Filter by media kind", enum: MEDIA_KIND_VALUES, example: "IMAGE" })
  @IsOptional()
  @IsIn([...MEDIA_KIND_VALUES], { message: i18nValidationMessage("media.validation.kind_invalid") })
  public kind?: string;

  @ApiPropertyOptional({
    description: "Filter by owner (admins only; teachers always see their own media)",
    example: "clx1abc2d0000qwerty123456",
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public ownerId?: string;

  @ApiPropertyOptional({ description: "Search term, partial and case-insensitive match against the original file name", example: "curva" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public search?: string;
}
