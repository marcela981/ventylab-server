/*
 * Funcionalidad: Caso de uso SendVentilatorCommandUseCase
 * Descripción: Enruta los ajustes del ventilador: ajusta la simulación sintética en curso, la arranca si el paciente está configurado, o delega el comando al ventilador físico en VentilatorCommandsFacade, que valida, autoriza por reserva activa y operador, limita la frecuencia, publica con QoS 1 y sigue su ciclo de vida
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { SendVentilatorCommandCommand } from "@/features/simulation/application/commands/send-ventilator-command.command";
import {
  PHYSICAL_TARGET,
  SendVentilatorCommandResult,
  SYNTHETIC_START_TARGET,
  SYNTHETIC_UPDATE_TARGET,
} from "@/features/simulation/application/results/send-ventilator-command.result";
import { PatientSimulationSessionsService } from "@/features/simulation/application/services/patient-simulation-sessions.service";
import { type SentVentilatorCommandResult } from "@/features/ventilator-commands/application/results/ventilator-commands.results";
import { VentilatorCommandsFacade } from "@/features/ventilator-commands/application/services/ventilator-commands.facade";

/**
 * @throws {NoActiveVentilatorReservationError} If a physical command is sent while no reservation is active
 * @throws {NotReservationHolderError} If the user is neither a holder of the active reservation nor a teacher or administrator
 * @throws {NotVentilatorOperatorError} If the user does not hold the exclusive control of the ventilator
 * @throws {VentilatorCommandRateLimitedError} If the user exceeded the command rate
 * @throws {InvalidVentilatorCommandError} If a physical command is malformed, out of range, incoherent or beyond the safety limits
 * @throws {VentilatorDeviceOfflineError} If the ventilator is offline
 */
@Injectable()
export class SendVentilatorCommandUseCase {
  public constructor(
    private readonly _commandsFacade: VentilatorCommandsFacade,
    private readonly _patientSessions: PatientSimulationSessionsService,
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

    const sent: SentVentilatorCommandResult = await this._commandsFacade.send({ userId: command.userId, role: command.userRole, params: command.command });

    return new SendVentilatorCommandResult({ commandId: sent.commandId, target: PHYSICAL_TARGET, timestamp: (sent.sentAt ?? new Date()).getTime() });
  }
}
