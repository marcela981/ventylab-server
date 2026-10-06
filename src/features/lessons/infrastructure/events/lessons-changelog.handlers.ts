/*
 * Funcionalidad: Registro de cambios de lecciones
 * Descripción: Escucha los eventos de dominio de lecciones y escribe las entradas del historial de cambios mediante RecordChangeUseCase, sin bloquear la operación si el registro falla
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
import { LESSON_CHANGE_LOG_ENTITY_TYPE } from "@/features/changelog/domain/value-objects/change-log-entity-type";
import { LessonCreatedEvent, LessonDeactivatedEvent, LessonUpdatedEvent } from "@/features/lessons/domain/events/lesson.events";

const LESSON_TRACKED_FIELDS: readonly string[] = ["title", "content", "order", "estimatedTime", "isActive"];

@Injectable()
export class LessonsChangeLogHandlers {
  private readonly _logger: Logger = new Logger(LessonsChangeLogHandlers.name);

  public constructor(private readonly _recordChangeUseCase: RecordChangeUseCase) {}

  @OnEvent(LessonCreatedEvent.name)
  public async handleLessonCreated(event: LessonCreatedEvent): Promise<void> {
    await this._record(event.entity.id, CREATE_CHANGE_LOG_ACTION, event.performedBy);
  }

  @OnEvent(LessonUpdatedEvent.name)
  public async handleLessonUpdated(event: LessonUpdatedEvent): Promise<void> {
    await this._record(event.entity.id, UPDATE_CHANGE_LOG_ACTION, event.performedBy, pickTrackedChanges(event.changes, LESSON_TRACKED_FIELDS));
  }

  @OnEvent(LessonDeactivatedEvent.name)
  public async handleLessonDeactivated(event: LessonDeactivatedEvent): Promise<void> {
    await this._record(event.entity.id, DELETE_CHANGE_LOG_ACTION, event.performedBy, DEACTIVATION_CHANGE_LOG_DIFF);
  }

  private async _record(entityId: string, action: ChangeLogActionValue, performedBy?: string, diff?: ChangeLogDiff): Promise<void> {
    if (!performedBy) {
      return;
    }

    try {
      await this._recordChangeUseCase.execute(
        new RecordChangeCommand({ entityType: LESSON_CHANGE_LOG_ENTITY_TYPE, entityId, action, changedBy: performedBy, diff }),
      );
    } catch (error: unknown) {
      this._logger.error(`Failed to record lesson change for ${entityId}`, error instanceof Error ? error.stack : String(error));
    }
  }
}
