/*
 * Funcionalidad: Errores de dominio de media
 * Descripción: Define los errores de negocio de la feature de media (no encontrado, en uso, almacenamiento no disponible, tipo MIME no permitido, tamaño excedido y archivo ausente)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class MediaNotFoundError extends DomainError {
  public constructor() {
    super("Media not found", "media.media_not_found");
  }
}

export class MediaInUseError extends DomainError {
  public constructor() {
    super("The media is referenced by page content and cannot be deleted", "media.media_in_use");
  }
}

export class MediaStorageUnavailableError extends DomainError {
  public constructor() {
    super("File storage is not configured", "media.storage_unavailable");
  }
}

export class UnsupportedMediaTypeError extends DomainError {
  public constructor(mimeType: string) {
    super(`The file type ${mimeType} is not allowed`, "media.unsupported_media_type");
  }
}

export class MediaTooLargeError extends DomainError {
  public constructor(maxSizeBytes: number) {
    super(`The file exceeds the maximum size of ${maxSizeBytes} bytes`, "media.media_too_large");
  }
}

export class MediaFileRequiredError extends DomainError {
  public constructor() {
    super("A non-empty file is required", "media.file_required");
  }
}
