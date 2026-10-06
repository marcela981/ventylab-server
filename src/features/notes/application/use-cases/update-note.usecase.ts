/*
 * Funcionalidad: Caso de uso UpdateNoteUseCase
 * Descripción: Actualiza el contenido o la página de una nota del propio usuario dentro de una transacción; una nota ajena se reporta como no encontrada y la nueva página debe pertenecer a la lección de la nota
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { UpdateNoteCommand } from "@/features/notes/application/commands/update-note.command";
import { type Note } from "@/features/notes/domain/entities/note.entity";
import { NotePageNotInLessonError } from "@/features/notes/domain/notes.errors";
import { type INotesRepository, NOTES_REPOSITORY_TOKEN } from "@/features/notes/domain/repositories/notes.repository";
import { resolveOwnedNote } from "@/features/notes/domain/services/note-ownership";
import { NoteContent } from "@/features/notes/domain/value-objects/note-content";

/**
 * @throws {InvalidNoteContentError} If the new content is not a valid Tiptap document or has no text
 * @throws {NoteNotFoundError} If the note does not exist or belongs to another user
 * @throws {NotePageNotInLessonError} If the new page does not exist or belongs to another lesson
 */
@Injectable()
export class UpdateNoteUseCase {
  public constructor(
    @Inject(NOTES_REPOSITORY_TOKEN)
    private readonly _notesRepository: INotesRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
  ) {}

  public async execute(command: UpdateNoteCommand): Promise<Note> {
    const content: NoteContent | undefined = command.content !== undefined ? NoteContent.create(command.content) : undefined;

    return await this._transactionManager.run(async (transaction: unknown): Promise<Note> => {
      const note: Note = resolveOwnedNote(await this._notesRepository.getById(command.noteId, command.userId, transaction), command.userId);

      if (
        command.pageId !== undefined &&
        command.pageId !== null &&
        !(await this._notesRepository.isPageInLesson(command.pageId, note.lessonId, transaction))
      ) {
        throw new NotePageNotInLessonError();
      }

      note.update({ content, pageId: command.pageId });

      await this._notesRepository.save(note, transaction);

      return note;
    });
  }
}
