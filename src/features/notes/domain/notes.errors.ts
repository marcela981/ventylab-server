/*
 * Funcionalidad: Errores de la feature de notas
 * Descripción: Errores de dominio de las notas privadas del estudiante (no encontrada, lección o módulo inexistente, página ajena a la lección, contenido inválido, alcance de análisis inválido, sin notas que analizar y respuesta de IA inválida) con sus claves i18n
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class NoteNotFoundError extends DomainError {
  public constructor() {
    super("Note not found", "notes.note_not_found");
  }
}

export class NoteLessonNotFoundError extends DomainError {
  public constructor() {
    super("Lesson not found", "notes.lesson_not_found");
  }
}

export class NoteModuleNotFoundError extends DomainError {
  public constructor() {
    super("Module not found", "notes.module_not_found");
  }
}

export class NotePageNotInLessonError extends DomainError {
  public constructor() {
    super("The page does not belong to the lesson", "notes.page_not_in_lesson");
  }
}

export class InvalidNoteContentError extends DomainError {
  public constructor(reason: string) {
    super(`Invalid note content: ${reason}`, "notes.invalid_content");
  }
}

export class InvalidNotesAnalysisScopeError extends DomainError {
  public constructor() {
    super("Provide either a lesson or a module, not both", "notes.invalid_analysis_scope");
  }
}

export class NoNotesToAnalyzeError extends DomainError {
  public constructor() {
    super("There are no notes to analyze in this scope", "notes.no_notes_to_analyze");
  }
}

export class NotesAnalysisInvalidResponseError extends DomainError {
  public constructor() {
    super("The AI service returned an invalid notes analysis", "notes.analysis_invalid_response");
  }
}
