/*
 * Funcionalidad: Dobles de prueba de la telemetría del ventilador
 * Descripción: Publicador en tiempo real falso que registra las emisiones, reloj controlable, repositorio de fragmentos en memoria, códec JSON sin compresión, cliente MQTT falso y ajustes de telemetría por defecto para las pruebas unitarias (ninguno usa red)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IRealtimePublisher } from "@/common/application/ports/realtime-publisher.interface";
import { type MqttQos } from "@/features/ventilator-telemetry/application/ports/mqtt-connection.interface";
import { type ITelemetryChunkCodec } from "@/features/ventilator-telemetry/application/ports/telemetry-chunk-codec.interface";
import { type ITelemetryClock } from "@/features/ventilator-telemetry/application/ports/telemetry-clock.interface";
import { type VentilatorTelemetrySettings } from "@/features/ventilator-telemetry/application/tokens/ventilator-telemetry-settings.token";
import { type ITelemetryChunksRepository, type RecordedReservationHolder } from "@/features/ventilator-telemetry/domain/repositories/telemetry-chunks.repository";
import { type RecordedTelemetrySample, type TelemetryChunk } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-chunk";
import { type MqttClientLike } from "@/features/ventilator-telemetry/infrastructure/mqtt/mqtt-client";

export interface RecordedEmit {
  readonly method: string;
  readonly target: string | readonly string[] | undefined;
  readonly event: string;
  readonly payload: unknown;
}

export class FakeRealtimePublisher implements IRealtimePublisher {
  public readonly emits: RecordedEmit[] = [];
  public readonly joins: { userId: string; room: string }[] = [];
  public readonly clearedRooms: string[] = [];

  public emitToUser(userId: string, event: string, payload: unknown): void {
    this.emits.push({ method: "emitToUser", target: userId, event, payload });
  }

  public emitToGroup(groupId: string, event: string, payload: unknown): void {
    this.emits.push({ method: "emitToGroup", target: groupId, event, payload });
  }

  public emitToRole(role: string, event: string, payload: unknown): void {
    this.emits.push({ method: "emitToRole", target: role, event, payload });
  }

  public emitToRoom(room: string, event: string, payload: unknown): void {
    this.emits.push({ method: "emitToRoom", target: room, event, payload });
  }

  public emitToRoomsVolatile(rooms: readonly string[], event: string, payload: unknown): void {
    this.emits.push({ method: "emitToRoomsVolatile", target: rooms, event, payload });
  }

  public broadcast(event: string, payload: unknown): void {
    this.emits.push({ method: "broadcast", target: undefined, event, payload });
  }

  public joinRoom(userId: string, room: string): void {
    this.joins.push({ userId, room });
  }

  public leaveRoom(_userId: string, _room: string): void {
    return;
  }

  public clearRoom(room: string): void {
    this.clearedRooms.push(room);
  }

  public isUserConnected(_userId: string): boolean {
    return false;
  }

  public getConnectedUserIds(): string[] {
    return [];
  }

  public emitsOf(event: string): RecordedEmit[] {
    return this.emits.filter((emit: RecordedEmit): boolean => emit.event === event);
  }
}

export class FakeTelemetryClock implements ITelemetryClock {
  public constructor(public nowMs: number = 1_760_000_000_000, public monotonicMs: number = 0) {}

  public now(): number {
    return this.nowMs;
  }

  public monotonic(): number {
    return this.monotonicMs;
  }

  public advance(ms: number): void {
    this.nowMs += ms;
    this.monotonicMs += ms;
  }
}

export class InMemoryTelemetryChunksRepository implements ITelemetryChunksRepository {
  public readonly chunks: TelemetryChunk[] = [];
  public readonly holders: Map<string, RecordedReservationHolder> = new Map<string, RecordedReservationHolder>();
  public pendingSave: Promise<void> | undefined;

  public async save(chunk: TelemetryChunk): Promise<void> {
    if (this.pendingSave) {
      await this.pendingSave;
    }

    this.chunks.push(chunk);
  }

  public async listByReservation(reservationId: string): Promise<TelemetryChunk[]> {
    return await Promise.resolve(this.chunks.filter((chunk: TelemetryChunk): boolean => chunk.reservationId === reservationId));
  }

  public async getReservationHolder(reservationId: string): Promise<RecordedReservationHolder | undefined> {
    return await Promise.resolve(this.holders.get(reservationId));
  }
}

export class JsonTelemetryChunkCodec implements ITelemetryChunkCodec {
  public readonly encoding: string = "json";

  public async encode(samples: readonly RecordedTelemetrySample[]): Promise<Buffer> {
    return await Promise.resolve(Buffer.from(JSON.stringify(samples), "utf-8"));
  }

  public async decode(data: Buffer): Promise<RecordedTelemetrySample[]> {
    return await Promise.resolve(JSON.parse(data.toString("utf-8")) as RecordedTelemetrySample[]);
  }
}

export class FakeMqttClient implements MqttClientLike {
  public connected: boolean = false;
  public ended: boolean = false;
  public reconnectCalls: number = 0;
  public readonly subscriptions: { topic: string; qos: MqttQos }[] = [];
  public readonly published: { topic: string; payload: string | Buffer; qos: MqttQos }[] = [];
  private _onConnect: (() => void) | undefined;
  private _onClose: (() => void) | undefined;
  private _onMessage: ((topic: string, payload: Buffer) => void) | undefined;

  public onConnect(listener: () => void): void {
    this._onConnect = listener;
  }

  public onClose(listener: () => void): void {
    this._onClose = listener;
  }

  public onError(_listener: (error: Error) => void): void {
    return;
  }

  public onMessage(listener: (topic: string, payload: Buffer) => void): void {
    this._onMessage = listener;
  }

  public async subscribe(topic: string, qos: MqttQos): Promise<void> {
    this.subscriptions.push({ topic, qos });

    return await Promise.resolve();
  }

  public async publish(topic: string, payload: string | Buffer, qos: MqttQos): Promise<void> {
    this.published.push({ topic, payload, qos });

    return await Promise.resolve();
  }

  public reconnect(): void {
    this.reconnectCalls++;
  }

  public end(): void {
    this.ended = true;
    this.connected = false;
  }

  public simulateConnect(): void {
    this.connected = true;
    this._onConnect?.();
  }

  public simulateClose(): void {
    this.connected = false;
    this._onClose?.();
  }

  public simulateMessage(topic: string, payload: Buffer): void {
    this._onMessage?.(topic, payload);
  }
}

export function buildTelemetrySettings(overrides: Partial<VentilatorTelemetrySettings> = {}): VentilatorTelemetrySettings {
  return {
    mqtt: {
      brokerUrl: "mqtt://broker.test:1883",
      clientId: "ventylab-test",
      reconnectBaseMs: 1000,
      reconnectMaxMs: 30000,
    },
    telemetryTopic: "/ventynet/data",
    alarmTopic: "ventilab/device/001/alarm",
    decoder: "auto",
    deviceId: "ventilab-device-001",
    flushIntervalMs: 33,
    maxBufferedFrames: 256,
    staleAfterMs: 2000,
    roomRefreshMs: 1000,
    metricsWindow: 10000,
    invalidLogIntervalMs: 5000,
    recordingHz: 20,
    recordingFlushSeconds: 5,
    ...overrides,
  };
}

export function jsonFrame(value: Record<string, unknown>): Buffer {
  return Buffer.from(JSON.stringify(value), "utf-8");
}
