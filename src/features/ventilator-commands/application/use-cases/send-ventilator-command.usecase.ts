/*
 * Funcionalidad: Caso de uso SendVentilatorCommandUseCase
 * Descripción: Único camino hacia el ventilador físico. En orden: reserva activa (403), titular o docente/administrador (403), operador actual (423), cubo de fichas por usuario (429), validación de dominio (422), dispositivo en línea y MQTT conectado (503, sin publicar); después codifica con la estrategia configurada, publica con QoS 1 por la conexión única de VentilatorTelemetryFacade y entrega el comando al seguimiento de su ciclo de vida; responde con el estado real del comando y la hora de envío solo si quedó registrada
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { generateId } from "@/common/domain/utils/generate-id";
import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { type SendVentilatorCommandCommand } from "@/features/ventilator-commands/application/commands/ventilator-commands.commands";
import { SentVentilatorCommandResult } from "@/features/ventilator-commands/application/results/ventilator-commands.results";
import { CommandLifecycleService } from "@/features/ventilator-commands/application/services/command-lifecycle.service";
import { CommandRateLimiterService } from "@/features/ventilator-commands/application/services/command-rate-limiter.service";
import { OperatorControlService } from "@/features/ventilator-commands/application/services/operator-control.service";
import {
  VENTILATOR_COMMAND_ENCODER_TOKEN,
  VENTILATOR_COMMANDS_SETTINGS_TOKEN,
  type VentilatorCommandsSettings,
} from "@/features/ventilator-commands/application/tokens/ventilator-commands-settings.token";
import { type CommandEncoder, type EncodedCommand } from "@/features/ventilator-commands/domain/encoders/command-encoder";
import { VentilatorCommand } from "@/features/ventilator-commands/domain/entities/ventilator-command.entity";
import { isPrivilegedVentilatorRole } from "@/features/ventilator-commands/domain/services/operator-control-policy";
import { validateVentilatorCommand, type VentilatorCommandValidation } from "@/features/ventilator-commands/domain/validation/ventilator-command-validator";
import {
  InvalidVentilatorCommandError,
  NoActiveVentilatorReservationError,
  NotReservationHolderError,
  NotVentilatorOperatorError,
  VentilatorCommandRateLimitedError,
  VentilatorDeviceOfflineError,
} from "@/features/ventilator-commands/domain/ventilator-commands.errors";
import { type IMqttConnection, type MqttQos } from "@/features/ventilator-telemetry/application/ports/mqtt-connection.interface";
import { VentilatorTelemetryFacade } from "@/features/ventilator-telemetry/application/services/ventilator-telemetry.facade";

const COMMAND_QOS: MqttQos = 1;

/**
 * @throws {NoActiveVentilatorReservationError} If no reservation is active now
 * @throws {NotReservationHolderError} If the caller is neither a holder of the active reservation nor a teacher or administrator
 * @throws {NotVentilatorOperatorError} If the caller does not hold the exclusive control of the ventilator
 * @throws {VentilatorCommandRateLimitedError} If the caller exceeded VENTILATOR_COMMAND_RATE_PER_SECOND
 * @throws {InvalidVentilatorCommandError} If the command is malformed, out of range, incoherent or beyond the safety limits
 * @throws {VentilatorDeviceOfflineError} If the device is not reporting telemetry, the broker is not connected or the publish failed
 */
@Injectable()
export class SendVentilatorCommandUseCase {
  public constructor(
    @Inject(VENTILATOR_COMMANDS_SETTINGS_TOKEN)
    private readonly _settings: VentilatorCommandsSettings,
    @Inject(VENTILATOR_COMMAND_ENCODER_TOKEN)
    private readonly _encoder: CommandEncoder,
    private readonly _reservationsFacade: ReservationsFacade,
    private readonly _telemetryFacade: VentilatorTelemetryFacade,
    private readonly _operatorControl: OperatorControlService,
    private readonly _rateLimiter: CommandRateLimiterService,
    private readonly _lifecycle: CommandLifecycleService,
  ) {}

  public async execute(command: SendVentilatorCommandCommand): Promise<SentVentilatorCommandResult> {
    const readStartedAt: Date = new Date();
    const active: ActiveReservationSummary | undefined = await this._reservationsFacade.getActiveReservation(readStartedAt);

    this._operatorControl.syncActiveReservation(active, readStartedAt);

    if (!active) {
      throw new NoActiveVentilatorReservationError();
    }

    if (!isPrivilegedVentilatorRole(command.role) && !(await this._reservationsFacade.isHolder(command.userId, active))) {
      throw new NotReservationHolderError();
    }

    if (!this._operatorControl.isOperator(command.userId, active.id)) {
      throw new NotVentilatorOperatorError();
    }

    const retryAfterMs: number = this._rateLimiter.tryConsume(command.userId);

    if (retryAfterMs > 0) {
      throw new VentilatorCommandRateLimitedError(new Date(Date.now() + retryAfterMs));
    }

    const validation: VentilatorCommandValidation = validateVentilatorCommand(command.params, this._settings.safety);

    if (!validation.valid) {
      throw new InvalidVentilatorCommandError(validation.violations);
    }

    const connection: IMqttConnection = this._telemetryFacade.mqttConnection;

    if (!this._telemetryFacade.isDeviceOnline() || !connection.isConnected) {
      throw new VentilatorDeviceOfflineError();
    }

    const correlationId: string = generateId();
    const encoded: EncodedCommand = this._encoder.encode(validation.command, correlationId);

    const record: VentilatorCommand = VentilatorCommand.create({
      correlationId,
      reservationId: active.id,
      userId: command.userId,
      params: validation.command,
      encoding: this._encoder.encoding,
      encodedPayload: encoded.printable,
      now: new Date(),
    });

    this._lifecycle.track(record);

    try {
      await connection.publish(this._settings.commandTopic, encoded.payload, { qos: COMMAND_QOS });
    } catch (error: unknown) {
      this._lifecycle.recordPublishFailure(record, error instanceof Error ? error.name : "publish_failed");

      throw new VentilatorDeviceOfflineError();
    }

    this._lifecycle.recordSent(record);

    return new SentVentilatorCommandResult({ commandId: record.id, reservationId: record.reservationId, status: record.status, sentAt: record.sentAt });
  }
}
