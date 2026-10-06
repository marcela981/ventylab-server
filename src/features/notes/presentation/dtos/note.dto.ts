/*
 * Funcionalidad: DTOs de respuesta de notas
 * Descripción: Representación HTTP de una nota (contenido Tiptap saneado) y del análisis de notas con IA
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { NOTES_ANALYSIS_SCOPE_VALUES } from "@/features/notes/domain/read-models/notes-analysis.read-model";

export class NoteDTO {
  @ApiProperty({ description: "Note unique identifier", example: "0192f3a4-5b6c-7d8e-9f01-23456789abcd" })
  public id: string;

  @ApiProperty({ description: "Lesson the note belongs to", example: "cm5x2k9a00000abcd1234efgh" })
  public lessonId: string;

  @ApiProperty({ description: "Page of the lesson the note refers to", example: "cm5x2k9a00000abcd1234wxyz", nullable: true, type: String })
  public pageId: string | null;

  @ApiProperty({ description: "Sanitized rich text content as a Tiptap JSON document", type: "object", additionalProperties: true })
  public content: Record<string, unknown>;

  @ApiProperty({ description: "Creation timestamp", example: "2026-10-05T10:30:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Last update timestamp", example: "2026-10-05T11:00:00.000Z" })
  public updatedAt: Date;

  public constructor({
    id,
    lessonId,
    pageId,
    content,
    createdAt,
    updatedAt,
  }: {
    id: string;
    lessonId: string;
    pageId: string | null;
    content: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = id;
    this.lessonId = lessonId;
    this.pageId = pageId;
    this.content = content;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export class NotesAnalysisDTO {
  @ApiProperty({ description: "Analyzed scope", enum: NOTES_ANALYSIS_SCOPE_VALUES, example: "lesson" })
  public scope: string;

  @ApiProperty({ description: "Analyzed lesson", example: "cm5x2k9a00000abcd1234efgh", nullable: true, type: String })
  public lessonId: string | null;

  @ApiProperty({ description: "Analyzed module", example: null, nullable: true, type: String })
  public moduleId: string | null;

  @ApiProperty({ description: "Number of notes sent to the analysis", example: 4 })
  public notesAnalyzed: number;

  @ApiProperty({ description: "Summary of what the notes show", example: "The notes cover the basic ventilation modes." })
  public summary: string;

  @ApiProperty({ description: "Key concepts found in the notes", type: [String], example: ["PEEP", "Tidal volume"] })
  public keyConcepts: string[];

  @ApiProperty({ description: "Missing or incorrect concepts", type: [String], example: ["Plateau pressure is not mentioned"] })
  public gaps: string[];

  @ApiProperty({ description: "Study suggestions", type: [String], example: ["Review the relation between compliance and pressure"] })
  public suggestions: string[];

  @ApiProperty({ description: "AI model that produced the analysis", example: "gemini-2.0-flash" })
  public model: string;

  public constructor({
    scope,
    lessonId,
    moduleId,
    notesAnalyzed,
    summary,
    keyConcepts,
    gaps,
    suggestions,
    model,
  }: {
    scope: string;
    lessonId: string | null;
    moduleId: string | null;
    notesAnalyzed: number;
    summary: string;
    keyConcepts: string[];
    gaps: string[];
    suggestions: string[];
    model: string;
  }) {
    this.scope = scope;
    this.lessonId = lessonId;
    this.moduleId = moduleId;
    this.notesAnalyzed = notesAnalyzed;
    this.summary = summary;
    this.keyConcepts = keyConcepts;
    this.gaps = gaps;
    this.suggestions = suggestions;
    this.model = model;
  }
}
