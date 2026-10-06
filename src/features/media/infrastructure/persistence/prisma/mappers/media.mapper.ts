/*
 * Funcionalidad: Mapper de persistencia de media
 * Descripción: Convierte filas Prisma de la tabla media en entidades Media y viceversa
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Media as MediaModel, type Prisma } from "@prisma/client";

import { Media } from "@/features/media/domain/entities/media.entity";

export class MediaMapper {
  public static toDomain(row: MediaModel): Media {
    return Media.reconstitute({
      id: row.id,
      ownerId: row.ownerId,
      kind: row.kind,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      storageKey: row.storageKey,
      originalName: row.originalName,
      createdAt: row.createdAt,
      auditLogs: [],
    });
  }

  public static toPersistence(media: Media): Prisma.MediaUncheckedCreateInput {
    return {
      id: media.id,
      ownerId: media.ownerId,
      kind: media.kind,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      storageKey: media.storageKey,
      originalName: media.originalName,
      createdAt: media.createdAt,
    };
  }
}
