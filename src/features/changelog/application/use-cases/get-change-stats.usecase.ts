/*
 * Funcionalidad: Caso de uso GetChangeStatsUseCase
 * Descripción: Ejecuta la operación GetChangeStats de la feature de historial de cambios; depende de IChangeLogRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ChangeLogRequester } from "@/features/changelog/application/commands/change-log-requester";
import { CHANGELOG_REPOSITORY_TOKEN, type IChangeLogRepository } from "@/features/changelog/domain/repositories/changelog.repository";
import { type ChangeLogStats } from "@/features/changelog/domain/value-objects/change-log-stats";

@Injectable()
export class GetChangeStatsUseCase {
  public constructor(
    @Inject(CHANGELOG_REPOSITORY_TOKEN)
    private readonly _changeLogRepository: IChangeLogRepository,
  ) {}

  public async execute(fromDate: Date, toDate: Date, requester: ChangeLogRequester): Promise<ChangeLogStats> {
    return await this._changeLogRepository.getStats(fromDate, toDate, requester.ownChangesOnly);
  }
}
