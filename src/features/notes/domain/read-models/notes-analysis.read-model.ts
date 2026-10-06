/*
 * Funcionalidad: Modelo de lectura del análisis de notas
 * Descripción: Alcances posibles del análisis (lección, módulo o todas las notas) y estructura del resultado: resumen, conceptos clave, vacíos detectados, sugerencias y modelo de IA usado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type NotesAnalysisScopeValue = "lesson" | "module" | "all";

export const LESSON_ANALYSIS_SCOPE: NotesAnalysisScopeValue = "lesson";
export const MODULE_ANALYSIS_SCOPE: NotesAnalysisScopeValue = "module";
export const ALL_ANALYSIS_SCOPE: NotesAnalysisScopeValue = "all";

export const NOTES_ANALYSIS_SCOPE_VALUES: readonly NotesAnalysisScopeValue[] = [
  LESSON_ANALYSIS_SCOPE,
  MODULE_ANALYSIS_SCOPE,
  ALL_ANALYSIS_SCOPE,
] as const;

export interface NotesAnalysisContent {
  summary: string;
  keyConcepts: string[];
  gaps: string[];
  suggestions: string[];
}

export interface NotesAnalysis extends NotesAnalysisContent {
  model: string;
}
