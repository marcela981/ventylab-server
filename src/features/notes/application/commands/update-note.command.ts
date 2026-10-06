/*
 * Funcionalidad: Comando UpdateNoteCommand
 * Descripción: Datos para actualizar el contenido o la página de una nota propia; pageId nulo desvincula la página y ausente la conserva
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class UpdateNoteCommand {
  public readonly noteId: string;
  public readonly userId: string;
  public readonly content?: unknown;
  public readonly pageId?: string | null;

  public constructor({ noteId, userId, content, pageId }: { noteId: string; userId: string; content?: unknown; pageId?: string | null }) {
    this.noteId = noteId;
    this.userId = userId;
    this.content = content;
    this.pageId = pageId;
  }
}
