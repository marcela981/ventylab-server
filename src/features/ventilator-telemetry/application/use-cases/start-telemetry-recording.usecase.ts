/*
 * Funcionalidad: Caso de uso StartTelemetryRecording
 * Descripción: Inicia la grabación submuestreada de la telemetría de la reserva activa para sus titulares, docentes o administradores
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { type TelemetryRecordingCommand } from "@/features/ventilator-telemetry/application/commands/telemetry-recording.command";
import { TelemetryRecorderService, type TelemetryRecordingStatus } from "@/features/ventilator-telemetry/application/services/telemetry-recorder.service";
import { TelemetryRecordingAccessService } from "@/features/ventilator-telemetry/application/services/telemetry-recording-access.service";

/**
 * @throws {TelemetryNoActiveReservationError} If there is no active ventilator reservation
 * @throws {TelemetryRecordingForbiddenError} If the user is not a holder of the active reservation, a teacher or an administrator
 */
@Injectable()
export class StartTelemetryRecordingUseCase {
  public constructor(
    private readonly _access: TelemetryRecordingAccessService,
    private readonly _recorder: TelemetryRecorderService,
  ) {}

  public async execute(command: TelemetryRecordingCommand): Promise<TelemetryRecordingStatus> {
    const active: ActiveReservationSummary = await this._access.authorizeActiveReservation(command.userId, command.role);

    return this._recorder.start(active.id);
  }
}
