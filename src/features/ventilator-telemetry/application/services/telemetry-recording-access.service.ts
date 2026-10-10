/*
 * Funcionalidad: Autorización de grabaciones de telemetría
 * Descripción: Comprueba que quien inicia, detiene o lee una grabación sea docente, administrador o titular de la reserva correspondiente, usando la fachada de reservas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

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

    if (!isPrivilegedTelemetryRole(role) && !(await this._reservationsFacade.isHolder(userId, holder))) {
      throw new TelemetryRecordingForbiddenError();
    }
  }
}
