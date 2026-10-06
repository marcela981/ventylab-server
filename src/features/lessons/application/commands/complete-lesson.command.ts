/*
 * Funcionalidad: Comando CompleteLessonCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de lecciones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class CompleteLessonCommand {
  public readonly userId: string;
  public readonly lessonId: string;
  public readonly timeSpent: number;

  public constructor({
    userId,
    lessonId,
    timeSpent,
  }: {
    userId: string;
    lessonId: string;
    timeSpent: number;
  }) {
    this.userId = userId;
    this.lessonId = lessonId;
    this.timeSpent = timeSpent;
  }
}
