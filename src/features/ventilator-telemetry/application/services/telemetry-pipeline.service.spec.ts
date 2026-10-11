/*
 * Funcionalidad: Pruebas del pipeline de telemetría
 * Descripción: Verifica el descarte de mensajes inválidos (contador, sin excepciones y registro limitado), la detección de huecos de secuencia (con tramas duplicadas contadas aparte), el envío por lotes cada VENTILATOR_FLUSH_INTERVAL_MS con emisión volátil a varias salas y la forma heredada de ventilator:data, el búfer acotado que descarta las tramas más antiguas, las alarmas JSON del tópico de alarmas, las latencias y los oyentes de tramas
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Logger } from "@nestjs/common";

import { DeviceStalenessService } from "@/features/ventilator-telemetry/application/services/device-staleness.service";
import { TelemetryMetricsService, type TelemetryMetricsSnapshot } from "@/features/ventilator-telemetry/application/services/telemetry-metrics.service";
import { TelemetryPipelineService } from "@/features/ventilator-telemetry/application/services/telemetry-pipeline.service";
import { TelemetryRecorderService } from "@/features/ventilator-telemetry/application/services/telemetry-recorder.service";
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

const TELEMETRY_TOPIC: string = "/ventynet/data";
const ALARM_TOPIC: string = "ventilab/device/001/alarm";

interface PipelineFixture {
  readonly pipeline: TelemetryPipelineService;
  readonly publisher: FakeRealtimePublisher;
  readonly metrics: TelemetryMetricsService;
  readonly clock: FakeTelemetryClock;
}

function buildPipeline(overrides: Partial<VentilatorTelemetrySettings> = {}): PipelineFixture {
  const settings: VentilatorTelemetrySettings = buildTelemetrySettings(overrides);
  const clock: FakeTelemetryClock = new FakeTelemetryClock();
  const publisher: FakeRealtimePublisher = new FakeRealtimePublisher();
  const metrics: TelemetryMetricsService = new TelemetryMetricsService(settings, clock);
  const staleness: DeviceStalenessService = new DeviceStalenessService(settings, publisher, clock);
  const recorder: TelemetryRecorderService = new TelemetryRecorderService(settings, new InMemoryTelemetryChunksRepository(), new JsonTelemetryChunkCodec(), clock);
  const pipeline: TelemetryPipelineService = new TelemetryPipelineService(
    settings,
    createTelemetryDecoder(settings.decoder, settings.deviceId),
    publisher,
    metrics,
    staleness,
    recorder,
    clock,
  );

  return { pipeline, publisher, metrics, clock };
}

describe("TelemetryPipelineService", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation((): void => undefined);
    jest.spyOn(Logger.prototype, "error").mockImplementation((): void => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe("malformed messages", () => {
    it("drops them, counts them and never throws", () => {
      const { pipeline, publisher, metrics }: PipelineFixture = buildPipeline();

      expect(() => pipeline.handleMessage(TELEMETRY_TOPIC, Buffer.from("{not json", "utf-8"))).not.toThrow();
      expect(() => pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: "x" }))).not.toThrow();
      pipeline.flush();

      expect(metrics.invalidMessages).toBe(2);
      expect(publisher.emitsOf("ventilator:telemetry")).toHaveLength(0);
    });

    it("logs at most one warning per VENTILATOR_INVALID_LOG_INTERVAL_MS", () => {
      const { pipeline, clock }: PipelineFixture = buildPipeline({ invalidLogIntervalMs: 5000 });

      pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 1 }));
      pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 1 }));
      clock.advance(4999);
      pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 1 }));
      const warningsInsideInterval: number = warnSpy.mock.calls.length;

      clock.advance(2);
      pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 1 }));

      expect(warningsInsideInterval).toBe(1);
      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(String(warnSpy.mock.calls[1][0])).toContain("2 similar messages suppressed");
    });
  });

  describe("sequence gaps", () => {
    it("adds gap - 1 lost messages and counts late frames as reordered without resetting the baseline", () => {
      const { pipeline, metrics }: PipelineFixture = buildPipeline();

      for (const seq of [1, 2, 5, 3, 4, 10]) {
        pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 1, flow: 1, volume: 1, seq }));
      }

      expect(metrics.lostMessages).toBe(6);
      expect(metrics.reorderedMessages).toBe(2);
    });

    it("does not report losses for reordered frames (10, 8, 11)", () => {
      const { pipeline, metrics, clock }: PipelineFixture = buildPipeline();

      for (const seq of [10, 8, 11]) {
        pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 1, flow: 1, volume: 1, seq }));
      }

      expect([metrics.lostMessages, metrics.snapshot(clock.nowMs).reorderedMessages]).toEqual([0, 1]);
    });

    it("counts a repeated sequence number as a duplicate instead of a reordered frame (7, 7, 8)", () => {
      const { pipeline, metrics, clock }: PipelineFixture = buildPipeline();

      for (const seq of [7, 7, 8]) {
        pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 1, flow: 1, volume: 1, seq }));
      }

      const snapshot: TelemetryMetricsSnapshot = metrics.snapshot(clock.nowMs);

      expect([snapshot.lostMessages, snapshot.reorderedMessages, snapshot.duplicateMessages, metrics.duplicateMessages]).toEqual([0, 0, 1, 1]);
    });
  });

  describe("batching", () => {
    it("emits one volatile batch per flush interval to the ventilator room and the teacher and admin role rooms", () => {
      jest.useFakeTimers();
      const { pipeline, publisher }: PipelineFixture = buildPipeline({ flushIntervalMs: 33 });

      pipeline.start();
      pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 1, flow: 2, volume: 3, seq: 1 }));
      pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 4, flow: 5, volume: 6, seq: 2 }));
      jest.advanceTimersByTime(32);
      const emittedBeforeInterval: number = publisher.emits.length;

      jest.advanceTimersByTime(1);
      const batches: RecordedEmit[] = publisher.emitsOf("ventilator:telemetry");

      jest.advanceTimersByTime(33 * 3);
      pipeline.stop();

      expect(emittedBeforeInterval).toBe(publisher.emitsOf("ventilator:connected").length);
      expect(batches).toHaveLength(1);
      expect(publisher.emitsOf("ventilator:telemetry")).toHaveLength(1);
      expect(batches[0].method).toBe("emitToRoomsVolatile");
      expect(batches[0].target).toEqual(["ventilator", "role:TEACHER", "role:ADMIN"]);
      expect((batches[0].payload as { frames: TelemetryFrame[] }).frames.map((frame: TelemetryFrame): number | undefined => frame.seq)).toEqual([1, 2]);
    });

    it("keeps the legacy ventilator:data shape with the latest frame", () => {
      const { pipeline, publisher, clock }: PipelineFixture = buildPipeline();

      pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 1, flow: 2, volume: 3 }));
      pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 10, flow: 20, volume: 30, spo2: 96, seq: 9, mode: "VCV" }));
      pipeline.flush();
      const legacy: RecordedEmit[] = publisher.emitsOf("ventilator:data");

      expect(legacy).toHaveLength(1);
      expect(legacy[0].method).toBe("emitToRoomsVolatile");
      expect(legacy[0].target).toEqual(["ventilator", "role:TEACHER", "role:ADMIN"]);
      expect(legacy[0].payload).toEqual({ pressure: 10, flow: 20, volume: 30, spo2: 96, timestamp: clock.nowMs, deviceId: "ventilab-device-001" });
    });

    it("records processing, total and flush latencies", () => {
      const { pipeline, metrics, clock }: PipelineFixture = buildPipeline();

      pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 1, flow: 2, volume: 3, deviceTs: clock.nowMs - 7 }));
      clock.advance(20);
      pipeline.flush();
      const snapshot: TelemetryMetricsSnapshot = metrics.snapshot(clock.nowMs);

      expect(snapshot.processingMs.count).toBe(1);
      expect(snapshot.totalMs.p50).toBe(20);
      expect(snapshot.flushMs.count).toBe(1);
      expect(snapshot.deviceLatencyMs.p50).toBe(7);
      expect(snapshot.volatileEmits).toBe(2);
    });
  });

  describe("bounded buffer", () => {
    it("drops the oldest frames beyond VENTILATOR_MAX_BUFFERED_FRAMES and counts them as buffer drops", () => {
      const { pipeline, publisher, metrics, clock }: PipelineFixture = buildPipeline({ maxBufferedFrames: 3 });

      for (const seq of [1, 2, 3, 4, 5]) {
        pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 1, flow: 1, volume: 1, seq }));
      }

      pipeline.flush();
      const batch: RecordedEmit[] = publisher.emitsOf("ventilator:telemetry");

      expect((batch[0].payload as { frames: TelemetryFrame[] }).frames.map((frame: TelemetryFrame): number | undefined => frame.seq)).toEqual([3, 4, 5]);
      expect(metrics.bufferDrops).toBe(2);
      expect(metrics.snapshot(clock.nowMs).bufferDrops).toBe(2);
      expect(metrics.lostMessages).toBe(0);
    });

    it("does not drop anything while the buffer stays below the cap", () => {
      const { pipeline, metrics }: PipelineFixture = buildPipeline({ maxBufferedFrames: 3 });

      pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 1, flow: 1, volume: 1 }));
      pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 1, flow: 1, volume: 1 }));
      pipeline.flush();
      pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 1, flow: 1, volume: 1 }));
      pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 1, flow: 1, volume: 1 }));
      pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 1, flow: 1, volume: 1 }));

      expect(metrics.bufferDrops).toBe(0);
    });
  });

  describe("alarms", () => {
    it("broadcasts a json alarm received on the alarm topic", () => {
      const { pipeline, publisher, clock }: PipelineFixture = buildPipeline();

      pipeline.handleMessage(ALARM_TOPIC, jsonFrame({ type: "LOW_PRESSURE", severity: "HIGH" }));

      expect(publisher.emitsOf("ventilator:alarm")).toEqual([{
        method: "broadcast",
        target: undefined,
        event: "ventilator:alarm",
        payload: { type: "LOW_PRESSURE", severity: "HIGH", message: "[HIGH] Low airway pressure detected", timestamp: clock.nowMs, active: true, acknowledged: false },
      }]);
      expect(pipeline.activeAlarms).toHaveLength(1);
    });
  });

  describe("frame listeners", () => {
    it("notifies listeners synchronously and isolates their errors", () => {
      const { pipeline, clock }: PipelineFixture = buildPipeline();
      const received: TelemetryFrame[] = [];

      pipeline.onFrame((): void => {
        throw new Error("listener failure");
      });
      const unsubscribe: () => void = pipeline.onFrame((frame: TelemetryFrame): void => {
        received.push(frame);
      });

      pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 1, flow: 2, volume: 3, settings: { peep: 5 } }));
      unsubscribe();
      pipeline.handleMessage(TELEMETRY_TOPIC, jsonFrame({ pressure: 1, flow: 2, volume: 3 }));

      expect(received).toHaveLength(1);
      expect(received[0].serverTs).toBe(clock.nowMs);
      expect(pipeline.latestSettings).toEqual({ peep: 5 });
    });
  });
});
