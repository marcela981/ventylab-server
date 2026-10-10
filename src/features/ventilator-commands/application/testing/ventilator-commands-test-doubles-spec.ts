/*
 * Funcionalidad: Dobles de prueba de los comandos del ventilador
 * Descripción: Publicador en tiempo real, fachada de reservas, conexión MQTT, fachada de telemetría, repositorio en memoria y registrador de auditoría falsos, y un arnés que arma los servicios y casos de uso reales de la feature con ajustes leídos como en NODE_ENV=test (tópicos con prefijo de pruebas), para que ninguna prueba publique en el tópico real
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ConfigService } from "@nestjs/config";

import { type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { type IRealtimePublisher } from "@/common/application/ports/realtime-publisher.interface";
import { Paginated } from "@/common/domain/utils/paginated";
import { Environment, type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { type ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { CommandLifecycleService } from "@/features/ventilator-commands/application/services/command-lifecycle.service";
import { CommandRateLimiterService } from "@/features/ventilator-commands/application/services/command-rate-limiter.service";
import { OperatorControlService } from "@/features/ventilator-commands/application/services/operator-control.service";
import { type VentilatorCommandsSettings } from "@/features/ventilator-commands/application/tokens/ventilator-commands-settings.token";
import { SendVentilatorCommandUseCase } from "@/features/ventilator-commands/application/use-cases/send-ventilator-command.usecase";
import {
  GetVentilatorControlUseCase,
  ReleaseVentilatorControlUseCase,
  TakeVentilatorControlUseCase,
  VentilatorControlHeartbeatUseCase,
} from "@/features/ventilator-commands/application/use-cases/ventilator-control.usecases";
import { createCommandEncoder } from "@/features/ventilator-commands/domain/encoders/create-command-encoder";
import { type VentilatorCommand } from "@/features/ventilator-commands/domain/entities/ventilator-command.entity";
import { type GetVentilatorCommandsQuery, type IVentilatorCommandsRepository } from "@/features/ventilator-commands/domain/repositories/ventilator-commands.repository";
import { readVentilatorCommandsSettings } from "@/features/ventilator-commands/infrastructure/config/ventilator-commands-config";
import { VentilatorCommandsEventsHandlers } from "@/features/ventilator-commands/infrastructure/events/ventilator-commands-events.handlers";
import {
  type IMqttConnection,
  type MqttConnectionStateListener,
  type MqttMessageListener,
  type MqttPublishOptions,
  type MqttQos,
} from "@/features/ventilator-telemetry/application/ports/mqtt-connection.interface";
import { type VentilatorTelemetryFacade } from "@/features/ventilator-telemetry/application/services/ventilator-telemetry.facade";
import { type TelemetryFrame } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-frame";

export const TEST_TOPIC_PREFIX: string = "test/ventylab";
export const REAL_COMMAND_TOPIC: string = "ventilab/device/001/command";
export const REAL_ACK_TOPIC: string = "ventilab/device/001/command-ack";

export interface RecordedRoomEmit {
  readonly room: string;
  readonly event: string;
  readonly payload: unknown;
}

export class FakeRealtimePublisher implements IRealtimePublisher {
  public readonly roomEmits: RecordedRoomEmit[] = [];

  public emitToUser(): void {
    return;
  }

  public emitToGroup(): void {
    return;
  }

  public emitToRole(): void {
    return;
  }

  public emitToRoom(room: string, event: string, payload: unknown): void {
    this.roomEmits.push({ room, event, payload });
  }

  public emitToRoomsVolatile(): void {
    return;
  }

  public broadcast(): void {
    return;
  }

  public joinRoom(): void {
    return;
  }

  public leaveRoom(): void {
    return;
  }

  public clearRoom(): void {
    return;
  }

  public isUserConnected(): boolean {
    return false;
  }

  public getConnectedUserIds(): string[] {
    return [];
  }

  public payloadsOf<T>(event: string, room: string = "ventilator"): T[] {
    return this.roomEmits.filter((emit: RecordedRoomEmit): boolean => emit.event === event && emit.room === room).map((emit: RecordedRoomEmit): T => emit.payload as T);
  }
}

export class FakeReservationsFacade {
  public active: ActiveReservationSummary | undefined;
  public readonly holders: Map<string, Set<string>> = new Map<string, Set<string>>();
  public readonly leaders: Map<string, Set<string>> = new Map<string, Set<string>>();
  public readonly reservations: Map<string, ActiveReservationSummary> = new Map<string, ActiveReservationSummary>();

  public activate(reservation: ActiveReservationSummary, holderIds: string[], leaderIds: string[] = []): void {
    this.active = reservation;
    this.reservations.set(reservation.id, reservation);
    this.holders.set(reservation.id, new Set<string>(holderIds));
    this.leaders.set(reservation.id, new Set<string>(leaderIds));
  }

  public async getActiveReservation(): Promise<ActiveReservationSummary | undefined> {
    return await Promise.resolve(this.active);
  }

  public async getReservationById(id: string): Promise<ActiveReservationSummary | undefined> {
    return await Promise.resolve(this.reservations.get(id));
  }

  public async isHolder(userId: string, reservation: ActiveReservationSummary): Promise<boolean> {
    return await Promise.resolve(this.holders.get(reservation.id)?.has(userId) ?? false);
  }

  public async isGroupLeaderOfHolder(userId: string, reservation: ActiveReservationSummary): Promise<boolean> {
    return await Promise.resolve(this.leaders.get(reservation.id)?.has(userId) ?? false);
  }

  public asFacade(): ReservationsFacade {
    return this as unknown as ReservationsFacade;
  }
}

export interface RecordedPublish {
  readonly topic: string;
  readonly payload: string | Buffer;
  readonly options: MqttPublishOptions;
}

export class FakeMqttConnection implements IMqttConnection {
  public readonly isEnabled: boolean = true;
  public readonly brokerUrl: string | undefined = "mqtt://fake-broker";
  public isConnected: boolean = true;
  public failPublish: boolean = false;
  public readonly publishes: RecordedPublish[] = [];
  public readonly subscriptions: { topic: string; qos: MqttQos }[] = [];
  private readonly _messageListeners: Set<MqttMessageListener> = new Set<MqttMessageListener>();

  public async publish(topic: string, payload: string | Buffer, options: MqttPublishOptions): Promise<void> {
    if (this.failPublish || !this.isConnected) {
      const error: Error = new Error("MQTT broker is not connected");

      error.name = "MqttNotConnectedError";

      throw error;
    }

    this.publishes.push({ topic, payload, options });

    await Promise.resolve();
  }

  public subscribe(topic: string, qos: MqttQos): void {
    this.subscriptions.push({ topic, qos });
  }

  public onMessage(listener: MqttMessageListener): () => void {
    this._messageListeners.add(listener);

    return (): void => {
      this._messageListeners.delete(listener);
    };
  }

  public onConnectionChange(_listener: MqttConnectionStateListener): () => void {
    return (): void => undefined;
  }

  public deliver(topic: string, payload: string): void {
    for (const listener of this._messageListeners) {
      listener(topic, Buffer.from(payload, "utf8"));
    }
  }
}

export class FakeTelemetryFacade {
  public deviceOnline: boolean = true;
  public readonly connection: FakeMqttConnection = new FakeMqttConnection();
  private readonly _frameListeners: Set<(frame: TelemetryFrame) => void> = new Set<(frame: TelemetryFrame) => void>();

  public get mqttConnection(): IMqttConnection {
    return this.connection;
  }

  public isDeviceOnline(): boolean {
    return this.deviceOnline && this.connection.isConnected;
  }

  public onFrame(listener: (frame: TelemetryFrame) => void): () => void {
    this._frameListeners.add(listener);

    return (): void => {
      this._frameListeners.delete(listener);
    };
  }

  public emitFrame(frame: TelemetryFrame): void {
    for (const listener of this._frameListeners) {
      listener(frame);
    }
  }

  public asFacade(): VentilatorTelemetryFacade {
    return this as unknown as VentilatorTelemetryFacade;
  }
}

export class InMemoryVentilatorCommandsRepository implements IVentilatorCommandsRepository {
  public readonly writes: VentilatorCommand[] = [];
  public readonly rows: Map<string, VentilatorCommand> = new Map<string, VentilatorCommand>();
  public failWrites: boolean = false;

  public async save(command: VentilatorCommand): Promise<void> {
    await Promise.resolve();

    if (this.failWrites) {
      throw new Error("database unavailable");
    }

    this.writes.push(command);
    this.rows.set(command.id, command);
  }

  public async getByReservation(query: GetVentilatorCommandsQuery): Promise<Paginated<VentilatorCommand>> {
    const items: VentilatorCommand[] = [...this.rows.values()].filter((command: VentilatorCommand): boolean => command.reservationId === query.reservationId);

    return await Promise.resolve(new Paginated<VentilatorCommand>({ items: items.slice((query.page - 1) * query.limit, query.page * query.limit), total: items.length, page: query.page, limit: query.limit }));
  }
}

export interface RecordedAudit {
  readonly actorId: string | undefined;
  readonly action: string;
  readonly targetId: string;
  readonly before: Record<string, unknown>;
  readonly after: Record<string, unknown>;
}

export class FakeAuditRecorder implements IAuditRecorder {
  public readonly records: RecordedAudit[] = [];

  public async record(actorId: string | undefined, action: string, _targetType: string, targetId: string, before: Record<string, unknown>, after: Record<string, unknown>): Promise<void> {
    this.records.push({ actorId, action, targetId, before, after });

    await Promise.resolve();
  }
}

export type TestEnvironmentOverrides = Partial<Record<keyof EnvironmentVariables, unknown>>;

const TEST_ENVIRONMENT: Partial<Record<keyof EnvironmentVariables, unknown>> = {
  NODE_ENV: Environment.Test,
  MQTT_TEST_TOPIC_PREFIX: TEST_TOPIC_PREFIX,
  MQTT_COMMAND_TOPIC: REAL_COMMAND_TOPIC,
  MQTT_COMMAND_ACK_TOPIC: "",
  VENTILATOR_COMMAND_ENCODING: "json",
  VENTILATOR_COMMAND_TIMEOUT_MS: 3000,
  VENTILATOR_COMMAND_RATE_PER_SECOND: 5,
  VENTILATOR_OPERATOR_GRACE_SECONDS: 15,
  VENTILATOR_CONTROL_REFRESH_MS: 1000,
  VENTILATOR_APPLY_TOLERANCE_RATIO: 0.05,
  VENTILATOR_SAFETY_MAX_PEEP: 15,
  VENTILATOR_SAFETY_MAX_PRESSURE_LIMIT: 40,
  VENTILATOR_SAFETY_MAX_TIDAL_VOLUME: 700,
  VENTILATOR_SAFETY_MAX_RESPIRATORY_RATE: 35,
  VENTILATOR_SAFETY_MAX_IE_RATIO: 1,
};

export function fakeConfigService(overrides: TestEnvironmentOverrides = {}): ConfigService<EnvironmentVariables, true> {
  const values: Partial<Record<keyof EnvironmentVariables, unknown>> = { ...TEST_ENVIRONMENT, ...overrides };

  return { get: (key: keyof EnvironmentVariables): unknown => values[key] } as unknown as ConfigService<EnvironmentVariables, true>;
}

export function testCommandsSettings(overrides: TestEnvironmentOverrides = {}): VentilatorCommandsSettings {
  return readVentilatorCommandsSettings(fakeConfigService(overrides));
}

export const RESERVATION: ActiveReservationSummary = {
  id: "res-1",
  holderType: "GROUP",
  groupId: "group-1",
  createdById: "leader-1",
  startsAt: new Date("2026-10-10T12:00:00Z"),
  endsAt: new Date("2026-10-10T13:00:00Z"),
};

export const OTHER_RESERVATION: ActiveReservationSummary = {
  id: "res-2",
  holderType: "USER",
  userId: "teacher-1",
  createdById: "teacher-1",
  startsAt: new Date("2026-10-10T12:00:00Z"),
  endsAt: new Date("2026-10-10T12:30:00Z"),
};

export const VALID_COMMAND: Record<string, unknown> = { mode: "VCV", tidalVolume: 450, respiratoryRate: 14, peep: 5, fio2: 0.4 };

export interface VentilatorCommandsHarness {
  readonly settings: VentilatorCommandsSettings;
  readonly realtime: FakeRealtimePublisher;
  readonly reservations: FakeReservationsFacade;
  readonly telemetry: FakeTelemetryFacade;
  readonly mqtt: FakeMqttConnection;
  readonly repository: InMemoryVentilatorCommandsRepository;
  readonly audit: FakeAuditRecorder;
  readonly control: OperatorControlService;
  readonly rateLimiter: CommandRateLimiterService;
  readonly lifecycle: CommandLifecycleService;
  readonly send: SendVentilatorCommandUseCase;
  readonly getControl: GetVentilatorControlUseCase;
  readonly takeControl: TakeVentilatorControlUseCase;
  readonly releaseControl: ReleaseVentilatorControlUseCase;
  readonly heartbeat: VentilatorControlHeartbeatUseCase;
  readonly handlers: VentilatorCommandsEventsHandlers;
}

export function createVentilatorCommandsHarness(overrides: TestEnvironmentOverrides = {}): VentilatorCommandsHarness {
  const settings: VentilatorCommandsSettings = testCommandsSettings(overrides);
  const realtime: FakeRealtimePublisher = new FakeRealtimePublisher();
  const reservations: FakeReservationsFacade = new FakeReservationsFacade();
  const telemetry: FakeTelemetryFacade = new FakeTelemetryFacade();
  const repository: InMemoryVentilatorCommandsRepository = new InMemoryVentilatorCommandsRepository();
  const audit: FakeAuditRecorder = new FakeAuditRecorder();
  const control: OperatorControlService = new OperatorControlService(reservations.asFacade(), realtime, settings);
  const rateLimiter: CommandRateLimiterService = new CommandRateLimiterService(settings);
  const lifecycle: CommandLifecycleService = new CommandLifecycleService(settings, repository, realtime, telemetry.asFacade());

  lifecycle.start();

  return {
    settings,
    realtime,
    reservations,
    telemetry,
    mqtt: telemetry.connection,
    repository,
    audit,
    control,
    rateLimiter,
    lifecycle,
    send: new SendVentilatorCommandUseCase(settings, createCommandEncoder(settings.encoding), reservations.asFacade(), telemetry.asFacade(), control, rateLimiter, lifecycle),
    getControl: new GetVentilatorControlUseCase(reservations.asFacade(), control),
    takeControl: new TakeVentilatorControlUseCase(reservations.asFacade(), control, audit),
    releaseControl: new ReleaseVentilatorControlUseCase(control),
    heartbeat: new VentilatorControlHeartbeatUseCase(control),
    handlers: new VentilatorCommandsEventsHandlers(control),
  };
}
