/*
 * Funcionalidad: Comando CreatePageCommand
 * Descripción: Transporta la lección, el título, el slug opcional y los metadatos de una página nueva
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PageContentFields } from "@/features/pages/domain/entities/page.entity";

export class CreatePageCommand {
  public readonly lessonId: string;
  public readonly title: string;
  public readonly slug?: string;
  public readonly fields: PageContentFields;
  public readonly performedBy: string;

  public constructor({ lessonId, title, slug, fields, performedBy }: { lessonId: string; title: string; slug?: string; fields: PageContentFields; performedBy: string }) {
    this.lessonId = lessonId;
    this.title = title;
    this.slug = slug;
    this.fields = fields;
    this.performedBy = performedBy;
  }
}
