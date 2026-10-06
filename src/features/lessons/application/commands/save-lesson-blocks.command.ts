/*
 * Funcionalidad: Comando SaveLessonBlocksCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de lecciones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class SaveLessonBlocksCommand {
  public readonly lessonId: string;
  public readonly blocks: unknown[];
  public readonly performedBy: string;

  public constructor({
    lessonId,
    blocks,
    performedBy,
  }: {
    lessonId: string;
    blocks: unknown[];
    performedBy: string;
  }) {
    this.lessonId = lessonId;
    this.blocks = blocks;
    this.performedBy = performedBy;
  }
}
