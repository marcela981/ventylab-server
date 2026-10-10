/*
 * Funcionalidad: Caso de uso SendVentilatorCommandUseCase
 * Descripción: Enruta los ajustes del ventilador: ajusta la simulación sintética en curso, la arranca si el paciente está configurado, o valida rangos, verifica el líder de la reserva y publica el comando al ventilador físico con QoS 1 por la conexión MQTT única de VentilatorTelemetryFacade
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { SendVentilatorCommandCommand } from "@/features/simulation/application/commands/send-ventilator-command.command";
import {
  PHYSICAL_TARGET,
  SendVentilatorCommandResult,
  SYNTHETIC_START_TARGET,
  SYNTHETIC_UPDATE_TARGET,
} from "@/features/simulation/application/results/send-ventilator-command.result";
import { PatientSimulationSessionsService } from "@/features/simulation/application/services/patient-simulation-sessions.service";
import { type CachedReservation, ReservationCacheService } from "@/features/simulation/application/services/reservation-cache.service";
import { SIMULATION_SETTINGS_TOKEN, type SimulationSettings } from "@/features/simulation/application/tokens/simulation-settings.token";
import { getCommandValidationErrors } from "@/features/simulation/domain/services/hex-command-encoder";
import {
  InvalidVentilatorCommandError,
  NotReservationLeaderError,
  VentilatorNotConnectedError,
} from "@/features/simulation/domain/simulation.errors";
import { type IMqttConnection, type MqttQos } from "@/features/ventilator-telemetry/application/ports/mqtt-connection.interface";
import { VentilatorTelemetryFacade } from "@/features/ventilator-telemetry/application/services/ventilator-telemetry.facade";

const COMMAND_QOS: MqttQos = 1;

/**
 * @throws {InvalidVentilatorCommandError} If a physical command parameter is outside the safe ranges
 * @throws {NotReservationLeaderError} If the ventilator is reserved and the user is not the reservation leader
 * @throws {VentilatorNotConnectedError} If the MQTT connection to the ventilator is not established
 */
@Injectable()
export class SendVentilatorCommandUseCase {
  public constructor(
    @Inject(SIMULATION_SETTINGS_TOKEN)
    private readonly _settings: SimulationSettings,
    private readonly _telemetryFacade: VentilatorTelemetryFacade,
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

    const connection: IMqttConnection = this._telemetryFacade.mqttConnection;

    if (!connection.isConnected) {
      throw new VentilatorNotConnectedError();
    }

    await connection.publish(this._settings.commandTopic, JSON.stringify(command.command), { qos: COMMAND_QOS });

    const sentAt: number = Date.now();

    return new SendVentilatorCommandResult({ commandId: `cmd-${sentAt}`, target: PHYSICAL_TARGET, timestamp: sentAt });
  }
}
