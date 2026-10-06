/*
 * Funcionalidad: Caso de uso GetMediaURLUseCase
 * Descripción: Firma una URL de descarga temporal para un archivo de media; docentes y administradores siempre la obtienen y los estudiantes solo si el archivo está referenciado por contenido publicado en toda su jerarquía (404 en otro caso)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { FILE_STORAGE_SERVICE_TOKEN, type IFileStorageService } from "@/common/application/ports/file-storage.interface";
import { MediaAccessCommand } from "@/features/media/application/commands/media-access.command";
import { MediaURLResult } from "@/features/media/application/results/media-url.result";
import { MEDIA_SETTINGS_TOKEN, type MediaSettings } from "@/features/media/application/tokens/media-settings.token";
import { type Media } from "@/features/media/domain/entities/media.entity";
import { MediaNotFoundError, MediaStorageUnavailableError } from "@/features/media/domain/media.errors";
import { type IMediaRepository, MEDIA_REPOSITORY_TOKEN } from "@/features/media/domain/repositories/media.repository";
import { canReadMediaURL } from "@/features/media/domain/services/media-access";

/**
 * @throws {MediaNotFoundError} If the media does not exist or the student cannot see any published content that uses it
 * @throws {MediaStorageUnavailableError} If no file storage is configured
 */
@Injectable()
export class GetMediaURLUseCase {
  public constructor(
    @Inject(MEDIA_REPOSITORY_TOKEN)
    private readonly _mediaRepository: IMediaRepository,
    @Inject(FILE_STORAGE_SERVICE_TOKEN)
    private readonly _fileStorage: IFileStorageService,
    @Inject(MEDIA_SETTINGS_TOKEN)
    private readonly _settings: MediaSettings,
  ) {}

  public async execute(command: MediaAccessCommand): Promise<MediaURLResult> {
    const media: Media | undefined = await this._mediaRepository.getById(command.mediaId);

    if (!media) {
      throw new MediaNotFoundError();
    }

    const allowed: boolean = await canReadMediaURL(command.requester, (): Promise<boolean> =>
      this._mediaRepository.isReferencedByPublishedContent(media.id),
    );

    if (!allowed) {
      throw new MediaNotFoundError();
    }

    if (!this._fileStorage.isAvailable()) {
      throw new MediaStorageUnavailableError();
    }

    const ttlSeconds: number = this._settings.signedUrlTtlSeconds;
    const url: string = await this._fileStorage.generateDownloadUrl(media.storageKey, ttlSeconds);

    return new MediaURLResult({
      mediaId: media.id,
      url,
      mimeType: media.mimeType,
      kind: media.kind,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    });
  }
}
