/*
 * Funcionalidad: Autorización de grabaciones de telemetría
 * Descripción: Comprueba que quien inicia o detiene una grabación sea docente, administrador o titular de la reserva activa (fachada de reservas); la lectura de una grabación la permite al administrador, a los titulares, a quien creó la reserva y a un docente solo cuando gestiona al titular (estudiante de un grupo que creó o supervisa, o ese grupo), con GroupsFacade
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { type GroupActor, isAdminActor, isTeacherActor } from "@/features/groups/domain/services/group-management-policy";
import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { isPrivilegedTelemetryRole } from "@/features/ventilator-telemetry/application/realtime/ventilator-telemetry-events";
import {
  type ITelemetryChunksRepository,
  type RecordedReservationHolder,
  TELEMETRY_CHUNKS_REPOSITORY_TOKEN,
} from "@/features/ventilator-telemetry/domain/repositories/telemetry-chunks.repository";
import {
  TelemetryNoActiveReservationError,
  TelemetryRecordingForbiddenError,
  TelemetryReservationNotFoundError,
} from "@/features/ventilator-telemetry/domain/ventilator-telemetry.errors";

@Injectable()
export class TelemetryRecordingAccessService {
  public constructor(
    private readonly _reservationsFacade: ReservationsFacade,
    @Inject(TELEMETRY_CHUNKS_REPOSITORY_TOKEN)
    private readonly _chunksRepository: ITelemetryChunksRepository,
    private readonly _groupsFacade: GroupsFacade,
  ) {}

  public async authorizeActiveReservation(userId: string, role: string): Promise<ActiveReservationSummary> {
    const active: ActiveReservationSummary | undefined = await this._reservationsFacade.getActiveReservation(new Date());

    if (!active) {
      throw new TelemetryNoActiveReservationError();
    }

    if (!isPrivilegedTelemetryRole(role) && !(await this._reservationsFacade.isHolder(userId, active))) {
      throw new TelemetryRecordingForbiddenError();
    }

    return active;
  }

  public async authorizeReservation(reservationId: string, userId: string, role: string): Promise<void> {
    const holder: RecordedReservationHolder | undefined = await this._chunksRepository.getReservationHolder(reservationId);

    if (!holder) {
      throw new TelemetryReservationNotFoundError();
    }

    if (!(await this._canRead({ id: userId, role }, holder))) {
      throw new TelemetryRecordingForbiddenError();
    }
  }

  private async _canRead(actor: GroupActor, holder: RecordedReservationHolder): Promise<boolean> {
    if (isAdminActor(actor) || holder.createdById === actor.id || (await this._reservationsFacade.isHolder(actor.id, holder))) {
      return true;
    }

    if (!isTeacherActor(actor)) {
      return false;
    }

    if (holder.userId !== undefined) {
      return await this._groupsFacade.canViewStudent(actor, holder.userId);
    }

    return holder.groupId !== undefined && (await this._groupsFacade.getManageableStudentGroupIds(actor, [holder.groupId])).length > 0;
  }
}
