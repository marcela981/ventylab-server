/*
 * Funcionalidad: Comando DeleteNoteCommand
 * Descripción: Datos para eliminar una nota propia del usuario autenticado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class DeleteNoteCommand {
  public readonly noteId: string;
  public readonly userId: string;

  public constructor({ noteId, userId }: { noteId: string; userId: string }) {
    this.noteId = noteId;
    this.userId = userId;
  }
}
