/*
 * Funcionalidad: Comando de creación de nodo del currículo
 * Descripción: Transporta los datos para crear un nivel, subnivel o módulo desde el editor del currículo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CurriculumNodeTypeValue } from "@/features/curriculum-editor/domain/value-objects/curriculum-node-type";

export class CreateCurriculumNodeCommand {
  public readonly type: CurriculumNodeTypeValue;
  public readonly title: string;
  public readonly parentId?: string;
  public readonly levelId?: string;
  public readonly track?: string;
  public readonly description?: string;
  public readonly color?: string;
  public readonly tags?: string[];
  public readonly order?: number;
  public readonly performedBy: string;

  public constructor({
    type,
    title,
    parentId,
    levelId,
    track,
    description,
    color,
    tags,
    order,
    performedBy,
  }: {
    type: CurriculumNodeTypeValue;
    title: string;
    parentId?: string;
    levelId?: string;
    track?: string;
    description?: string;
    color?: string;
    tags?: string[];
    order?: number;
    performedBy: string;
  }) {
    this.type = type;
    this.title = title;
    this.parentId = parentId;
    this.levelId = levelId;
    this.track = track;
    this.description = description;
    this.color = color;
    this.tags = tags;
    this.order = order;
    this.performedBy = performedBy;
  }
}
