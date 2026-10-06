/*
 * Funcionalidad: Caso de uso UploadMediaUseCase
 * Descripción: Valida MIME y tamaño del archivo, lo sube al almacenamiento bajo media/<tipo>/<id>/<nombre-saneado> y persiste la fila Media; si la persistencia falla, elimina el objeto subido
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { FILE_STORAGE_SERVICE_TOKEN, type IFileStorageService } from "@/common/application/ports/file-storage.interface";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { UploadMediaCommand } from "@/features/media/application/commands/upload-media.command";
import { MEDIA_SETTINGS_TOKEN, type MediaSettings } from "@/features/media/application/tokens/media-settings.token";
import { Media } from "@/features/media/domain/entities/media.entity";
import { MediaStorageUnavailableError } from "@/features/media/domain/media.errors";
import { type IMediaRepository, MEDIA_REPOSITORY_TOKEN } from "@/features/media/domain/repositories/media.repository";
import { type MediaKindValue } from "@/features/media/domain/value-objects/media-kind";
import { MediaUploadPolicy } from "@/features/media/domain/value-objects/media-upload-policy";

/**
 * @throws {MediaStorageUnavailableError} If no file storage is configured
 * @throws {MediaFileRequiredError} If the file is empty
 * @throws {UnsupportedMediaTypeError} If the MIME type is not in the whitelist
 * @throws {MediaTooLargeError} If the file exceeds the size limit of its kind
 */
@Injectable()
export class UploadMediaUseCase {
  private readonly _logger: Logger = new Logger(UploadMediaUseCase.name);

  public constructor(
    @Inject(MEDIA_REPOSITORY_TOKEN)
    private readonly _mediaRepository: IMediaRepository,
    @Inject(FILE_STORAGE_SERVICE_TOKEN)
    private readonly _fileStorage: IFileStorageService,
    @Inject(MEDIA_SETTINGS_TOKEN)
    private readonly _settings: MediaSettings,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: UploadMediaCommand): Promise<string> {
    if (!this._fileStorage.isAvailable()) {
      throw new MediaStorageUnavailableError();
    }

    const policy: MediaUploadPolicy = MediaUploadPolicy.create(this._settings.sizeLimits);
    const kind: MediaKindValue = policy.resolveKind(command.mimeType, command.sizeBytes);
    const mimeType: string = MediaUploadPolicy.normalizeMimeType(command.mimeType);

    const media: Media = Media.create({
      ownerId: command.performedBy,
      kind,
      mimeType,
      sizeBytes: command.sizeBytes,
      originalName: command.originalName,
    });

    await this._fileStorage.uploadFile(media.storageKey, command.content, mimeType);

    try {
      const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
        await this._mediaRepository.save(media, transaction);

        return media.getEvents();
      });

      this._eventBus.publish(events);
    } catch (error) {
      await this._fileStorage.deleteFile(media.storageKey).catch((cleanupError: unknown) => {
        this._logger.warn(
          `Orphan storage object ${media.storageKey} could not be removed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
        );
      });

      throw error;
    }

    return media.id;
  }
}
