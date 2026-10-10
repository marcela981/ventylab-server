/*
 * Funcionalidad: Ciclo de vida de los comandos enviados
 * Descripción: Sigue cada comando publicado hasta un estado terminal: arma siempre un temporizador de VENTILATOR_COMMAND_TIMEOUT_MS (TIMEOUT), resuelve ACKED o REJECTED con los acuses del tópico MQTT_COMMAND_ACK_TOPIC cuando está configurado, o APPLIED cuando una trama de telemetría informa los mismos parámetros dentro de la tolerancia; emite ventilator:command-status en cada transición y persiste cada estado sin bloquear la publicación mediante una cadena de promesas ordenada por comando
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { type IRealtimePublisher, REALTIME_PUBLISHER_TOKEN } from "@/common/application/ports/realtime-publisher.interface";
import {
  VENTILATOR_COMMAND_STATUS_EVENT,
  VENTILATOR_COMMANDS_AUDIENCE,
  type VentilatorCommandStatusPayload,
} from "@/features/ventilator-commands/application/realtime/ventilator-commands-events";
import { VENTILATOR_COMMANDS_SETTINGS_TOKEN, type VentilatorCommandsSettings } from "@/features/ventilator-commands/application/tokens/ventilator-commands-settings.token";
import { type VentilatorCommand } from "@/features/ventilator-commands/domain/entities/ventilator-command.entity";
import { type IVentilatorCommandsRepository, VENTILATOR_COMMANDS_REPOSITORY_TOKEN } from "@/features/ventilator-commands/domain/repositories/ventilator-commands.repository";
import { settingsMatchCommand } from "@/features/ventilator-commands/domain/services/applied-settings-match";
import { type CommandAck, parseCommandAck } from "@/features/ventilator-commands/domain/services/command-ack";
import { type MqttQos } from "@/features/ventilator-telemetry/application/ports/mqtt-connection.interface";
import { VentilatorTelemetryFacade } from "@/features/ventilator-telemetry/application/services/ventilator-telemetry.facade";
import { type TelemetryFrame } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-frame";

const ACK_QOS: MqttQos = 1;
const DEFAULT_DEVICE_REJECT_REASON: string = "rejected_by_device";

interface InFlightCommand {
  readonly command: VentilatorCommand;
  readonly timer: ReturnType<typeof setTimeout>;
}

@Injectable()
export class CommandLifecycleService {
  private readonly _logger: Logger = new Logger(CommandLifecycleService.name);
  private readonly _inFlight: Map<string, InFlightCommand> = new Map<string, InFlightCommand>();
  private readonly _persistChains: Map<string, Promise<void>> = new Map<string, Promise<void>>();
  private _unsubscribers: (() => void)[] = [];

  public constructor(
    @Inject(VENTILATOR_COMMANDS_SETTINGS_TOKEN)
    private readonly _settings: VentilatorCommandsSettings,
    @Inject(VENTILATOR_COMMANDS_REPOSITORY_TOKEN)
    private readonly _repository: IVentilatorCommandsRepository,
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtimePublisher: IRealtimePublisher,
    private readonly _telemetryFacade: VentilatorTelemetryFacade,
  ) {}

  public get inFlightCount(): number {
    return this._inFlight.size;
  }

  public start(): void {
    if (this._unsubscribers.length > 0) {
      return;
    }

    const ackTopic: string | undefined = this._settings.ackTopic;

    if (ackTopic !== undefined) {
      this._telemetryFacade.mqttConnection.subscribe(ackTopic, ACK_QOS);
      this._unsubscribers.push(
        this._telemetryFacade.mqttConnection.onMessage((topic: string, payload: Buffer): void => {
          if (topic === ackTopic) {
            this.handleAck(payload);
          }
        }),
      );

      return;
    }

    this._unsubscribers.push(this._telemetryFacade.onFrame((frame: TelemetryFrame): void => this.handleFrame(frame)));
  }

  public stop(): void {
    for (const unsubscribe of this._unsubscribers) {
      unsubscribe();
    }

    this._unsubscribers = [];

    for (const id of [...this._inFlight.keys()]) {
      this._resolve(id, (command: VentilatorCommand): void => command.markTimedOut(new Date()));
    }
  }

  public recordPublishFailure(command: VentilatorCommand, reason: string): void {
    command.markPublishFailed(reason, new Date());
    this._announce(command);
  }

  public recordSent(command: VentilatorCommand): void {
    command.markSent(new Date());

    const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
      this._resolve(command.id, (pending: VentilatorCommand): void => pending.markTimedOut(new Date()));
    }, this._settings.timeoutMs);

    timer.unref();
    this._inFlight.set(command.id, { command, timer });
    this._announce(command);
  }

  public handleAck(payload: Buffer | string): void {
    const ack: CommandAck | undefined = parseCommandAck(payload);

    if (!ack || !this._inFlight.has(ack.commandId)) {
      return;
    }

    if (ack.status === "rejected") {
      this._resolve(ack.commandId, (command: VentilatorCommand): void => command.markRejected(ack.reason ?? DEFAULT_DEVICE_REJECT_REASON, new Date()));

      return;
    }

    this._resolve(ack.commandId, (command: VentilatorCommand): void => command.markAcked(new Date()));
  }

  public handleFrame(frame: TelemetryFrame): void {
    const settings: Readonly<Record<string, number>> | undefined = frame.settings;

    if (this._inFlight.size === 0 || settings === undefined) {
      return;
    }

    for (const [id, inFlight] of [...this._inFlight]) {
      if (settingsMatchCommand(inFlight.command.params, settings, frame.mode, this._settings.applyToleranceRatio)) {
        this._resolve(id, (command: VentilatorCommand): void => command.markApplied(new Date()));
      }
    }
  }

  public async flushPersistence(): Promise<void> {
    await Promise.all([...this._persistChains.values()]);
  }

  private _resolve(id: string, transition: (command: VentilatorCommand) => void): void {
    const inFlight: InFlightCommand | undefined = this._inFlight.get(id);

    if (!inFlight) {
      return;
    }

    clearTimeout(inFlight.timer);
    this._inFlight.delete(id);

    try {
      transition(inFlight.command);
    } catch (error: unknown) {
      this._logger.error(`Ventilator command ${id} could not change state: ${error instanceof Error ? error.message : String(error)}`);

      return;
    }

    this._announce(inFlight.command);
  }

  private _announce(command: VentilatorCommand): void {
    this._emit(command);
    this._persist(command);
  }

  private _emit(command: VentilatorCommand): void {
    const payload: VentilatorCommandStatusPayload = {
      commandId: command.id,
      reservationId: command.reservationId,
      userId: command.userId,
      status: command.status,
      sentAt: command.sentAt?.toISOString(),
      resolvedAt: command.resolvedAt?.toISOString(),
      latencyMs: command.latencyMs,
      reason: command.rejectReason,
    };

    for (const room of VENTILATOR_COMMANDS_AUDIENCE) {
      this._realtimePublisher.emitToRoom(room, VENTILATOR_COMMAND_STATUS_EVENT, payload);
    }
  }

  private _persist(command: VentilatorCommand): void {
    const snapshot: VentilatorCommand = command.snapshot();
    const previous: Promise<void> = this._persistChains.get(command.id) ?? Promise.resolve();

    const next: Promise<void> = previous
      .then(async (): Promise<void> => {
        await this._repository.save(snapshot);
      })
      .catch((error: unknown): void => {
        this._logger.error(`Ventilator command ${command.id} (${snapshot.status}) could not be persisted: ${error instanceof Error ? error.message : String(error)}`);
      });

    this._persistChains.set(command.id, next);

    void next.finally((): void => {
      if (this._persistChains.get(command.id) === next) {
        this._persistChains.delete(command.id);
      }
    });
  }
}
