/*
 * Funcionalidad: Fachada NotesFacade
 * Descripción: API pública de las notas para otras features: últimas notas de un usuario (más recientes primero) con un extracto corto de su texto plano, sin el documento enriquecido
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { type Note } from "@/features/notes/domain/entities/note.entity";
import { type INotesRepository, NOTES_REPOSITORY_TOKEN } from "@/features/notes/domain/repositories/notes.repository";

export const NOTE_EXCERPT_LENGTH: number = 160;

export interface NoteSummary {
  readonly id: string;
  readonly lessonId: string;
  readonly pageId?: string;
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

    return notes.data.map(
      (note: Note): NoteSummary => ({
        id: note.id,
        lessonId: note.lessonId,
        pageId: note.pageId,
        excerpt: note.content.plainText.slice(0, NOTE_EXCERPT_LENGTH),
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      }),
    );
  }
}
