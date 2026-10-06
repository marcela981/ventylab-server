/*
 * Funcionalidad: Caso de uso GetNotesUseCase
 * Descripción: Lista paginada de las notas del propio usuario, todas, por lección o por módulo (a través de las lecciones del módulo), validando que la lección o el módulo existan
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
import { NoteLessonNotFoundError, NoteModuleNotFoundError } from "@/features/notes/domain/notes.errors";
import { type NoteLessonScope, type NoteModuleScope } from "@/features/notes/domain/read-models/note-scope.read-model";
import { type GetNotesQuery, type INotesRepository, NOTES_REPOSITORY_TOKEN } from "@/features/notes/domain/repositories/notes.repository";

/**
 * @throws {NoteLessonNotFoundError} If the lesson filter points to a lesson that does not exist
 * @throws {NoteModuleNotFoundError} If the module filter points to a module that does not exist
 */
@Injectable()
export class GetNotesUseCase {
  public constructor(
    @Inject(NOTES_REPOSITORY_TOKEN)
    private readonly _notesRepository: INotesRepository,
  ) {}

  public async execute(query: GetNotesQuery): Promise<Paginated<Note>> {
    if (query.lessonId !== undefined) {
      const lesson: NoteLessonScope | undefined = await this._notesRepository.getLessonScope(query.lessonId);

      if (!lesson) {
        throw new NoteLessonNotFoundError();
      }
    }

    if (query.moduleId !== undefined) {
      const module: NoteModuleScope | undefined = await this._notesRepository.getModuleScope(query.moduleId);

      if (!module) {
        throw new NoteModuleNotFoundError();
      }
    }

    return await this._notesRepository.getAll(query);
  }
}
