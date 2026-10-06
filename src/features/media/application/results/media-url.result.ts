/*
 * Funcionalidad: Resultado MediaURLResult
 * Descripción: URL firmada de un archivo de media junto con su MIME, tipo y fecha de expiración
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type MediaKindValue } from "@/features/media/domain/value-objects/media-kind";

export class MediaURLResult {
  public readonly mediaId: string;
  public readonly url: string;
  public readonly mimeType: string;
  public readonly kind: MediaKindValue;
  public readonly expiresAt: Date;

  public constructor({
    mediaId,
    url,
    mimeType,
    kind,
    expiresAt,
  }: {
    mediaId: string;
    url: string;
    mimeType: string;
    kind: MediaKindValue;
    expiresAt: Date;
  }) {
    this.mediaId = mediaId;
    this.url = url;
    this.mimeType = mimeType;
    this.kind = kind;
    this.expiresAt = expiresAt;
  }
}
