/*
 * Funcionalidad: Registro de cambios de módulos
 * Descripción: Escucha los eventos de dominio de módulos y escribe las entradas del historial de cambios mediante RecordChangeUseCase, sin bloquear la operación si el registro falla
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { RecordChangeCommand } from "@/features/changelog/application/commands/record-change.command";
import { RecordChangeUseCase } from "@/features/changelog/application/use-cases/record-change.usecase";
import { type ChangeLogDiff } from "@/features/changelog/domain/entities/change-log-entry.entity";
import { DEACTIVATION_CHANGE_LOG_DIFF, pickTrackedChanges } from "@/features/changelog/domain/services/change-log-diff";
import {
  type ChangeLogActionValue,
  CREATE_CHANGE_LOG_ACTION,
  DELETE_CHANGE_LOG_ACTION,
  UPDATE_CHANGE_LOG_ACTION,
} from "@/features/changelog/domain/value-objects/change-log-action";
import { MODULE_CHANGE_LOG_ENTITY_TYPE } from "@/features/changelog/domain/value-objects/change-log-entity-type";
import { ModuleCreatedEvent, ModuleDeactivatedEvent, ModuleUpdatedEvent } from "@/features/modules/domain/events/module.events";

const MODULE_TRACKED_FIELDS: readonly string[] = ["title", "description", "category", "difficulty", "estimatedTime", "thumbnail", "order", "isActive"];

@Injectable()
export class ModulesChangeLogHandlers {
  private readonly _logger: Logger = new Logger(ModulesChangeLogHandlers.name);

  public constructor(private readonly _recordChangeUseCase: RecordChangeUseCase) {}

  @OnEvent(ModuleCreatedEvent.name)
  public async handleModuleCreated(event: ModuleCreatedEvent): Promise<void> {
    await this._record(event.entity.id, CREATE_CHANGE_LOG_ACTION, event.performedBy);
  }

  @OnEvent(ModuleUpdatedEvent.name)
  public async handleModuleUpdated(event: ModuleUpdatedEvent): Promise<void> {
    await this._record(event.entity.id, UPDATE_CHANGE_LOG_ACTION, event.performedBy, pickTrackedChanges(event.changes, MODULE_TRACKED_FIELDS));
  }

  @OnEvent(ModuleDeactivatedEvent.name)
  public async handleModuleDeactivated(event: ModuleDeactivatedEvent): Promise<void> {
    await this._record(event.entity.id, DELETE_CHANGE_LOG_ACTION, event.performedBy, DEACTIVATION_CHANGE_LOG_DIFF);
  }

  private async _record(entityId: string, action: ChangeLogActionValue, performedBy?: string, diff?: ChangeLogDiff): Promise<void> {
    if (!performedBy) {
      return;
    }

    try {
      await this._recordChangeUseCase.execute(
        new RecordChangeCommand({ entityType: MODULE_CHANGE_LOG_ENTITY_TYPE, entityId, action, changedBy: performedBy, diff }),
      );
    } catch (error: unknown) {
      this._logger.error(`Failed to record module change for ${entityId}`, error instanceof Error ? error.stack : String(error));
    }
  }
}
