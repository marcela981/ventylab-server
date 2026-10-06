/*
 * Funcionalidad: Comando DeleteStepCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de pasos (tarjetas)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class DeleteStepCommand {
  public readonly stepId: string;
  public readonly performedBy: string;

  public constructor({
    stepId,
    performedBy,
  }: {
    stepId: string;
    performedBy: string;
  }) {
    this.stepId = stepId;
    this.performedBy = performedBy;
  }
}
