/*
 * Funcionalidad: Propiedades UPPAAL del camino de telemetría
 * Descripción: Contrasta la implementación con las consultas del modelo ventilab-uppaal.xml (S3, S5, S7, S8, R1, R2, R3) mediante pruebas ejecutables sobre el pipeline real y el servicio de acceso a la sala con dobles en memoria, reloj falso o reloj del sistema; las consultas de tiempos de extremo a extremo y del frontend (S2, S4, S6) no se pueden probar en pruebas unitarias del backend. No sustituye a verifyta: es evidencia de prueba, no una verificación de modelos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Logger } from "@nestjs/common";

import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { type ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { type ITelemetryClock } from "@/features/ventilator-telemetry/application/ports/telemetry-clock.interface";
import { DeviceStalenessService } from "@/features/ventilator-telemetry/application/services/device-staleness.service";
import { TelemetryMetricsService, type TelemetryMetricsSnapshot } from "@/features/ventilator-telemetry/application/services/telemetry-metrics.service";
import { TelemetryPipelineService } from "@/features/ventilator-telemetry/application/services/telemetry-pipeline.service";
import { TelemetryRecorderService } from "@/features/ventilator-telemetry/application/services/telemetry-recorder.service";
import { VentilatorRoomAccessService, type VentilatorJoinOutcome } from "@/features/ventilator-telemetry/application/services/ventilator-room-access.service";
import {
  buildTelemetrySettings,
  FakeRealtimePublisher,
  FakeTelemetryClock,
  InMemoryTelemetryChunksRepository,
  JsonTelemetryChunkCodec,
  jsonFrame,
  type RecordedEmit,
} from "@/features/ventilator-telemetry/application/testing/ventilator-telemetry-test-doubles-spec";
import { type VentilatorTelemetrySettings } from "@/features/ventilator-telemetry/application/tokens/ventilator-telemetry-settings.token";
import { createTelemetryDecoder } from "@/features/ventilator-telemetry/domain/decoders/create-telemetry-decoder";
import { type TelemetryFrame } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-frame";
import { SystemTelemetryClock } from "@/features/ventilator-telemetry/infrastructure/clock/system-telemetry.clock";

const SEED: number = 20261010;
const MODEL_T_PROCESS_MS: number = 10;
const MODEL_T_WS_MS: number = 5;
const MODEL_T_SAMPLE_MS: number = 33;
const MODEL_MAX_QUEUE: number = 100;
const MODEL_REACHABLE_TELEMETRY_COUNT: number = 5;
const REAL_CLOCK_FRAMES: number = 2000;
const RANDOM_STEPS: number = 2000;
const TELEMETRY_AUDIENCE: readonly string[] = ["ventilator", "role:TEACHER", "role:ADMIN"];

type Random = () => number;

function mulberry32(seed: number): Random {
  let state: number = seed >>> 0;

  return (): number => {
    state = (state + 0x6d2b79f5) >>> 0;

    let t: number = state;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexFrame(type: number, data: number[]): Buffer {
  const bytes: number[] = [0xFF, type, data.length, ...data];
  const checksum: number = bytes.reduce((acc: number, byte: number): number => acc ^ byte, 0);

  return Buffer.from([...bytes, checksum]);
}

interface PipelineFixture {
  readonly settings: VentilatorTelemetrySettings;
  readonly pipeline: TelemetryPipelineService;
  readonly publisher: FakeRealtimePublisher;
  readonly metrics: TelemetryMetricsService;
}

function buildPipeline(clock: ITelemetryClock, overrides: Partial<VentilatorTelemetrySettings> = {}): PipelineFixture {
  const settings: VentilatorTelemetrySettings = buildTelemetrySettings(overrides);
  const publisher: FakeRealtimePublisher = new FakeRealtimePublisher();
  const metrics: TelemetryMetricsService = new TelemetryMetricsService(settings, clock);
  const pipeline: TelemetryPipelineService = new TelemetryPipelineService(
    settings,
    createTelemetryDecoder(settings.decoder, settings.deviceId),
    publisher,
    metrics,
    new DeviceStalenessService(settings, publisher, clock),
    new TelemetryRecorderService(settings, new InMemoryTelemetryChunksRepository(), new JsonTelemetryChunkCodec(), clock),
    clock,
  );

  return { settings, pipeline, publisher, metrics };
}

function framesOf(emit: RecordedEmit): TelemetryFrame[] {
  return (emit.payload as { frames: TelemetryFrame[] }).frames;
}

class FakeReservationsFacade {
  public active: ActiveReservationSummary | undefined;
  public holders: string[] = [];

  public async getActiveReservation(_now: Date): Promise<ActiveReservationSummary | undefined> {
    return await Promise.resolve(this.active);
  }

  public async listHolderUserIds(_reservation: ActiveReservationSummary): Promise<string[]> {
    return await Promise.resolve(this.holders);
  }
}

describe("UPPAAL telemetry model (ventilab-uppaal.xml) as executable properties", () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, "warn").mockImplementation((): void => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe("S3 A[] mqttClient.PARSING imply mqttClient.t_process <= 10", () => {
    it("keeps the processing p95 and p99 below 10 ms for 2000 json and hex frames through the real pipeline and system clock", () => {
      const clock: SystemTelemetryClock = new SystemTelemetryClock();
      const { settings, pipeline, metrics }: PipelineFixture = buildPipeline(clock, { decoder: "auto", metricsWindow: REAL_CLOCK_FRAMES });

      for (let index: number = 0; index < REAL_CLOCK_FRAMES; index++) {
        const payload: Buffer = index % 2 === 0
          ? jsonFrame({ seq: index / 2, pressure: 5 + (index % 30), flow: Math.sin(index / 10) * 60, volume: 400 + (index % 50) })
          : hexFrame(0xA1 + (index % 3), [0x00, index % 200]);

        pipeline.handleMessage(settings.telemetryTopic, payload);

        if (index % 2 === 1) {
          pipeline.flush();
        }
      }

      const snapshot: TelemetryMetricsSnapshot = metrics.snapshot(clock.now());

      expect(snapshot.invalidMessages).toBe(0);
      expect(snapshot.processingMs.count).toBe(REAL_CLOCK_FRAMES);
      expect(snapshot.processingMs.p95 ?? Number.POSITIVE_INFINITY).toBeLessThan(MODEL_T_PROCESS_MS);
      expect(snapshot.processingMs.p99 ?? Number.POSITIVE_INFINITY).toBeLessThan(MODEL_T_PROCESS_MS);
    });

    it("measures processing from MQTT receive to enqueue and records no sample for a discarded message", () => {
      const clock: FakeTelemetryClock = new FakeTelemetryClock();
      const { settings, pipeline, metrics }: PipelineFixture = buildPipeline(clock);

      pipeline.handleMessage(settings.telemetryTopic, jsonFrame({ pressure: 1, flow: 2, volume: 3 }));
      pipeline.handleMessage(settings.telemetryTopic, Buffer.from("{broken", "utf-8"));
      const snapshot: TelemetryMetricsSnapshot = metrics.snapshot(clock.nowMs);

      expect(snapshot.processingMs.count).toBe(1);
      expect(snapshot.processingMs.max).toBe(0);
      expect(snapshot.invalidMessages).toBe(1);
    });
  });

  describe("S5 A[] webSocketGateway.BROADCASTING imply webSocketGateway.t_ws <= 5", () => {
    it("keeps every batch emit below 5 ms with the real clock (server side only; network delivery is not measured)", () => {
      const clock: SystemTelemetryClock = new SystemTelemetryClock();
      const { settings, pipeline, metrics }: PipelineFixture = buildPipeline(clock, { decoder: "json" });

      for (let index: number = 0; index < 500; index++) {
        pipeline.handleMessage(settings.telemetryTopic, jsonFrame({ pressure: 10, flow: 20, volume: 300 }));
        pipeline.handleMessage(settings.telemetryTopic, jsonFrame({ pressure: 11, flow: 21, volume: 301 }));
        pipeline.flush();
      }

      const snapshot: TelemetryMetricsSnapshot = metrics.snapshot(clock.now());

      expect(snapshot.flushMs.count).toBe(500);
      expect(snapshot.flushMs.p99 ?? Number.POSITIVE_INFINITY).toBeLessThan(MODEL_T_WS_MS);
    });
  });

  describe("S7 A[] localServer.IDLE imply localServer.t_sample <= 33 (server cadence counterpart)", () => {
    it("emits one batch every VENTILATOR_FLUSH_INTERVAL_MS and no frame waits longer than one interval in the buffer", () => {
      jest.useFakeTimers();
      const clock: FakeTelemetryClock = new FakeTelemetryClock();
      const { settings, pipeline, publisher, metrics }: PipelineFixture = buildPipeline(clock, { flushIntervalMs: MODEL_T_SAMPLE_MS });
      const random: Random = mulberry32(SEED);
      const batchTimes: number[] = [];

      pipeline.start();

      for (let tick: number = 0; tick < 3300; tick++) {
        if (random() < 0.06) {
          pipeline.handleMessage(settings.telemetryTopic, jsonFrame({ pressure: 1, flow: 1, volume: 1 }));
        }

        const before: number = publisher.emitsOf("ventilator:telemetry").length;

        clock.advance(1);
        jest.advanceTimersByTime(1);

        if (publisher.emitsOf("ventilator:telemetry").length > before) {
          batchTimes.push(clock.monotonicMs);
        }
      }

      pipeline.stop();
      const snapshot: TelemetryMetricsSnapshot = metrics.snapshot(clock.nowMs);
      const gaps: number[] = batchTimes.slice(1).map((time: number, index: number): number => time - batchTimes[index]);

      expect(batchTimes.length).toBeGreaterThan(10);
      expect(gaps.every((gap: number): boolean => gap % MODEL_T_SAMPLE_MS === 0)).toBe(true);
      expect(snapshot.totalMs.max ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(MODEL_T_SAMPLE_MS);
    });
  });

  describe("S8 A[] data_queue <= MAX_QUEUE", () => {
    it("never emits more than VENTILATOR_MAX_BUFFERED_FRAMES frames in a batch and accounts every dropped frame across 2000 seeded random steps", () => {
      const clock: FakeTelemetryClock = new FakeTelemetryClock();
      const { settings, pipeline, publisher, metrics }: PipelineFixture = buildPipeline(clock, { maxBufferedFrames: MODEL_MAX_QUEUE });
      const random: Random = mulberry32(SEED);
      let accepted: number = 0;

      for (let step: number = 0; step < RANDOM_STEPS; step++) {
        const burst: number = Math.floor(random() * 60);

        for (let index: number = 0; index < burst; index++) {
          pipeline.handleMessage(settings.telemetryTopic, jsonFrame({ pressure: 1, flow: 1, volume: 1 }));
          accepted++;
        }

        if (random() < 0.3) {
          pipeline.flush();
        }
      }

      pipeline.flush();
      const batches: RecordedEmit[] = publisher.emitsOf("ventilator:telemetry");
      const emitted: number = batches.reduce((sum: number, batch: RecordedEmit): number => sum + framesOf(batch).length, 0);

      expect(Math.max(...batches.map((batch: RecordedEmit): number => framesOf(batch).length))).toBeLessThanOrEqual(MODEL_MAX_QUEUE);
      expect(metrics.bufferDrops).toBeGreaterThan(0);
      expect(emitted + metrics.bufferDrops).toBe(accepted);
    });
  });

  describe("R1 E<> frontendGUI.RENDERING and R3 E<> telemetry_count >= 5 (backend side: frames reach the ventilator room)", () => {
    it("joins the holder of the active reservation and delivers at least five frames to the ventilator room", async () => {
      const clock: FakeTelemetryClock = new FakeTelemetryClock();
      const { settings, pipeline, publisher, metrics }: PipelineFixture = buildPipeline(clock);
      const facade: FakeReservationsFacade = new FakeReservationsFacade();
      const roomAccess: VentilatorRoomAccessService = new VentilatorRoomAccessService(facade as unknown as ReservationsFacade, publisher, settings);

      facade.active = {
        id: "reservation-1",
        holderType: "USER",
        userId: "student-1",
        createdById: "student-1",
        startsAt: new Date(clock.nowMs - 60_000),
        endsAt: new Date(clock.nowMs + 60_000),
      };
      facade.holders = ["student-1"];
      await roomAccess.refresh();

      for (let seq: number = 1; seq <= MODEL_REACHABLE_TELEMETRY_COUNT; seq++) {
        pipeline.handleMessage(settings.telemetryTopic, jsonFrame({ seq, pressure: seq, flow: seq, volume: seq }));
      }

      pipeline.flush();
      const batch: RecordedEmit[] = publisher.emitsOf("ventilator:telemetry");

      expect(publisher.joins).toContainEqual({ userId: "student-1", room: "ventilator" });
      expect(batch).toHaveLength(1);
      expect(batch[0].target).toEqual(TELEMETRY_AUDIENCE);
      expect(framesOf(batch[0])).toHaveLength(MODEL_REACHABLE_TELEMETRY_COUNT);
      expect(metrics.snapshot(clock.nowMs).totalMessages).toBeGreaterThanOrEqual(MODEL_REACHABLE_TELEMETRY_COUNT);
    });
  });

  describe("R2 E<> apiGateway.REJECTED", () => {
    it("rejects a socket that is not a holder of the active reservation and never joins it to the room", async () => {
      const clock: FakeTelemetryClock = new FakeTelemetryClock();
      const { settings, publisher }: PipelineFixture = buildPipeline(clock);
      const facade: FakeReservationsFacade = new FakeReservationsFacade();
      const roomAccess: VentilatorRoomAccessService = new VentilatorRoomAccessService(facade as unknown as ReservationsFacade, publisher, settings);

      await roomAccess.refresh();
      const outcome: VentilatorJoinOutcome = roomAccess.handleJoinRequest({ userId: "student-2", role: "STUDENT" });

      expect(outcome).toBe("rejected");
      expect(publisher.joins).toEqual([]);
    });
  });
});
