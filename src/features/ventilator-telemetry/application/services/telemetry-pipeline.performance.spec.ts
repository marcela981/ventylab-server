/*
 * Funcionalidad: Prueba de rendimiento del pipeline de telemetría
 * Descripción: Alimenta 3600 tramas JSON (60 s a 60 Hz) por el pipeline real decodificar→encolar→enviar con el reloj del sistema y comprueba que el p95 de procesamiento sea menor de 10 ms y que no haya mensajes inválidos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DeviceStalenessService } from "@/features/ventilator-telemetry/application/services/device-staleness.service";
import { TelemetryMetricsService, type TelemetryMetricsSnapshot } from "@/features/ventilator-telemetry/application/services/telemetry-metrics.service";
import { TelemetryPipelineService } from "@/features/ventilator-telemetry/application/services/telemetry-pipeline.service";
import { TelemetryRecorderService } from "@/features/ventilator-telemetry/application/services/telemetry-recorder.service";
import {
  buildTelemetrySettings,
  FakeRealtimePublisher,
  InMemoryTelemetryChunksRepository,
  JsonTelemetryChunkCodec,
  jsonFrame,
} from "@/features/ventilator-telemetry/application/testing/ventilator-telemetry-test-doubles-spec";
import { type VentilatorTelemetrySettings } from "@/features/ventilator-telemetry/application/tokens/ventilator-telemetry-settings.token";
import { createTelemetryDecoder } from "@/features/ventilator-telemetry/domain/decoders/create-telemetry-decoder";
import { SystemTelemetryClock } from "@/features/ventilator-telemetry/infrastructure/clock/system-telemetry.clock";

const FRAME_COUNT: number = 3600;
const FRAMES_PER_FLUSH: number = 2;
const PROCESSING_P95_LIMIT_MS: number = 10;

describe("TelemetryPipelineService performance", () => {
  it("processes 3600 json frames with a processing p95 below 10 ms and no invalid messages", () => {
    const settings: VentilatorTelemetrySettings = buildTelemetrySettings({ metricsWindow: FRAME_COUNT });
    const clock: SystemTelemetryClock = new SystemTelemetryClock();
    const publisher: FakeRealtimePublisher = new FakeRealtimePublisher();
    const metrics: TelemetryMetricsService = new TelemetryMetricsService(settings, clock);
    const pipeline: TelemetryPipelineService = new TelemetryPipelineService(
      settings,
      createTelemetryDecoder("json", settings.deviceId),
      publisher,
      metrics,
      new DeviceStalenessService(settings, publisher, clock),
      new TelemetryRecorderService(settings, new InMemoryTelemetryChunksRepository(), new JsonTelemetryChunkCodec(), clock),
      clock,
    );
    const payloads: Buffer[] = Array.from({ length: FRAME_COUNT }, (_value: unknown, seq: number): Buffer => jsonFrame({
      seq,
      deviceTs: Date.now(),
      pressure: 5 + (seq % 30),
      flow: Math.sin(seq / 10) * 60,
      volume: 400 + (seq % 50),
      mode: "VCV",
      settings: { peep: 5, fio2: 0.4, rr: 16, vt: 450 },
    }));

    payloads.forEach((payload: Buffer, index: number): void => {
      pipeline.handleMessage(settings.telemetryTopic, payload);

      if ((index + 1) % FRAMES_PER_FLUSH === 0) {
        pipeline.flush();
      }
    });
    pipeline.flush();

    const snapshot: TelemetryMetricsSnapshot = metrics.snapshot(clock.now());

    expect(snapshot.invalidMessages).toBe(0);
    expect(snapshot.lostMessages).toBe(0);
    expect(snapshot.totalMessages).toBe(FRAME_COUNT);
    expect(snapshot.processingMs.count).toBe(FRAME_COUNT);
    expect(snapshot.processingMs.p95).not.toBeNull();
    expect(snapshot.processingMs.p95 ?? Number.POSITIVE_INFINITY).toBeLessThan(PROCESSING_P95_LIMIT_MS);
    expect(publisher.emitsOf("ventilator:telemetry")).toHaveLength(FRAME_COUNT / FRAMES_PER_FLUSH);
  });
});
