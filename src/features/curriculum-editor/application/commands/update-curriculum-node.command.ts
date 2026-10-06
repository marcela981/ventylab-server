/*
 * Funcionalidad: Comando de actualización de nodo del currículo
 * Descripción: Transporta los cambios de título, descripción, color, etiquetas, orden o estado de un nivel o módulo desde el editor del currículo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CurriculumNodeTypeValue } from "@/features/curriculum-editor/domain/value-objects/curriculum-node-type";

export class UpdateCurriculumNodeCommand {
  public readonly id: string;
  public readonly type: CurriculumNodeTypeValue;
  public readonly title?: string;
  public readonly description?: string;
  public readonly color?: string;
  public readonly tags?: string[];
  public readonly order?: number;
  public readonly isActive?: boolean;
  public readonly performedBy: string;

  public constructor({
    id,
    type,
    title,
    description,
    color,
    tags,
    order,
    isActive,
    performedBy,
  }: {
    id: string;
    type: CurriculumNodeTypeValue;
    title?: string;
    description?: string;
    color?: string;
    tags?: string[];
    order?: number;
    isActive?: boolean;
    performedBy: string;
  }) {
    this.id = id;
    this.type = type;
    this.title = title;
    this.description = description;
    this.color = color;
    this.tags = tags;
    this.order = order;
    this.isActive = isActive;
    this.performedBy = performedBy;
  }
}
