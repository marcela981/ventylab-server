/*
 * Funcionalidad: DTOs de entrada de páginas y bloques
 * Descripción: Define CreatePageDTO, UpdatePageDTO, ReorderPagesDTO, GetPagesQueryDTO, CreatePageBlockDTO y UpdatePageBlockDTO, validados con class-validator y documentados para Swagger; el contenido de los bloques se valida y sanea por tipo en el dominio
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Length, Matches, MaxLength, Min } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { CONTENT_STATUS_VALUES, type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";
import { ReorderItemsDTO } from "@/features/curriculum/presentation/dtos/curriculum-write.dto";
import { PAGE_BLOCK_TYPE_VALUES, type PageBlockTypeValue } from "@/features/pages/domain/value-objects/page-block-type";

const PAGE_TYPE_VALUES: readonly string[] = ["THEORY", "EXERCISE", "CASE_STUDY", "SIMULATION", "VIDEO"] as const;
const PAGE_DIFFICULTY_VALUES: readonly string[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
const SLUG_PATTERN: RegExp = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

class PageMetadataDTO {
  @ApiPropertyOptional({ description: "Page type", enum: PAGE_TYPE_VALUES, example: "THEORY" })
  @IsOptional()
  @IsIn([...PAGE_TYPE_VALUES], { message: i18nValidationMessage("pages.validation.type_invalid") })
  public type?: string;

  @ApiPropertyOptional({ description: "Page description", example: "Conceptos clave", maxLength: 2000 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(2000, { message: i18nValidationMessage("pages.validation.description_max_length") })
  public description?: string;

  @ApiPropertyOptional({ description: "Difficulty", enum: PAGE_DIFFICULTY_VALUES, example: "INTERMEDIATE" })
  @IsOptional()
  @IsIn([...PAGE_DIFFICULTY_VALUES], { message: i18nValidationMessage("pages.validation.difficulty_invalid") })
  public difficulty?: string;

  @ApiPropertyOptional({ description: "Estimated minutes", example: 10, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("pages.validation.minutes_invalid") })
  @Min(0, { message: i18nValidationMessage("pages.validation.minutes_invalid") })
  public estimatedMinutes?: number;

  @ApiPropertyOptional({ description: "Learning objectives", example: ["Explicar la ecuación de movimiento"], type: [String] })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("pages.validation.string_list_invalid") })
  @IsString({ each: true, message: i18nValidationMessage("pages.validation.string_list_invalid") })
  public learningObjectives?: string[];

  @ApiPropertyOptional({ description: "Key takeaways", example: ["La presión depende del flujo y la resistencia"], type: [String] })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("pages.validation.string_list_invalid") })
  @IsString({ each: true, message: i18nValidationMessage("pages.validation.string_list_invalid") })
  public keyTakeaways?: string[];

  @ApiPropertyOptional({ description: "Tags", example: ["mecanica"], type: [String] })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("pages.validation.string_list_invalid") })
  @IsString({ each: true, message: i18nValidationMessage("pages.validation.string_list_invalid") })
  public tags?: string[];

  @ApiPropertyOptional({ description: "Publication status", enum: CONTENT_STATUS_VALUES, example: "DRAFT" })
  @IsOptional()
  @IsIn([...CONTENT_STATUS_VALUES], { message: i18nValidationMessage("curriculum.validation.status_invalid") })
  public status?: ContentStatusValue;
}

export class CreatePageDTO extends PageMetadataDTO {
  @ApiProperty({ description: "Lesson the page belongs to; the module is derived from it", example: "cm5x2k9a00000abcd1234efgh" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("pages.validation.lesson_id_required") })
  public lessonId: string;

  @ApiProperty({ description: "Page title", example: "Conceptos", minLength: 2, maxLength: 200 })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @Length(2, 200, { message: i18nValidationMessage("pages.validation.title_length") })
  public title: string;

  @ApiPropertyOptional({ description: "Slug unique within the module; derived from the title when omitted", example: "conceptos" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @Matches(SLUG_PATTERN, { message: i18nValidationMessage("pages.validation.slug_invalid") })
  public slug?: string;
}

export class UpdatePageDTO extends PageMetadataDTO {
  @ApiPropertyOptional({ description: "Page title", example: "Conceptos", minLength: 2, maxLength: 200 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @Length(2, 200, { message: i18nValidationMessage("pages.validation.title_length") })
  public title?: string;

  @ApiPropertyOptional({ description: "Slug unique within the module", example: "conceptos" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @Matches(SLUG_PATTERN, { message: i18nValidationMessage("pages.validation.slug_invalid") })
  public slug?: string;

  @ApiPropertyOptional({ description: "Note stored with the revision snapshot of the previous version", example: "Se corrigió la definición", maxLength: 1000 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(1000, { message: i18nValidationMessage("pages.validation.change_log_max_length") })
  public changeLog?: string;
}

export class ReorderPagesDTO extends ReorderItemsDTO {
  @ApiProperty({ description: "Lesson whose pages are reordered", example: "cm5x2k9a00000abcd1234efgh" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("pages.validation.lesson_id_required") })
  public lessonId: string;
}

export class GetPagesQueryDTO {
  @ApiProperty({ description: "Lesson whose pages are listed", example: "cm5x2k9a00000abcd1234efgh" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("pages.validation.lesson_id_required") })
  public lessonId: string;
}

export class CreatePageBlockDTO {
  @ApiProperty({ description: "Block type", enum: PAGE_BLOCK_TYPE_VALUES, example: "TEXT" })
  @IsIn([...PAGE_BLOCK_TYPE_VALUES], { message: i18nValidationMessage("pages.validation.block_type_invalid") })
  public type: PageBlockTypeValue;

  @ApiPropertyOptional({ description: "Block title", example: "Definición", maxLength: 200 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(200, { message: i18nValidationMessage("pages.validation.title_length") })
  public title?: string;

  @ApiPropertyOptional({
    description:
      "Block content: { doc (Tiptap JSON) | markdown | html } for rich text, { caption, alt } for IMAGE/FILE, { url (YouTube/Vimeo) | caption } for VIDEO, { latex, display } for EQUATION, { code, language } for CODE",
    example: { doc: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hola" }] }] } },
  })
  @IsOptional()
  @IsObject({ message: i18nValidationMessage("pages.validation.content_invalid") })
  public content?: Record<string, unknown>;

  @ApiPropertyOptional({ description: "Media ID, required for IMAGE and FILE blocks and optional for VIDEO", example: "cm5x2k9a00000abcd1234efgh" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("common.validation.string") })
  public mediaId?: string;

  @ApiPropertyOptional({ description: "Estimated minutes", example: 2, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("pages.validation.minutes_invalid") })
  @Min(0, { message: i18nValidationMessage("pages.validation.minutes_invalid") })
  public estimatedTime?: number;
}

export class UpdatePageBlockDTO {
  @ApiPropertyOptional({ description: "Block type", enum: PAGE_BLOCK_TYPE_VALUES, example: "TEXT" })
  @IsOptional()
  @IsIn([...PAGE_BLOCK_TYPE_VALUES], { message: i18nValidationMessage("pages.validation.block_type_invalid") })
  public type?: PageBlockTypeValue;

  @ApiPropertyOptional({ description: "Block title", example: "Definición", maxLength: 200 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(200, { message: i18nValidationMessage("pages.validation.title_length") })
  public title?: string;

  @ApiPropertyOptional({ description: "Complete new block content, validated against the resulting type", example: { latex: "P = F \\cdot R" } })
  @IsOptional()
  @IsObject({ message: i18nValidationMessage("pages.validation.content_invalid") })
  public content?: Record<string, unknown>;

  @ApiPropertyOptional({ description: "Media ID; null removes the media reference", example: null, nullable: true, type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public mediaId?: string | null;

  @ApiPropertyOptional({ description: "Estimated minutes", example: 2, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("pages.validation.minutes_invalid") })
  @Min(0, { message: i18nValidationMessage("pages.validation.minutes_invalid") })
  public estimatedTime?: number;
}
