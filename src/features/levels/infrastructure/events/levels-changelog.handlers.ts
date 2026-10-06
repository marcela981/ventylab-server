/*
 * Funcionalidad: Registro de cambios de niveles
 * Descripción: Escucha los eventos de dominio de niveles y prerrequisitos y escribe las entradas del historial de cambios mediante RecordChangeUseCase, sin bloquear la operación si el registro falla
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
  REORDER_CHANGE_LOG_ACTION,
  UPDATE_CHANGE_LOG_ACTION,
} from "@/features/changelog/domain/value-objects/change-log-action";
import { LEVEL_CHANGE_LOG_ENTITY_TYPE } from "@/features/changelog/domain/value-objects/change-log-entity-type";
import {
  LevelCreatedEvent,
  LevelDeactivatedEvent,
  LevelPrerequisiteAddedEvent,
  LevelPrerequisiteRemovedEvent,
  LevelsReorderedEvent,
  LevelUpdatedEvent,
} from "@/features/levels/domain/events/level.events";

const LEVEL_TRACKED_FIELDS: readonly string[] = ["title", "description", "order", "isActive"];
const LEVEL_BULK_REORDER_ENTITY_ID: string = "bulk-reorder";

@Injectable()
export class LevelsChangeLogHandlers {
  private readonly _logger: Logger = new Logger(LevelsChangeLogHandlers.name);

  public constructor(private readonly _recordChangeUseCase: RecordChangeUseCase) {}

  @OnEvent(LevelCreatedEvent.name)
  public async handleLevelCreated(event: LevelCreatedEvent): Promise<void> {
    await this._record(event.entity.id, CREATE_CHANGE_LOG_ACTION, event.performedBy);
  }

  @OnEvent(LevelUpdatedEvent.name)
  public async handleLevelUpdated(event: LevelUpdatedEvent): Promise<void> {
    await this._record(event.entity.id, UPDATE_CHANGE_LOG_ACTION, event.performedBy, pickTrackedChanges(event.changes, LEVEL_TRACKED_FIELDS));
  }

  @OnEvent(LevelDeactivatedEvent.name)
  public async handleLevelDeactivated(event: LevelDeactivatedEvent): Promise<void> {
    await this._record(event.entity.id, DELETE_CHANGE_LOG_ACTION, event.performedBy, DEACTIVATION_CHANGE_LOG_DIFF);
  }

  @OnEvent(LevelsReorderedEvent.name)
  public async handleLevelsReordered(event: LevelsReorderedEvent): Promise<void> {
    await this._record(LEVEL_BULK_REORDER_ENTITY_ID, REORDER_CHANGE_LOG_ACTION, event.performedBy, {
      order: { before: event.previousOrder, after: event.newOrder },
    });
  }

  @OnEvent(LevelPrerequisiteAddedEvent.name)
  public async handlePrerequisiteAdded(event: LevelPrerequisiteAddedEvent): Promise<void> {
    await this._record(event.entity.id, UPDATE_CHANGE_LOG_ACTION, event.performedBy, {
      prerequisites: { before: null, after: { added: event.prerequisiteLevelId, title: event.prerequisiteTitle } },
    });
  }

  @OnEvent(LevelPrerequisiteRemovedEvent.name)
  public async handlePrerequisiteRemoved(event: LevelPrerequisiteRemovedEvent): Promise<void> {
    await this._record(event.entity.id, UPDATE_CHANGE_LOG_ACTION, event.performedBy, {
      prerequisites: { before: { removed: event.prerequisiteLevelId, title: event.prerequisiteTitle }, after: null },
    });
  }

  private async _record(entityId: string, action: ChangeLogActionValue, performedBy?: string, diff?: ChangeLogDiff): Promise<void> {
    if (!performedBy) {
      return;
    }

    try {
      await this._recordChangeUseCase.execute(
        new RecordChangeCommand({ entityType: LEVEL_CHANGE_LOG_ENTITY_TYPE, entityId, action, changedBy: performedBy, diff }),
      );
    } catch (error: unknown) {
      this._logger.error(`Failed to record level change for ${entityId}`, error instanceof Error ? error.stack : String(error));
    }
  }
}
