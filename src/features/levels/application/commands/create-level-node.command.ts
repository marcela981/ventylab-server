/*
 * Funcionalidad: Comando CreateLevelNodeCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de niveles
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class CreateLevelNodeCommand {
  public readonly title: string;
  public readonly parentId?: string;
  public readonly track?: string;
  public readonly description?: string;
  public readonly color?: string;
  public readonly tags?: string[];
  public readonly order?: number;
  public readonly performedBy: string;

  public constructor({
    title,
    parentId,
    track,
    description,
    color,
    tags,
    order,
    performedBy,
  }: {
    title: string;
    parentId?: string;
    track?: string;
    description?: string;
    color?: string;
    tags?: string[];
    order?: number;
    performedBy: string;
  }) {
    this.title = title;
    this.parentId = parentId;
    this.track = track;
    this.description = description;
    this.color = color;
    this.tags = tags;
    this.order = order;
    this.performedBy = performedBy;
  }
}
