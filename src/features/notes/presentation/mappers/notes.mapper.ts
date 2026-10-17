/*
 * Funcionalidad: Mapper de presentación de notas
 * Descripción: Convierte la entidad Note y el resultado del análisis de notas en sus DTOs de respuesta
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type NotesAnalysisResult } from "@/features/notes/application/results/notes-analysis.result";
import { type Note } from "@/features/notes/domain/entities/note.entity";
import { type NoteContentLabels, type NoteLessonLabel, type NotePageLabel } from "@/features/notes/domain/read-models/note-scope.read-model";
import { NoteDTO, NotesAnalysisDTO } from "@/features/notes/presentation/dtos/note.dto";

export class NotesMapper {
  public static toDTO(note: Note, labels?: NoteContentLabels): NoteDTO {
    const lesson: NoteLessonLabel | undefined = labels?.lessons.find((label: NoteLessonLabel): boolean => label.lessonId === note.lessonId);
    const notePage: NotePageLabel | undefined = note.pageId ? labels?.pages.find((label: NotePageLabel): boolean => label.pageId === note.pageId) : undefined;

    return new NoteDTO({
      id: note.id,
      lessonId: note.lessonId,
      pageId: note.pageId ?? null,
      moduleId: lesson?.moduleId ?? null,
      lessonTitle: lesson?.lessonTitle ?? null,
      pageTitle: notePage?.pageTitle ?? null,
      content: note.content.document as unknown as Record<string, unknown>,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    });
  }

  public static toAnalysisDTO(result: NotesAnalysisResult): NotesAnalysisDTO {
    return new NotesAnalysisDTO({
      scope: result.scope,
      lessonId: result.lessonId ?? null,
      moduleId: result.moduleId ?? null,
      notesAnalyzed: result.notesAnalyzed,
      summary: result.analysis.summary,
      keyConcepts: result.analysis.keyConcepts,
      gaps: result.analysis.gaps,
      suggestions: result.analysis.suggestions,
      model: result.analysis.model,
      aiCallId: result.analysis.aiCallId,
    });
  }
}
