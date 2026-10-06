/*
 * Funcionalidad: Caso de uso RecordChangeUseCase
 * Descripción: Ejecuta la operación RecordChange de la feature de historial de cambios; depende de IChangeLogRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { RecordChangeCommand } from "@/features/changelog/application/commands/record-change.command";
import { ChangeLogEntry } from "@/features/changelog/domain/entities/change-log-entry.entity";
import { CHANGELOG_REPOSITORY_TOKEN, type IChangeLogRepository } from "@/features/changelog/domain/repositories/changelog.repository";
import { UPDATE_CHANGE_LOG_ACTION } from "@/features/changelog/domain/value-objects/change-log-action";

@Injectable()
export class RecordChangeUseCase {
  public constructor(
    @Inject(CHANGELOG_REPOSITORY_TOKEN)
    private readonly _changeLogRepository: IChangeLogRepository,
  ) {}

  public async execute(command: RecordChangeCommand): Promise<void> {
    const hasDiff: boolean = command.diff !== undefined && Object.keys(command.diff).length > 0;

    if (command.action === UPDATE_CHANGE_LOG_ACTION && !hasDiff) {
      return;
    }

    const entry: ChangeLogEntry = ChangeLogEntry.create({
      entityType: command.entityType,
      entityId: command.entityId,
      action: command.action,
      changedBy: command.changedBy,
      diff: hasDiff ? command.diff : undefined,
      metadata: command.metadata,
    });

    await this._changeLogRepository.save(entry);
  }
}
