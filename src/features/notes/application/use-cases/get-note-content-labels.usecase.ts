/*
 * Funcionalidad: Caso de uso GetNoteContentLabelsUseCase
 * Descripción: Lee por lotes del repositorio de notas el título y módulo de las lecciones y el título de las páginas de un conjunto de notas, para mostrarlas sin una consulta por nota
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Note } from "@/features/notes/domain/entities/note.entity";
import { type NoteContentLabels } from "@/features/notes/domain/read-models/note-scope.read-model";
import { type INotesRepository, NOTES_REPOSITORY_TOKEN } from "@/features/notes/domain/repositories/notes.repository";

@Injectable()
export class GetNoteContentLabelsUseCase {
  public constructor(
    @Inject(NOTES_REPOSITORY_TOKEN)
    private readonly _notesRepository: INotesRepository,
  ) {}

  public async execute(notes: readonly Note[]): Promise<NoteContentLabels> {
    if (notes.length === 0) {
      return { lessons: [], pages: [] };
    }

    const lessonIds: string[] = notes.map((note: Note): string => note.lessonId);
    const pageIds: string[] = notes.flatMap((note: Note): string[] => (note.pageId ? [note.pageId] : []));

    return await this._notesRepository.getContentLabels(lessonIds, pageIds);
  }
}
