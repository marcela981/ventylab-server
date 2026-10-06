/*
 * Funcionalidad: Modelos de lectura del alcance de notas
 * Descripción: Datos mínimos de lección, módulo y nota con sus títulos que la feature de notas lee para validar el alcance y construir el análisis con IA
 * Versión: 1.0
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
