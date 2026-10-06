/*
 * Funcionalidad: Comando CreateModuleNodeCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de módulos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class CreateModuleNodeCommand {
  public readonly levelId?: string;
  public readonly title: string;
  public readonly description?: string;
  public readonly color?: string;
  public readonly tags?: string[];
  public readonly order?: number;
  public readonly performedBy: string;

  public constructor({
    levelId,
    title,
    description,
    color,
    tags,
    order,
    performedBy,
  }: {
    levelId?: string;
    title: string;
    description?: string;
    color?: string;
    tags?: string[];
    order?: number;
    performedBy: string;
  }) {
    this.levelId = levelId;
    this.title = title;
    this.description = description;
    this.color = color;
    this.tags = tags;
    this.order = order;
    this.performedBy = performedBy;
  }
}
