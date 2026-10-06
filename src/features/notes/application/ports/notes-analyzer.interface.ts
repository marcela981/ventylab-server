/*
 * Funcionalidad: Puerto INotesAnalyzer
 * Descripción: Contrato y token del analizador de notas con modelos de lenguaje: recibe las notas en texto plano con los títulos de su lección y módulo y devuelve resumen, conceptos clave, vacíos, sugerencias y el id de la llamada de IA; el contexto lleva el usuario y su rol solo para cuotas y telemetría, nunca se envían al proveedor
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LanguageValue } from "@/common/domain/value-objects/language";
import { type NotesAnalysis, type NotesAnalysisScopeValue } from "@/features/notes/domain/read-models/notes-analysis.read-model";

export const NOTES_ANALYZER_TOKEN: unique symbol = Symbol("NOTES_ANALYZER_TOKEN");

export interface NotesAnalysisNote {
  lessonTitle: string;
  moduleTitle: string;
  text: string;
}

export interface NotesAnalysisContext {
  scope: NotesAnalysisScopeValue;
  lessonTitle?: string;
  moduleTitle?: string;
  language: LanguageValue;
  userId?: string;
  userRole?: string;
}

export interface INotesAnalyzer {
  analyze(notes: NotesAnalysisNote[], context: NotesAnalysisContext): Promise<NotesAnalysis>;
}
