/*
 * Funcionalidad: Comando RecordLessonAccessCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de lecciones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class RecordLessonAccessCommand {
  public readonly userId: string;
  public readonly lessonId: string;

  public constructor({
    userId,
    lessonId,
  }: {
    userId: string;
    lessonId: string;
  }) {
    this.userId = userId;
    this.lessonId = lessonId;
  }
}
