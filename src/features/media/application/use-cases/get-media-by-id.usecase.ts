/*
 * Funcionalidad: Caso de uso GetMediaByIdUseCase
 * Descripción: Obtiene un archivo de media; los administradores ven cualquiera y los docentes solo los propios (404 en otro caso)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { MediaAccessCommand } from "@/features/media/application/commands/media-access.command";
import { type Media } from "@/features/media/domain/entities/media.entity";
import { MediaNotFoundError } from "@/features/media/domain/media.errors";
import { type IMediaRepository, MEDIA_REPOSITORY_TOKEN } from "@/features/media/domain/repositories/media.repository";
import { canManageAllMedia } from "@/features/media/domain/services/media-access";

/**
 * @throws {MediaNotFoundError} If the media does not exist or belongs to another teacher
 */
@Injectable()
export class GetMediaByIdUseCase {
  public constructor(
    @Inject(MEDIA_REPOSITORY_TOKEN)
    private readonly _mediaRepository: IMediaRepository,
  ) {}

  public async execute(command: MediaAccessCommand): Promise<Media> {
    const media: Media | undefined = await this._mediaRepository.getById(command.mediaId);

    if (!media || (!canManageAllMedia(command.requester) && !media.isOwnedBy(command.requester.userId))) {
      throw new MediaNotFoundError();
    }

    return media;
  }
}
