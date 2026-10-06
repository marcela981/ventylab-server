/*
 * Funcionalidad: Comando UpdateSectionCommand
 * Descripción: Transporta los cambios de slug, título, descripción o estado de una sección
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";

export class UpdateSectionCommand {
  public readonly sectionId: string;
  public readonly slug?: string;
  public readonly title?: string;
  public readonly description?: string;
  public readonly status?: ContentStatusValue;
  public readonly performedBy: string;

  public constructor({
    sectionId,
    slug,
    title,
    description,
    status,
    performedBy,
  }: {
    sectionId: string;
    slug?: string;
    title?: string;
    description?: string;
    status?: ContentStatusValue;
    performedBy: string;
  }) {
    this.sectionId = sectionId;
    this.slug = slug;
    this.title = title;
    this.description = description;
    this.status = status;
    this.performedBy = performedBy;
  }
}
