/*
 * Funcionalidad: DTOs de solicitud de notas
 * Descripción: Valida los cuerpos para crear, actualizar y analizar notas: lección, página opcional (nula para desvincular) y contenido Tiptap como objeto JSON
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsObject, IsOptional, IsString, ValidateIf } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

const TIPTAP_CONTENT_EXAMPLE: Record<string, unknown> = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "PEEP keeps the alveoli open at the end of expiration" }] }],
};

export class CreateNoteDTO {
  @ApiProperty({ description: "Lesson the note belongs to", example: "cm5x2k9a00000abcd1234efgh" })
  @IsString({ message: i18nValidationMessage("notes.validation.lesson_id_required") })
  @IsNotEmpty({ message: i18nValidationMessage("notes.validation.lesson_id_required") })
  public lessonId: string;

  @ApiPropertyOptional({ description: "Page of the lesson the note refers to", example: "cm5x2k9a00000abcd1234wxyz" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("notes.validation.page_id_must_be_string") })
  @IsNotEmpty({ message: i18nValidationMessage("notes.validation.page_id_must_be_string") })
  public pageId?: string;

  @ApiProperty({
    description: "Rich text content as a Tiptap JSON document",
    type: "object",
    additionalProperties: true,
    example: TIPTAP_CONTENT_EXAMPLE,
  })
  @IsObject({ message: i18nValidationMessage("notes.validation.content_must_be_object") })
  public content: Record<string, unknown>;
}

export class UpdateNoteDTO {
  @ApiPropertyOptional({
    description: "Page of the note's lesson the note refers to. Send null to detach it.",
    example: "cm5x2k9a00000abcd1234wxyz",
    nullable: true,
    type: String,
  })
  @ValidateIf((dto: UpdateNoteDTO) => dto.pageId !== undefined && dto.pageId !== null)
  @IsString({ message: i18nValidationMessage("notes.validation.page_id_must_be_string") })
  @IsNotEmpty({ message: i18nValidationMessage("notes.validation.page_id_must_be_string") })
  public pageId?: string | null;

  @ApiPropertyOptional({
    description: "Rich text content as a Tiptap JSON document",
    type: "object",
    additionalProperties: true,
    example: TIPTAP_CONTENT_EXAMPLE,
  })
  @IsOptional()
  @IsObject({ message: i18nValidationMessage("notes.validation.content_must_be_object") })
  public content?: Record<string, unknown>;
}

export class AnalyzeNotesDTO {
  @ApiPropertyOptional({ description: "Analyze only the caller's notes of this lesson", example: "cm5x2k9a00000abcd1234efgh" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("notes.validation.lesson_id_must_be_string") })
  @IsNotEmpty({ message: i18nValidationMessage("notes.validation.lesson_id_must_be_string") })
  public lessonId?: string;

  @ApiPropertyOptional({ description: "Analyze only the caller's notes of the lessons of this module", example: "cm5x2k9a00000abcd1234mnop" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("notes.validation.module_id_must_be_string") })
  @IsNotEmpty({ message: i18nValidationMessage("notes.validation.module_id_must_be_string") })
  public moduleId?: string;
}
