/*
 * Funcionalidad: DTO ListQueryDTO
 * Descripción: Valida los parámetros comunes de consultas paginadas recibidos por query
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsArray, IsDate, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class ListQueryDTO {
  @ApiPropertyOptional({
    description: "Page number (1-based)",
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("common.validation.page.must_be_integer") })
  @Min(1, { message: i18nValidationMessage("common.validation.page.min") })
  public page: number = 1;

  @ApiPropertyOptional({
    description: "Number of items per page",
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("common.validation.limit.must_be_integer") })
  @Min(1, { message: i18nValidationMessage("common.validation.limit.min") })
  @Max(100, { message: i18nValidationMessage("common.validation.limit.max") })
  public limit: number = 10;

  @ApiPropertyOptional({
    description: "Filter by specific IDs. Accepts comma-separated string or repeated query params.",
    example: "id1,id2,id3",
    type: String,
  })
  @IsOptional()
  @Transform(({ value }: { value: string | string[] }) =>
    Array.isArray(value) ? value : typeof value === "string" ? value.split(",").map((v: string) => v.trim()).filter(Boolean) : undefined,
  )
  @IsArray({ message: i18nValidationMessage("common.validation.ids.must_be_array_of_strings") })
  @IsString({ each: true, message: i18nValidationMessage("common.validation.ids.must_be_array_of_strings") })
  public ids?: string[];

  @ApiPropertyOptional({
    description: "Filter by creation date — lower bound (inclusive). ISO 8601 format.",
    example: "2025-01-01T00:00:00.000Z",
    format: "date-time",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: i18nValidationMessage("common.validation.created_at_from.must_be_date") })
  public createdAtFrom?: Date;

  @ApiPropertyOptional({
    description: "Filter by creation date — upper bound (inclusive). ISO 8601 format.",
    example: "2025-12-31T23:59:59.999Z",
    format: "date-time",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: i18nValidationMessage("common.validation.created_at_to.must_be_date") })
  public createdAtTo?: Date;

  @ApiPropertyOptional({
    description: "Sort direction",
    enum: ["asc", "desc"],
    example: "desc",
  })
  @IsOptional()
  @IsIn(["asc", "desc"], { message: i18nValidationMessage("common.validation.sort_order.must_be_valid") })
  public sortOrder?: "asc" | "desc";
}
