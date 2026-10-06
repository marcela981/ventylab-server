/*
 * Funcionalidad: Comando CreateNoteCommand
 * Descripción: Datos para crear una nota privada del usuario autenticado sobre una lección y, opcionalmente, una página de esa lección
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class CreateNoteCommand {
  public readonly userId: string;
  public readonly lessonId: string;
  public readonly pageId?: string;
  public readonly content: unknown;

  public constructor({ userId, lessonId, pageId, content }: { userId: string; lessonId: string; pageId?: string; content: unknown }) {
    this.userId = userId;
    this.lessonId = lessonId;
    this.pageId = pageId;
    this.content = content;
  }
}
