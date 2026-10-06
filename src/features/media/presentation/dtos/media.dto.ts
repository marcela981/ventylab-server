/*
 * Funcionalidad: DTOs de respuesta de media
 * Descripción: Serializa archivos de media, el identificador del archivo cargado y la URL firmada con su expiración para la documentación Swagger y las respuestas HTTP
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { MEDIA_KIND_VALUES } from "@/features/media/domain/value-objects/media-kind";

export class MediaIdDTO {
  @ApiProperty({ description: "Identifier of the uploaded media", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  public constructor({ id }: { id: string }) {
    this.id = id;
  }
}

export class MediaDTO {
  @ApiProperty({ description: "Media unique identifier", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Identifier of the user who uploaded the media", example: "clx1abc2d0000qwerty123456" })
  public ownerId: string;

  @ApiProperty({ description: "Media kind", enum: MEDIA_KIND_VALUES, example: "IMAGE" })
  public kind: string;

  @ApiProperty({ description: "MIME type of the stored file", example: "image/png" })
  public mimeType: string;

  @ApiProperty({ description: "File size in bytes", example: 204800 })
  public sizeBytes: number;

  @ApiProperty({ description: "Original file name as uploaded", example: "Curva presión-volumen.png" })
  public originalName: string;

  @ApiProperty({ description: "Upload date", example: "2026-10-05T12:00:00.000Z", format: "date-time" })
  public createdAt: string;

  public constructor({
    id,
    ownerId,
    kind,
    mimeType,
    sizeBytes,
    originalName,
    createdAt,
  }: {
    id: string;
    ownerId: string;
    kind: string;
    mimeType: string;
    sizeBytes: number;
    originalName: string;
    createdAt: string;
  }) {
    this.id = id;
    this.ownerId = ownerId;
    this.kind = kind;
    this.mimeType = mimeType;
    this.sizeBytes = sizeBytes;
    this.originalName = originalName;
    this.createdAt = createdAt;
  }
}

export class MediaURLDTO {
  @ApiProperty({ description: "Media unique identifier", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public mediaId: string;

  @ApiProperty({ description: "Signed download URL", example: "https://example.supabase.co/storage/v1/object/sign/media/image/abc/file.png?token=TOKEN" })
  public url: string;

  @ApiProperty({ description: "MIME type of the stored file", example: "image/png" })
  public mimeType: string;

  @ApiProperty({ description: "Media kind", enum: MEDIA_KIND_VALUES, example: "IMAGE" })
  public kind: string;

  @ApiProperty({ description: "Date when the signed URL expires", example: "2026-10-05T13:00:00.000Z", format: "date-time" })
  public expiresAt: string;

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
    kind: string;
    expiresAt: string;
  }) {
    this.mediaId = mediaId;
    this.url = url;
    this.mimeType = mimeType;
    this.kind = kind;
    this.expiresAt = expiresAt;
  }
}
