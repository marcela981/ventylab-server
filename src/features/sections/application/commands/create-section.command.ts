/*
 * Funcionalidad: Comando CreateSectionCommand
 * Descripción: Transporta los datos para crear una sección del currículo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";

export class CreateSectionCommand {
  public readonly slug: string;
  public readonly title: string;
  public readonly description?: string;
  public readonly order?: number;
  public readonly status?: ContentStatusValue;
  public readonly performedBy: string;

  public constructor({
    slug,
    title,
    description,
    order,
    status,
    performedBy,
  }: {
    slug: string;
    title: string;
    description?: string;
    order?: number;
    status?: ContentStatusValue;
    performedBy: string;
  }) {
    this.slug = slug;
    this.title = title;
    this.description = description;
    this.order = order;
    this.status = status;
    this.performedBy = performedBy;
  }
}
