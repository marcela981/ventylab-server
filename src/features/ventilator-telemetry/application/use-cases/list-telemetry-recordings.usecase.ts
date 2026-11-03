/*
 * Funcionalidad: Caso de uso ListTelemetryRecordingsUseCase
 * Descripción: Lista las grabaciones del ventilador físico de un usuario (reservas que tiene como titular o de un grupo del que es miembro, con al menos un fragmento grabado) cuyo inicio cae en el rango [from, to), por defecto los últimos 90 días y como máximo 366; el propio usuario siempre puede, el administrador lee a cualquiera y un docente solo a los estudiantes de los grupos que creó o supervisa (GroupsFacade.assertCanViewStudent); un estudiante no lee a otros
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { isAdminActor, isTeacherActor } from "@/features/groups/domain/services/group-management-policy";
import { type ListTelemetryRecordingsCommand } from "@/features/ventilator-telemetry/application/commands/telemetry-recording.command";
import {
  type ITelemetryChunksRepository,
  TELEMETRY_CHUNKS_REPOSITORY_TOKEN,
  type TelemetryRecordingSummary,
} from "@/features/ventilator-telemetry/domain/repositories/telemetry-chunks.repository";
import { TelemetryRecordingForbiddenError, TelemetryRecordingRangeInvalidError } from "@/features/ventilator-telemetry/domain/ventilator-telemetry.errors";

const MS_PER_DAY: number = 24 * 60 * 60 * 1000;

const DEFAULT_RANGE_DAYS: number = 90;

const MAX_RANGE_DAYS: number = 366;

export const MAX_LISTED_RECORDINGS: number = 100;

/**
 * @throws {TelemetryRecordingRangeInvalidError} If the range does not start before it ends or spans more than 366 days
 * @throws {TelemetryRecordingForbiddenError} If a student asks for another user
 * @throws {StudentOutOfScopeError} If a teacher asks for a student outside the groups they created or supervise
 */
@Injectable()
export class ListTelemetryRecordingsUseCase {
  public constructor(
    @Inject(TELEMETRY_CHUNKS_REPOSITORY_TOKEN)
    private readonly _chunksRepository: ITelemetryChunksRepository,
    private readonly _groupsFacade: GroupsFacade,
  ) {}

  public async execute(command: ListTelemetryRecordingsCommand): Promise<TelemetryRecordingSummary[]> {
    const to: Date = command.to ?? command.now;
    const from: Date = command.from ?? new Date(to.getTime() - DEFAULT_RANGE_DAYS * MS_PER_DAY);

    if (from.getTime() >= to.getTime() || to.getTime() - from.getTime() > MAX_RANGE_DAYS * MS_PER_DAY) {
      throw new TelemetryRecordingRangeInvalidError();
    }

    const userId: string = command.userId ?? command.actor.id;

    if (userId !== command.actor.id) {
      if (!isAdminActor(command.actor) && !isTeacherActor(command.actor)) {
        throw new TelemetryRecordingForbiddenError();
      }

      await this._groupsFacade.assertCanViewStudent(command.actor, userId);
    }

    return await this._chunksRepository.listRecordingsOfUser({ userId, from, to, limit: MAX_LISTED_RECORDINGS });
  }
}
