/*
 * Funcionalidad: Comando UpdateStepCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de pasos (tarjetas)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class UpdateStepCommand {
  public readonly stepId: string;
  public readonly title?: string;
  public readonly content?: string;
  public readonly contentType?: string;
  public readonly order?: number;
  public readonly isActive?: boolean;
  public readonly performedBy: string;

  public constructor({
    stepId,
    title,
    content,
    contentType,
    order,
    isActive,
    performedBy,
  }: {
    stepId: string;
    title?: string;
    content?: string;
    contentType?: string;
    order?: number;
    isActive?: boolean;
    performedBy: string;
  }) {
    this.stepId = stepId;
    this.title = title;
    this.content = content;
    this.contentType = contentType;
    this.order = order;
    this.isActive = isActive;
    this.performedBy = performedBy;
  }
}
