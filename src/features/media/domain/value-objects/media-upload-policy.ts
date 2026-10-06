/*
 * Funcionalidad: Política de carga de media
 * Descripción: Valida el tipo MIME contra la lista blanca por tipo de media y el tamaño contra el límite configurado, y resuelve el MediaKind del archivo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { MediaFileRequiredError, MediaTooLargeError, UnsupportedMediaTypeError } from "@/features/media/domain/media.errors";
import { MEDIA_KIND_VALUES, type MediaKindValue } from "@/features/media/domain/value-objects/media-kind";

const MEGABYTE: number = 1024 * 1024;

export type MediaSizeLimits = Readonly<Record<MediaKindValue, number>>;

export const MEDIA_MIME_WHITELIST: Readonly<Record<MediaKindValue, readonly string[]>> = {
  IMAGE: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  VIDEO: ["video/mp4", "video/webm"],
  FILE: ["application/pdf"],
};

export const DEFAULT_MEDIA_SIZE_LIMITS: MediaSizeLimits = {
  IMAGE: 10 * MEGABYTE,
  VIDEO: 100 * MEGABYTE,
  FILE: 20 * MEGABYTE,
};

export class MediaUploadPolicy {
  private readonly _sizeLimits: MediaSizeLimits;

  private constructor(sizeLimits: MediaSizeLimits) {
    this._sizeLimits = sizeLimits;
  }

  public get maxSizeBytes(): number {
    return Math.max(...MEDIA_KIND_VALUES.map((kind: MediaKindValue) => this._sizeLimits[kind]));
  }

  public static create(sizeLimits: MediaSizeLimits = DEFAULT_MEDIA_SIZE_LIMITS): MediaUploadPolicy {
    return new MediaUploadPolicy(sizeLimits);
  }

  public static normalizeMimeType(mimeType: string): string {
    return (mimeType.split(";")[0] ?? "").trim().toLowerCase();
  }

  public resolveKind(mimeType: string, sizeBytes: number): MediaKindValue {
    if (sizeBytes <= 0) {
      throw new MediaFileRequiredError();
    }

    const normalized: string = MediaUploadPolicy.normalizeMimeType(mimeType);

    const kind: MediaKindValue | undefined = MEDIA_KIND_VALUES.find((candidate: MediaKindValue) =>
      MEDIA_MIME_WHITELIST[candidate].includes(normalized),
    );

    if (!kind) {
      throw new UnsupportedMediaTypeError(normalized || mimeType);
    }

    const limit: number = this._sizeLimits[kind];

    if (sizeBytes > limit) {
      throw new MediaTooLargeError(limit);
    }

    return kind;
  }
}
