/*
 * Funcionalidad: Política de carga de media
 * Descripción: Valida el tipo MIME contra la lista blanca por tipo de media y el tamaño contra el límite configurado, y resuelve el MediaKind del archivo
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES } from "@/common/domain/value-objects/avatar-upload-rules";
import { MediaContentMismatchError, MediaFileRequiredError, MediaTooLargeError, UnsupportedMediaTypeError } from "@/features/media/domain/media.errors";
import { MEDIA_KIND_VALUES, type MediaKindValue } from "@/features/media/domain/value-objects/media-kind";

const MEGABYTE: number = 1024 * 1024;

export type MediaSizeLimits = Readonly<Record<MediaKindValue, number>>;

export const MEDIA_MIME_WHITELIST: Readonly<Record<MediaKindValue, readonly string[]>> = {
  IMAGE: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  VIDEO: ["video/mp4", "video/webm"],
  FILE: ["application/pdf"],
};

export type MediaMimeWhitelist = Readonly<Record<MediaKindValue, readonly string[]>>;

// Profile photo (shared rules): png, jpeg or webp up to 2 MB, and the first bytes must match the declared type.
const AVATAR_MIME_WHITELIST: MediaMimeWhitelist = { IMAGE: AVATAR_MIME_TYPES, VIDEO: [], FILE: [] };

const AVATAR_SIZE_LIMITS: MediaSizeLimits = { IMAGE: AVATAR_MAX_BYTES, VIDEO: 0, FILE: 0 };

// File signatures: the bytes at an offset that every valid file of the type starts with.
const IMAGE_SIGNATURES: Readonly<Record<string, readonly { readonly offset: number; readonly bytes: readonly number[] }[]>> = {
  "image/png": [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  "image/jpeg": [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  "image/webp": [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  ],
};

export function matchesImageSignature(mimeType: string, content: Buffer): boolean {
  const signature: readonly { readonly offset: number; readonly bytes: readonly number[] }[] | undefined = IMAGE_SIGNATURES[mimeType];

  return (
    signature !== undefined &&
    signature.every((part: { readonly offset: number; readonly bytes: readonly number[] }) =>
      part.bytes.every((byte: number, index: number) => content[part.offset + index] === byte),
    )
  );
}

export const DEFAULT_MEDIA_SIZE_LIMITS: MediaSizeLimits = {
  IMAGE: 10 * MEGABYTE,
  VIDEO: 100 * MEGABYTE,
  FILE: 20 * MEGABYTE,
};

export class MediaUploadPolicy {
  private readonly _sizeLimits: MediaSizeLimits;
  private readonly _whitelist: MediaMimeWhitelist;
  private readonly _verifiesContent: boolean;

  private constructor(sizeLimits: MediaSizeLimits, whitelist: MediaMimeWhitelist, verifiesContent: boolean) {
    this._sizeLimits = sizeLimits;
    this._whitelist = whitelist;
    this._verifiesContent = verifiesContent;
  }

  public get maxSizeBytes(): number {
    return Math.max(...MEDIA_KIND_VALUES.map((kind: MediaKindValue) => this._sizeLimits[kind]));
  }

  public static create(sizeLimits: MediaSizeLimits = DEFAULT_MEDIA_SIZE_LIMITS): MediaUploadPolicy {
    return new MediaUploadPolicy(sizeLimits, MEDIA_MIME_WHITELIST, false);
  }

  public static avatar(): MediaUploadPolicy {
    return new MediaUploadPolicy(AVATAR_SIZE_LIMITS, AVATAR_MIME_WHITELIST, true);
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
      this._whitelist[candidate].includes(normalized),
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

  /**
   * @throws {MediaContentMismatchError} If the policy verifies content and the first bytes do not match the declared image type
   */
  public assertContent(mimeType: string, content: Buffer): void {
    const normalized: string = MediaUploadPolicy.normalizeMimeType(mimeType);

    if (this._verifiesContent && !matchesImageSignature(normalized, content)) {
      throw new MediaContentMismatchError(normalized);
    }
  }
}
