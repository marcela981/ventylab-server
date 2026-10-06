/*
 * Funcionalidad: Comando UploadMediaCommand
 * Descripción: Transporta el archivo recibido (contenido, MIME, tamaño y nombre original) y el usuario que lo carga
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class UploadMediaCommand {
  public readonly content: Buffer;
  public readonly mimeType: string;
  public readonly sizeBytes: number;
  public readonly originalName: string;
  public readonly performedBy: string;

  public constructor({
    content,
    mimeType,
    sizeBytes,
    originalName,
    performedBy,
  }: {
    content: Buffer;
    mimeType: string;
    sizeBytes: number;
    originalName: string;
    performedBy: string;
  }) {
    this.content = content;
    this.mimeType = mimeType;
    this.sizeBytes = sizeBytes;
    this.originalName = originalName;
    this.performedBy = performedBy;
  }
}
