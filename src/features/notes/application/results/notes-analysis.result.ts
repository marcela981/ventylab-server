/*
 * Funcionalidad: Resultado NotesAnalysisResult
 * Descripción: Salida del análisis de notas con IA: alcance analizado, cantidad de notas y el análisis devuelto por el puerto INotesAnalyzer
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type NotesAnalysis, type NotesAnalysisScopeValue } from "@/features/notes/domain/read-models/notes-analysis.read-model";

export class NotesAnalysisResult {
  public readonly scope: NotesAnalysisScopeValue;
  public readonly lessonId?: string;
  public readonly moduleId?: string;
  public readonly notesAnalyzed: number;
  public readonly analysis: NotesAnalysis;

  public constructor({
    scope,
    lessonId,
    moduleId,
    notesAnalyzed,
    analysis,
  }: {
    scope: NotesAnalysisScopeValue;
    lessonId?: string;
    moduleId?: string;
    notesAnalyzed: number;
    analysis: NotesAnalysis;
  }) {
    this.scope = scope;
    this.lessonId = lessonId;
    this.moduleId = moduleId;
    this.notesAnalyzed = notesAnalyzed;
    this.analysis = analysis;
  }
}
