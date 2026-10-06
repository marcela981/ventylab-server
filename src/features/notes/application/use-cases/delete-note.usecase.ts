/*
 * Funcionalidad: Caso de uso DeleteNoteUseCase
 * Descripción: Elimina una nota del propio usuario filtrando por su autor; una nota ajena o inexistente se reporta como no encontrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { DeleteNoteCommand } from "@/features/notes/application/commands/delete-note.command";
import { NoteNotFoundError } from "@/features/notes/domain/notes.errors";
import { type INotesRepository, NOTES_REPOSITORY_TOKEN } from "@/features/notes/domain/repositories/notes.repository";

/**
 * @throws {NoteNotFoundError} If the note does not exist or belongs to another user
 */
@Injectable()
export class DeleteNoteUseCase {
  public constructor(
    @Inject(NOTES_REPOSITORY_TOKEN)
    private readonly _notesRepository: INotesRepository,
  ) {}

  public async execute(command: DeleteNoteCommand): Promise<void> {
    const deleted: boolean = await this._notesRepository.delete(command.noteId, command.userId);

    if (!deleted) {
      throw new NoteNotFoundError();
    }
  }
}
