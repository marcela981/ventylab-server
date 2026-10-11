/*
 * Funcionalidad: Ciclo de vida de los comandos enviados
 * Descripción: Sigue cada comando hasta un estado terminal: lo registra antes de publicarlo con un temporizador de confirmación de VENTILATOR_COMMAND_TIMEOUT_MS (si el broker nunca confirma ni rechaza la publicación termina en TIMEOUT publish_unconfirmed; un acuse o una trama que llegue antes de la confirmación se guarda y se aplica justo después de SENT; un fallo de publicación lo descarta como REJECTED), lo reemplaza por un temporizador de VENTILATOR_COMMAND_TIMEOUT_MS al quedar SENT (TIMEOUT), al apagar resuelve como TIMEOUT los SENT y como TIMEOUT server_shutdown_unconfirmed los que tenían la publicación en curso (resultado desconocido), resuelve ACKED o REJECTED con los acuses del tópico MQTT_COMMAND_ACK_TOPIC cuando está configurado, o APPLIED cuando una trama de telemetría informa los mismos parámetros dentro de la tolerancia; emite ventilator:command-status en cada transición (solo al remitente, docentes y administradores si la sala ventilator ya pertenece a otra reserva), espera la persistencia pendiente con un límite de tiempo al apagar y persiste cada estado sin bloquear la publicación mediante una cadena de promesas ordenada por comando
 * Versión: 1.2
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
  type VentilatorCommandStatusPayload,
  ventilatorCommandsAudience,
} from "@/features/ventilator-commands/application/realtime/ventilator-commands-events";
import { VENTILATOR_COMMANDS_SETTINGS_TOKEN, type VentilatorCommandsSettings } from "@/features/ventilator-commands/application/tokens/ventilator-commands-settings.token";
import { type VentilatorCommand } from "@/features/ventilator-commands/domain/entities/ventilator-command.entity";
import { type IVentilatorCommandsRepository, VENTILATOR_COMMANDS_REPOSITORY_TOKEN } from "@/features/ventilator-commands/domain/repositories/ventilator-commands.repository";
import { settingsMatchCommand } from "@/features/ventilator-commands/domain/services/applied-settings-match";
import { type CommandAck, parseCommandAck } from "@/features/ventilator-commands/domain/services/command-ack";
import { PENDING_COMMAND_STATUS, SENT_COMMAND_STATUS } from "@/features/ventilator-commands/domain/value-objects/ventilator-command-status";
import { type MqttQos } from "@/features/ventilator-telemetry/application/ports/mqtt-connection.interface";
import { VentilatorTelemetryFacade } from "@/features/ventilator-telemetry/application/services/ventilator-telemetry.facade";
import { type TelemetryFrame } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-frame";

const ACK_QOS: MqttQos = 1;
const DEFAULT_DEVICE_REJECT_REASON: string = "rejected_by_device";
const PUBLISH_UNCONFIRMED_REASON: string = "publish_unconfirmed";
const SHUTDOWN_UNCONFIRMED_REASON: string = "server_shutdown_unconfirmed";

type CommandTransition = (command: VentilatorCommand) => void;

interface InFlightCommand {
  readonly command: VentilatorCommand;
  timer: ReturnType<typeof setTimeout> | undefined;
  earlyResolution: CommandTransition | undefined;
}

function markTimedOut(command: VentilatorCommand): void {
  command.markTimedOut(new Date());
}

function markPublishUnconfirmed(reason: string): CommandTransition {
  return (command: VentilatorCommand): void => command.markPublishUnconfirmed(reason, new Date());
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

    for (const [id, inFlight] of [...this._inFlight]) {
      this._resolve(id, inFlight.command.status === SENT_COMMAND_STATUS ? markTimedOut : markPublishUnconfirmed(SHUTDOWN_UNCONFIRMED_REASON));
    }
  }

  public track(command: VentilatorCommand): void {
    const inFlight: InFlightCommand = { command, timer: undefined, earlyResolution: undefined };

    this._inFlight.set(command.id, inFlight);
    inFlight.timer = this._armTimer(command.id, markPublishUnconfirmed(PUBLISH_UNCONFIRMED_REASON));
  }

  public recordPublishFailure(command: VentilatorCommand, reason: string): void {
    clearTimeout(this._inFlight.get(command.id)?.timer);
    this._inFlight.delete(command.id);

    if (command.status !== PENDING_COMMAND_STATUS) {
      return;
    }

    command.markPublishFailed(reason, new Date());
    this._announce(command);
  }

  public recordSent(command: VentilatorCommand): void {
    if (command.status !== PENDING_COMMAND_STATUS) {
      return;
    }

    const inFlight: InFlightCommand = this._inFlight.get(command.id) ?? { command, timer: undefined, earlyResolution: undefined };

    clearTimeout(inFlight.timer);
    inFlight.timer = undefined;
    command.markSent(new Date());
    this._inFlight.set(command.id, inFlight);
    this._announce(command);

    if (inFlight.earlyResolution !== undefined) {
      this._resolve(command.id, inFlight.earlyResolution);

      return;
    }

    inFlight.timer = this._armTimer(command.id, markTimedOut);
  }

  public handleAck(payload: Buffer | string): void {
    const ack: CommandAck | undefined = parseCommandAck(payload);

    if (!ack || !this._inFlight.has(ack.commandId)) {
      return;
    }

    if (ack.status === "rejected") {
      this._resolveOrBuffer(ack.commandId, (command: VentilatorCommand): void => command.markRejected(ack.reason ?? DEFAULT_DEVICE_REJECT_REASON, new Date()));

      return;
    }

    this._resolveOrBuffer(ack.commandId, (command: VentilatorCommand): void => command.markAcked(new Date()));
  }

  public handleFrame(frame: TelemetryFrame): void {
    const settings: Readonly<Record<string, number>> | undefined = frame.settings;

    if (this._inFlight.size === 0 || settings === undefined) {
      return;
    }

    for (const [id, inFlight] of [...this._inFlight]) {
      if (settingsMatchCommand(inFlight.command.params, settings, frame.mode, this._settings.applyToleranceRatio)) {
        this._resolveOrBuffer(id, (command: VentilatorCommand): void => command.markApplied(new Date()));
      }
    }
  }

  public async flushPersistence(timeoutMs?: number): Promise<boolean> {
    const pending: Promise<boolean> = Promise.all([...this._persistChains.values()]).then((): boolean => true);

    if (timeoutMs === undefined) {
      return await pending;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout: Promise<boolean> = new Promise<boolean>((resolve: (flushed: boolean) => void): void => {
      timer = setTimeout((): void => resolve(false), timeoutMs);
    });

    const flushed: boolean = await Promise.race([pending, timeout]);

    clearTimeout(timer);

    if (!flushed) {
      this._logger.warn(`Ventilator command persistence did not finish within ${timeoutMs} ms on shutdown`);
    }

    return flushed;
  }

  private _armTimer(id: string, transition: CommandTransition): ReturnType<typeof setTimeout> {
    const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
      this._resolve(id, transition);
    }, this._settings.timeoutMs);

    timer.unref();

    return timer;
  }

  // A device acknowledgement or a matching frame may arrive before the broker confirms the publish
  private _resolveOrBuffer(id: string, transition: CommandTransition): void {
    const inFlight: InFlightCommand | undefined = this._inFlight.get(id);

    if (!inFlight) {
      return;
    }

    if (inFlight.command.status === PENDING_COMMAND_STATUS) {
      inFlight.earlyResolution = inFlight.earlyResolution ?? transition;

      return;
    }

    this._resolve(id, transition);
  }

  private _resolve(id: string, transition: CommandTransition): void {
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
    const audience: readonly string[] = ventilatorCommandsAudience(command.reservationId, this._telemetryFacade.ventilatorRoomReservationId, command.userId);
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

    for (const room of audience) {
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
