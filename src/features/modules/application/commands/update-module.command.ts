/*
 * Funcionalidad: Comando UpdateModuleCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de módulos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";

export class UpdateModuleCommand {
  public readonly moduleId: string;
  public readonly title?: string;
  public readonly description?: string;
  public readonly category?: string;
  public readonly difficulty?: string;
  public readonly estimatedTime?: number;
  public readonly thumbnail?: string;
  public readonly order?: number;
  public readonly status?: ContentStatusValue;
  public readonly isActive?: boolean;
  public readonly performedBy: string;

  public constructor({
    moduleId,
    title,
    description,
    category,
    difficulty,
    estimatedTime,
    thumbnail,
    order,
    isActive,
    status,
    performedBy,
  }: {
    moduleId: string;
    title?: string;
    description?: string;
    category?: string;
    difficulty?: string;
    estimatedTime?: number;
    thumbnail?: string;
    order?: number;
    status?: ContentStatusValue;
    isActive?: boolean;
    performedBy: string;
  }) {
    this.moduleId = moduleId;
    this.title = title;
    this.description = description;
    this.category = category;
    this.difficulty = difficulty;
    this.estimatedTime = estimatedTime;
    this.thumbnail = thumbnail;
    this.order = order;
    this.isActive = isActive;
    this.status = status;
    this.performedBy = performedBy;
  }
}
