/*
 * Funcionalidad: DTOs de entrada de secciones
 * Descripción: Define CreateSectionDTO y UpdateSectionDTO, validados con class-validator y documentados para Swagger
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Length, Matches, MaxLength, Min } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { CONTENT_STATUS_VALUES, type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";

const SLUG_PATTERN: RegExp = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateSectionDTO {
  @ApiProperty({ description: "Unique slug (lowercase letters, digits and hyphens)", example: "mecanica", maxLength: 80 })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @Length(2, 80, { message: i18nValidationMessage("sections.validation.slug_invalid") })
  @Matches(SLUG_PATTERN, { message: i18nValidationMessage("sections.validation.slug_invalid") })
  public slug: string;

  @ApiProperty({ description: "Section title", example: "Mecánica ventilatoria", minLength: 2, maxLength: 150 })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @Length(2, 150, { message: i18nValidationMessage("sections.validation.title_length") })
  public title: string;

  @ApiPropertyOptional({ description: "Section description", example: "Ruta principal de aprendizaje", maxLength: 2000 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(2000, { message: i18nValidationMessage("sections.validation.description_max_length") })
  public description?: string;

  @ApiPropertyOptional({ description: "Display order, defaults to the next available position", example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("sections.validation.order_invalid") })
  @Min(0, { message: i18nValidationMessage("sections.validation.order_invalid") })
  public order?: number;

  @ApiPropertyOptional({ description: "Publication status, DRAFT by default", enum: CONTENT_STATUS_VALUES, example: "DRAFT" })
  @IsOptional()
  @IsIn([...CONTENT_STATUS_VALUES], { message: i18nValidationMessage("curriculum.validation.status_invalid") })
  public status?: ContentStatusValue;
}

export class UpdateSectionDTO {
  @ApiPropertyOptional({ description: "Unique slug (lowercase letters, digits and hyphens)", example: "mecanica", maxLength: 80 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @Length(2, 80, { message: i18nValidationMessage("sections.validation.slug_invalid") })
  @Matches(SLUG_PATTERN, { message: i18nValidationMessage("sections.validation.slug_invalid") })
  public slug?: string;

  @ApiPropertyOptional({ description: "Section title", example: "Mecánica ventilatoria", minLength: 2, maxLength: 150 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @Length(2, 150, { message: i18nValidationMessage("sections.validation.title_length") })
  public title?: string;

  @ApiPropertyOptional({ description: "Section description", example: "Ruta principal de aprendizaje", maxLength: 2000 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(2000, { message: i18nValidationMessage("sections.validation.description_max_length") })
  public description?: string;

  @ApiPropertyOptional({ description: "Publication status", enum: CONTENT_STATUS_VALUES, example: "PUBLISHED" })
  @IsOptional()
  @IsIn([...CONTENT_STATUS_VALUES], { message: i18nValidationMessage("curriculum.validation.status_invalid") })
  public status?: ContentStatusValue;
}
