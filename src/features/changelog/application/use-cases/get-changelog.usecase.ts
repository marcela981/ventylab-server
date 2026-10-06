/*
 * Funcionalidad: Caso de uso GetChangeLogUseCase
 * Descripción: Ejecuta la operación GetChangeLog de la feature de historial de cambios; depende de IChangeLogRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { type ChangeLogRequester } from "@/features/changelog/application/commands/change-log-requester";
import { type ChangeLogEntry } from "@/features/changelog/domain/entities/change-log-entry.entity";
import {
  CHANGELOG_REPOSITORY_TOKEN,
  type GetChangeLogQuery,
  type IChangeLogRepository,
} from "@/features/changelog/domain/repositories/changelog.repository";

@Injectable()
export class GetChangeLogUseCase {
  public constructor(
    @Inject(CHANGELOG_REPOSITORY_TOKEN)
    private readonly _changeLogRepository: IChangeLogRepository,
  ) {}

  public async execute(query: GetChangeLogQuery, requester: ChangeLogRequester): Promise<Paginated<ChangeLogEntry>> {
    return await this._changeLogRepository.getAll({
      ...query,
      changedBy: requester.ownChangesOnly ?? query.changedBy,
    });
  }
}
