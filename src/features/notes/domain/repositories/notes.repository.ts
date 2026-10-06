/*
 * Funcionalidad: Repositorio de notas
 * Descripción: Contrato y token del repositorio de notas privadas; toda lectura y escritura de notas se filtra por su autor, e incluye lecturas mínimas de lección, módulo y página para validar el alcance
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ListQuery } from "@/common/domain/utils/list-query";
import { type Paginated } from "@/common/domain/utils/paginated";
import { type Note } from "@/features/notes/domain/entities/note.entity";
import {
  type NoteAnalysisSource,
  type NoteLessonScope,
  type NoteModuleScope,
} from "@/features/notes/domain/read-models/note-scope.read-model";

export const NOTES_REPOSITORY_TOKEN: unique symbol = Symbol("NOTES_REPOSITORY_TOKEN");

export interface GetNotesQuery extends ListQuery {
  userId: string;
  lessonId?: string;
  moduleId?: string;
}

export interface GetNotesForAnalysisQuery {
  userId: string;
  lessonId?: string;
  moduleId?: string;
  limit: number;
}

export interface INotesRepository {
  getById(id: string, ownerId: string, transaction?: unknown): Promise<Note | undefined>;
  getAll(query: GetNotesQuery, transaction?: unknown): Promise<Paginated<Note>>;
  getForAnalysis(query: GetNotesForAnalysisQuery): Promise<NoteAnalysisSource[]>;
  save(note: Note, transaction?: unknown): Promise<void>;
  delete(id: string, ownerId: string, transaction?: unknown): Promise<boolean>;
  getLessonScope(lessonId: string, transaction?: unknown): Promise<NoteLessonScope | undefined>;
  getModuleScope(moduleId: string, transaction?: unknown): Promise<NoteModuleScope | undefined>;
  isPageInLesson(pageId: string, lessonId: string, transaction?: unknown): Promise<boolean>;
}
