/*
 * Funcionalidad: Comando UpdatePageCommand
 * Descripción: Transporta los cambios de metadatos o estado de una página y la nota de cambio de su revisión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PageContentFields } from "@/features/pages/domain/entities/page.entity";

export class UpdatePageCommand {
  public readonly pageId: string;
  public readonly fields: PageContentFields;
  public readonly changeLog?: string;
  public readonly performedBy: string;

  public constructor({ pageId, fields, changeLog, performedBy }: { pageId: string; fields: PageContentFields; changeLog?: string; performedBy: string }) {
    this.pageId = pageId;
    this.fields = fields;
    this.changeLog = changeLog;
    this.performedBy = performedBy;
  }
}
