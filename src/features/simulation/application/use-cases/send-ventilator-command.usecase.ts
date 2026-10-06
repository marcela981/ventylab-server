/*
 * Funcionalidad: Caso de uso SendVentilatorCommandUseCase
 * Descripción: Enruta los ajustes del ventilador: ajusta la simulación sintética en curso, la arranca si el paciente está configurado, o valida rangos, verifica el líder de la reserva y publica el comando al ventilador físico por IVentilatorDeviceGateway
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { SendVentilatorCommandCommand } from "@/features/simulation/application/commands/send-ventilator-command.command";
import { type IVentilatorDeviceGateway, VENTILATOR_DEVICE_GATEWAY_TOKEN } from "@/features/simulation/application/ports/ventilator-device-gateway.interface";
import {
  PHYSICAL_TARGET,
  SendVentilatorCommandResult,
  SYNTHETIC_START_TARGET,
  SYNTHETIC_UPDATE_TARGET,
} from "@/features/simulation/application/results/send-ventilator-command.result";
import { PatientSimulationSessionsService } from "@/features/simulation/application/services/patient-simulation-sessions.service";
import { type CachedReservation, ReservationCacheService } from "@/features/simulation/application/services/reservation-cache.service";
import { getCommandValidationErrors } from "@/features/simulation/domain/services/hex-command-encoder";
import {
  InvalidVentilatorCommandError,
  NotReservationLeaderError,
  VentilatorNotConnectedError,
} from "@/features/simulation/domain/simulation.errors";

/**
 * @throws {InvalidVentilatorCommandError} If a physical command parameter is outside the safe ranges
 * @throws {NotReservationLeaderError} If the ventilator is reserved and the user is not the reservation leader
 * @throws {VentilatorNotConnectedError} If the MQTT connection to the ventilator is not established
 */
@Injectable()
export class SendVentilatorCommandUseCase {
  public constructor(
    @Inject(VENTILATOR_DEVICE_GATEWAY_TOKEN)
    private readonly _deviceGateway: IVentilatorDeviceGateway,
    private readonly _patientSessions: PatientSimulationSessionsService,
    private readonly _reservationCache: ReservationCacheService,
  ) {}

  public async execute(command: SendVentilatorCommandCommand): Promise<SendVentilatorCommandResult> {
    const now: number = Date.now();

    if (this._patientSessions.isSimulating(command.userId)) {
      this._patientSessions.updateCommand(command.userId, command.command);

      return new SendVentilatorCommandResult({ commandId: `sim-cmd-${now}`, target: SYNTHETIC_UPDATE_TARGET, timestamp: now });
    }

    if (this._patientSessions.getActivePatient(command.userId)) {
      this._patientSessions.start(command.userId, command.command);

      return new SendVentilatorCommandResult({ commandId: `sim-start-${now}`, target: SYNTHETIC_START_TARGET, timestamp: now });
    }

    const errors: string[] = getCommandValidationErrors(command.command);

    if (errors.length > 0) {
      throw new InvalidVentilatorCommandError(errors);
    }

    const reservation: CachedReservation | undefined = this._reservationCache.current;

    if (reservation && command.userId !== (reservation.leaderId ?? reservation.userId)) {
      throw new NotReservationLeaderError();
    }

    if (!this._deviceGateway.isConnected()) {
      throw new VentilatorNotConnectedError();
    }

    await this._deviceGateway.publishCommand(command.command);

    const sentAt: number = Date.now();

    return new SendVentilatorCommandResult({ commandId: `cmd-${sentAt}`, target: PHYSICAL_TARGET, timestamp: sentAt });
  }
}
