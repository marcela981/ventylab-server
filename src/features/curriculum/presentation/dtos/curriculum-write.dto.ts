/*
 * Funcionalidad: DTOs de escritura compartidos del currículo
 * Descripción: Define CreatedContentIdDTO (id del recurso creado), ReorderItemsDTO (lista ordenada de ids para reordenar por lotes) y ChangeContentStatusDTO (cambio de estado DRAFT, PUBLISHED o ARCHIVED), validados con class-validator y documentados con Swagger; los reutilizan secciones, niveles, módulos, lecciones y páginas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsIn, IsString } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { CONTENT_STATUS_VALUES, type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";

export class CreatedContentIdDTO {
  @ApiProperty({ description: "ID of the created resource", example: "0199b3d2-6c1e-7a4b-9f00-1a2b3c4d5e6f" })
  public id: string;

  public constructor({ id }: CreatedContentIdDTO) {
    this.id = id;
  }
}

export class ReorderItemsDTO {
  @ApiProperty({ description: "IDs in the desired order", example: ["cm5x2k9a00000abcd1234efgh", "cm5x2k9a00000abcd1234efgi"], type: [String] })
  @IsArray({ message: i18nValidationMessage("curriculum.validation.ids_invalid") })
  @ArrayNotEmpty({ message: i18nValidationMessage("curriculum.validation.ids_invalid") })
  @IsString({ each: true, message: i18nValidationMessage("curriculum.validation.ids_invalid") })
  public ids: string[];
}

export class ChangeContentStatusDTO {
  @ApiProperty({ description: "Publication status", enum: CONTENT_STATUS_VALUES, example: "PUBLISHED" })
  @IsIn([...CONTENT_STATUS_VALUES], { message: i18nValidationMessage("curriculum.validation.status_invalid") })
  public status: ContentStatusValue;
}
