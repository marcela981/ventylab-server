/*
 * Funcionalidad: Modelos de lectura del alcance de notas
 * Descripción: Datos mínimos de lección, módulo y nota con sus títulos que la feature de notas lee para validar el alcance y construir el análisis con IA, y etiquetas de lección (título y módulo) y página (título) para mostrar las notas
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type NoteContent } from "@/features/notes/domain/value-objects/note-content";

export interface NoteLessonScope {
  lessonId: string;
  lessonTitle: string;
  moduleId: string;
  moduleTitle: string;
}

export interface NoteModuleScope {
  moduleId: string;
  moduleTitle: string;
}

export interface NoteAnalysisSource {
  noteId: string;
  lessonTitle: string;
  moduleTitle: string;
  content: NoteContent;
}

export interface NoteLessonLabel {
  readonly lessonId: string;
  readonly lessonTitle: string;
  readonly moduleId: string;
}

export interface NotePageLabel {
  readonly pageId: string;
  readonly pageTitle: string;
}

export interface NoteContentLabels {
  readonly lessons: NoteLessonLabel[];
  readonly pages: NotePageLabel[];
}
