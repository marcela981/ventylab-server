/*
 * Funcionalidad: Caso de uso DeleteMediaUseCase
 * Descripción: Elimina un archivo de media propio (o cualquiera para administradores) si ninguna sección de página lo referencia: primero borra el objeto del almacenamiento y luego la fila
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { FILE_STORAGE_SERVICE_TOKEN, type IFileStorageService } from "@/common/application/ports/file-storage.interface";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { MediaAccessCommand } from "@/features/media/application/commands/media-access.command";
import { type Media } from "@/features/media/domain/entities/media.entity";
import { MediaNotFoundError, MediaStorageUnavailableError } from "@/features/media/domain/media.errors";
import { type IMediaRepository, MEDIA_REPOSITORY_TOKEN } from "@/features/media/domain/repositories/media.repository";
import { canManageAllMedia } from "@/features/media/domain/services/media-access";

/**
 * @throws {MediaNotFoundError} If the media does not exist or belongs to another teacher
 * @throws {MediaInUseError} If any page section references the media
 * @throws {MediaStorageUnavailableError} If no file storage is configured
 */
@Injectable()
export class DeleteMediaUseCase {
  public constructor(
    @Inject(MEDIA_REPOSITORY_TOKEN)
    private readonly _mediaRepository: IMediaRepository,
    @Inject(FILE_STORAGE_SERVICE_TOKEN)
    private readonly _fileStorage: IFileStorageService,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: MediaAccessCommand): Promise<void> {
    const media: Media | undefined = await this._mediaRepository.getById(command.mediaId);

    if (!media || (!canManageAllMedia(command.requester) && !media.isOwnedBy(command.requester.userId))) {
      throw new MediaNotFoundError();
    }

    const referenceCount: number = await this._mediaRepository.countPageSectionReferences(media.id);

    media.delete({ referenceCount, performedBy: command.requester.userId });

    if (!this._fileStorage.isAvailable()) {
      throw new MediaStorageUnavailableError();
    }

    await this._fileStorage.deleteFile(media.storageKey);

    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      await this._mediaRepository.delete(media, transaction);

      return media.getEvents();
    });

    this._eventBus.publish(events);
  }
}
