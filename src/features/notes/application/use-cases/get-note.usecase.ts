/*
 * Funcionalidad: Caso de uso GetNoteUseCase
 * Descripción: Obtiene una nota del propio usuario; ningún rol puede leer notas ajenas y una nota ajena se reporta como no encontrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Note } from "@/features/notes/domain/entities/note.entity";
import { type INotesRepository, NOTES_REPOSITORY_TOKEN } from "@/features/notes/domain/repositories/notes.repository";
import { resolveOwnedNote } from "@/features/notes/domain/services/note-ownership";

/**
 * @throws {NoteNotFoundError} If the note does not exist or belongs to another user
 */
@Injectable()
export class GetNoteUseCase {
  public constructor(
    @Inject(NOTES_REPOSITORY_TOKEN)
    private readonly _notesRepository: INotesRepository,
  ) {}

  public async execute(noteId: string, userId: string): Promise<Note> {
    return resolveOwnedNote(await this._notesRepository.getById(noteId, userId), userId);
  }
}
