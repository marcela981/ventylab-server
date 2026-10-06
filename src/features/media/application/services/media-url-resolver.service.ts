/*
 * Funcionalidad: Servicio MediaURLResolverService
 * Descripción: Implementa IMediaUrlResolver: carga todas las filas Media pedidas en una sola consulta y firma sus URLs en un único lote del almacenamiento; devuelve un mapa vacío si el almacenamiento no está configurado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { FILE_STORAGE_SERVICE_TOKEN, type IFileStorageService } from "@/common/application/ports/file-storage.interface";
import { type IMediaUrlResolver, type ResolvedMediaURL } from "@/common/application/ports/media-url-resolver.interface";
import { MEDIA_SETTINGS_TOKEN, type MediaSettings } from "@/features/media/application/tokens/media-settings.token";
import { type Media } from "@/features/media/domain/entities/media.entity";
import { type IMediaRepository, MEDIA_REPOSITORY_TOKEN } from "@/features/media/domain/repositories/media.repository";

@Injectable()
export class MediaURLResolverService implements IMediaUrlResolver {
  public constructor(
    @Inject(MEDIA_REPOSITORY_TOKEN)
    private readonly _mediaRepository: IMediaRepository,
    @Inject(FILE_STORAGE_SERVICE_TOKEN)
    private readonly _fileStorage: IFileStorageService,
    @Inject(MEDIA_SETTINGS_TOKEN)
    private readonly _settings: MediaSettings,
  ) {}

  public async resolveMany(mediaIds: string[]): Promise<Map<string, ResolvedMediaURL>> {
    const resolved: Map<string, ResolvedMediaURL> = new Map<string, ResolvedMediaURL>();
    const uniqueIds: string[] = [...new Set(mediaIds)];

    if (uniqueIds.length === 0 || !this._fileStorage.isAvailable()) {
      return resolved;
    }

    const mediaList: Media[] = await this._mediaRepository.getByIds(uniqueIds);

    if (mediaList.length === 0) {
      return resolved;
    }

    const ttlSeconds: number = this._settings.signedUrlTtlSeconds;
    const expiresAt: Date = new Date(Date.now() + ttlSeconds * 1000);

    const urls: Map<string, string> = await this._fileStorage.generateDownloadUrls(
      mediaList.map((media: Media) => media.storageKey),
      ttlSeconds,
    );

    for (const media of mediaList) {
      const url: string | undefined = urls.get(media.storageKey);

      if (url) {
        resolved.set(media.id, { mediaId: media.id, url, mimeType: media.mimeType, kind: media.kind, expiresAt });
      }
    }

    return resolved;
  }
}
