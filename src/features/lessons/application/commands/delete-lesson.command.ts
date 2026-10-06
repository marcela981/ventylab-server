/*
 * Funcionalidad: Comando DeleteLessonCommand
 * Descripción: Transporta la lección que se elimina físicamente junto con sus páginas y el usuario que realiza la acción
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class DeleteLessonCommand {
  public readonly lessonId: string;
  public readonly performedBy: string;

  public constructor({ lessonId, performedBy }: { lessonId: string; performedBy: string }) {
    this.lessonId = lessonId;
    this.performedBy = performedBy;
  }
}
