/*
 * Funcionalidad: Caso de uso MAX_RECENT_CHANGES
 * Descripción: Ejecuta la operación MAX_RECENT_CHANGES de la feature de historial de cambios; depende de IChangeLogRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ChangeLogRequester } from "@/features/changelog/application/commands/change-log-requester";
import { type ChangeLogEntry } from "@/features/changelog/domain/entities/change-log-entry.entity";
import { CHANGELOG_REPOSITORY_TOKEN, type IChangeLogRepository } from "@/features/changelog/domain/repositories/changelog.repository";

export const MAX_RECENT_CHANGES: number = 100;

@Injectable()
export class GetRecentChangesUseCase {
  public constructor(
    @Inject(CHANGELOG_REPOSITORY_TOKEN)
    private readonly _changeLogRepository: IChangeLogRepository,
  ) {}

  public async execute(limit: number, requester: ChangeLogRequester): Promise<ChangeLogEntry[]> {
    return await this._changeLogRepository.getRecent(Math.min(limit, MAX_RECENT_CHANGES), requester.ownChangesOnly);
  }
}
