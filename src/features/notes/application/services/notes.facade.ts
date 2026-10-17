/*
 * Funcionalidad: Fachada de notas
 * Descripción: API pública de las notas para otras features: últimas notas de un usuario (más recientes primero) con un extracto corto de su texto plano, el módulo y título de su lección y el título de su página (leídos por lotes), sin el documento enriquecido
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { type Note } from "@/features/notes/domain/entities/note.entity";
import { type NoteContentLabels, type NoteLessonLabel, type NotePageLabel } from "@/features/notes/domain/read-models/note-scope.read-model";
import { type INotesRepository, NOTES_REPOSITORY_TOKEN } from "@/features/notes/domain/repositories/notes.repository";

export const NOTE_EXCERPT_LENGTH: number = 160;

export interface NoteSummary {
  readonly id: string;
  readonly lessonId: string;
  readonly pageId?: string;
  readonly moduleId?: string;
  readonly lessonTitle?: string;
  readonly pageTitle?: string;
  readonly excerpt: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

@Injectable()
export class NotesFacade {
  public constructor(
    @Inject(NOTES_REPOSITORY_TOKEN)
    private readonly _notesRepository: INotesRepository,
  ) {}

  public async getLatestNotes(userId: string, limit: number): Promise<NoteSummary[]> {
    const notes: Paginated<Note> = await this._notesRepository.getAll({ userId, page: 1, limit, sortOrder: "desc" });

    if (notes.data.length === 0) {
      return [];
    }

    const labels: NoteContentLabels = await this._notesRepository.getContentLabels(
      notes.data.map((note: Note): string => note.lessonId),
      notes.data.flatMap((note: Note): string[] => (note.pageId ? [note.pageId] : [])),
    );
    const lessonById: Map<string, NoteLessonLabel> = new Map(labels.lessons.map((label: NoteLessonLabel): [string, NoteLessonLabel] => [label.lessonId, label]));
    const pageById: Map<string, NotePageLabel> = new Map(labels.pages.map((label: NotePageLabel): [string, NotePageLabel] => [label.pageId, label]));

    return notes.data.map((note: Note): NoteSummary => {
      const lesson: NoteLessonLabel | undefined = lessonById.get(note.lessonId);

      return {
        id: note.id,
        lessonId: note.lessonId,
        pageId: note.pageId,
        moduleId: lesson?.moduleId,
        lessonTitle: lesson?.lessonTitle,
        pageTitle: note.pageId ? pageById.get(note.pageId)?.pageTitle : undefined,
        excerpt: note.content.plainText.slice(0, NOTE_EXCERPT_LENGTH),
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      };
    });
  }
}
