/*
 * Funcionalidad: Caso de uso CreateNoteUseCase
 * Descripción: Crea una nota privada del usuario autenticado con contenido Tiptap saneado, validando dentro de una transacción que la lección exista y que la página indicada pertenezca a esa lección
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { CreateNoteCommand } from "@/features/notes/application/commands/create-note.command";
import { Note } from "@/features/notes/domain/entities/note.entity";
import { NoteLessonNotFoundError, NotePageNotInLessonError } from "@/features/notes/domain/notes.errors";
import { type NoteLessonScope } from "@/features/notes/domain/read-models/note-scope.read-model";
import { type INotesRepository, NOTES_REPOSITORY_TOKEN } from "@/features/notes/domain/repositories/notes.repository";
import { NoteContent } from "@/features/notes/domain/value-objects/note-content";

/**
 * @throws {InvalidNoteContentError} If the content is not a valid Tiptap document or has no text
 * @throws {NoteLessonNotFoundError} If the lesson does not exist
 * @throws {NotePageNotInLessonError} If the page does not exist or belongs to another lesson
 */
@Injectable()
export class CreateNoteUseCase {
  public constructor(
    @Inject(NOTES_REPOSITORY_TOKEN)
    private readonly _notesRepository: INotesRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
  ) {}

  public async execute(command: CreateNoteCommand): Promise<Note> {
    const content: NoteContent = NoteContent.create(command.content);

    return await this._transactionManager.run(async (transaction: unknown): Promise<Note> => {
      const lesson: NoteLessonScope | undefined = await this._notesRepository.getLessonScope(command.lessonId, transaction);

      if (!lesson) {
        throw new NoteLessonNotFoundError();
      }

      if (command.pageId !== undefined && !(await this._notesRepository.isPageInLesson(command.pageId, command.lessonId, transaction))) {
        throw new NotePageNotInLessonError();
      }

      const note: Note = Note.create({
        userId: command.userId,
        lessonId: command.lessonId,
        pageId: command.pageId,
        content,
      });

      await this._notesRepository.save(note, transaction);

      return note;
    });
  }
}
