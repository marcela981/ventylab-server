/*
 * Funcionalidad: Mapper de presentación de media
 * Descripción: Convierte entidades Media y resultados de URL firmada en DTOs de respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type MediaURLResult } from "@/features/media/application/results/media-url.result";
import { type Media } from "@/features/media/domain/entities/media.entity";
import { MediaDTO, MediaURLDTO } from "@/features/media/presentation/dtos/media.dto";

export class MediaMapper {
  public static toDTO(media: Media): MediaDTO {
    return new MediaDTO({
      id: media.id,
      ownerId: media.ownerId,
      kind: media.kind,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      originalName: media.originalName,
      createdAt: media.createdAt.toISOString(),
    });
  }

  public static toURLDTO(result: MediaURLResult): MediaURLDTO {
    return new MediaURLDTO({
      mediaId: result.mediaId,
      url: result.url,
      mimeType: result.mimeType,
      kind: result.kind,
      expiresAt: result.expiresAt.toISOString(),
    });
  }
}
