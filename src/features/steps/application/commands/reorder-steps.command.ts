/*
 * Funcionalidad: Comando ReorderStepsCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de pasos (tarjetas)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class ReorderStepsCommand {
  public readonly lessonId: string;
  public readonly stepIds: string[];
  public readonly performedBy: string;

  public constructor({
    lessonId,
    stepIds,
    performedBy,
  }: {
    lessonId: string;
    stepIds: string[];
    performedBy: string;
  }) {
    this.lessonId = lessonId;
    this.stepIds = stepIds;
    this.performedBy = performedBy;
  }
}
