/*
 * Funcionalidad: Comando AnalyzeNotesCommand
 * Descripción: Datos para analizar con IA las notas propias del usuario en una lección, un módulo o en todas sus notas, con el idioma de la respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LanguageValue } from "@/common/domain/value-objects/language";

export class AnalyzeNotesCommand {
  public readonly userId: string;
  public readonly lessonId?: string;
  public readonly moduleId?: string;
  public readonly language: LanguageValue;

  public constructor({
    userId,
    lessonId,
    moduleId,
    language,
  }: {
    userId: string;
    lessonId?: string;
    moduleId?: string;
    language: LanguageValue;
  }) {
    this.userId = userId;
    this.lessonId = lessonId;
    this.moduleId = moduleId;
    this.language = language;
  }
}
