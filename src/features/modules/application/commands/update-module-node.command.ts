/*
 * Funcionalidad: Comando UpdateModuleNodeCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de módulos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class UpdateModuleNodeCommand {
  public readonly moduleId: string;
  public readonly title?: string;
  public readonly description?: string;
  public readonly color?: string;
  public readonly tags?: string[];
  public readonly order?: number;
  public readonly isActive?: boolean;
  public readonly performedBy: string;

  public constructor({
    moduleId,
    title,
    description,
    color,
    tags,
    order,
    isActive,
    performedBy,
  }: {
    moduleId: string;
    title?: string;
    description?: string;
    color?: string;
    tags?: string[];
    order?: number;
    isActive?: boolean;
    performedBy: string;
  }) {
    this.moduleId = moduleId;
    this.title = title;
    this.description = description;
    this.color = color;
    this.tags = tags;
    this.order = order;
    this.isActive = isActive;
    this.performedBy = performedBy;
  }
}
