/*
 * Funcionalidad: Caso de uso GetMediaListUseCase
 * Descripción: Lista paginada de archivos de media; los docentes quedan filtrados a sus propios archivos y los administradores pueden filtrar por propietario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { GetMediaListCommand } from "@/features/media/application/commands/get-media-list.command";
import { type Media } from "@/features/media/domain/entities/media.entity";
import { type IMediaRepository, MEDIA_REPOSITORY_TOKEN } from "@/features/media/domain/repositories/media.repository";
import { canManageAllMedia } from "@/features/media/domain/services/media-access";

@Injectable()
export class GetMediaListUseCase {
  public constructor(
    @Inject(MEDIA_REPOSITORY_TOKEN)
    private readonly _mediaRepository: IMediaRepository,
  ) {}

  public async execute(command: GetMediaListCommand): Promise<Paginated<Media>> {
    const ownerId: string | undefined = canManageAllMedia(command.requester) ? command.query.ownerId : command.requester.userId;

    return await this._mediaRepository.getAll({ ...command.query, ownerId });
  }
}
