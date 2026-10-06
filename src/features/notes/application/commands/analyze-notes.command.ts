/*
 * Funcionalidad: Comando AnalyzeNotesCommand
 * Descripción: Datos para analizar con IA las notas propias del usuario en una lección, un módulo o en todas sus notas, con el idioma de la respuesta y el rol del usuario para su cuota de IA
 * Versión: 1.1
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
  public readonly userRole?: string;

  public constructor({
    userId,
    lessonId,
    moduleId,
    language,
    userRole,
  }: {
    userId: string;
    lessonId?: string;
    moduleId?: string;
    language: LanguageValue;
    userRole?: string;
  }) {
    this.userId = userId;
    this.lessonId = lessonId;
    this.moduleId = moduleId;
    this.language = language;
    this.userRole = userRole;
  }
}
