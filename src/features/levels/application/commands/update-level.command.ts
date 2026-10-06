/*
 * Funcionalidad: Comando UpdateLevelCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de niveles
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";

export class UpdateLevelCommand {
  public readonly levelId: string;
  public readonly title?: string;
  public readonly track?: string;
  public readonly description?: string;
  public readonly order?: number;
  public readonly status?: ContentStatusValue;
  public readonly sectionId?: string;
  public readonly isActive?: boolean;
  public readonly performedBy: string;

  public constructor({
    levelId,
    title,
    track,
    description,
    order,
    status,
    sectionId,
    isActive,
    performedBy,
  }: {
    levelId: string;
    title?: string;
    track?: string;
    description?: string;
    order?: number;
    status?: ContentStatusValue;
    sectionId?: string;
    isActive?: boolean;
    performedBy: string;
  }) {
    this.levelId = levelId;
    this.title = title;
    this.track = track;
    this.description = description;
    this.order = order;
    this.status = status;
    this.sectionId = sectionId;
    this.isActive = isActive;
    this.performedBy = performedBy;
  }
}
