/*
 * Funcionalidad: Comando CreatePageBlockCommand
 * Descripción: Transporta el tipo, contenido y media opcional de un bloque nuevo de página
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PageBlockTypeValue } from "@/features/pages/domain/value-objects/page-block-type";

export class CreatePageBlockCommand {
  public readonly pageId: string;
  public readonly type: PageBlockTypeValue;
  public readonly title?: string;
  public readonly content: unknown;
  public readonly mediaId?: string;
  public readonly estimatedTime?: number;
  public readonly performedBy: string;

  public constructor({
    pageId,
    type,
    title,
    content,
    mediaId,
    estimatedTime,
    performedBy,
  }: {
    pageId: string;
    type: PageBlockTypeValue;
    title?: string;
    content: unknown;
    mediaId?: string;
    estimatedTime?: number;
    performedBy: string;
  }) {
    this.pageId = pageId;
    this.type = type;
    this.title = title;
    this.content = content;
    this.mediaId = mediaId;
    this.estimatedTime = estimatedTime;
    this.performedBy = performedBy;
  }
}
