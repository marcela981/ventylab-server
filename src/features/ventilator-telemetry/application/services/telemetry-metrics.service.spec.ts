/*
 * Funcionalidad: Pruebas de las métricas de telemetría
 * Descripción: Verifica los percentiles p50/p95/p99 por rango más cercano, el búfer circular de tamaño VENTILATOR_METRICS_WINDOW, las tasas por segundo, el reinicio y la exportación CSV (kind,valueMs,recordedAt) de cada muestra retenida
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { toCsv } from "@/common/presentation/utils/csv.util";
import { TelemetryMetricsService, type TelemetryMetricsSnapshot } from "@/features/ventilator-telemetry/application/services/telemetry-metrics.service";
import { buildTelemetrySettings, FakeTelemetryClock } from "@/features/ventilator-telemetry/application/testing/ventilator-telemetry-test-doubles-spec";
import { percentile } from "@/features/ventilator-telemetry/domain/services/latency-ring-buffer";
import { VentilatorTelemetryMapper } from "@/features/ventilator-telemetry/presentation/mappers/ventilator-telemetry.mapper";
import { TELEMETRY_METRIC_CSV_COLUMNS } from "@/features/ventilator-telemetry/presentation/utils/telemetry-metrics-csv.columns";

describe("percentile", () => {
  it("uses the nearest rank", () => {
    const sorted: number[] = Array.from({ length: 100 }, (_value: unknown, index: number): number => index + 1);

    expect([percentile(sorted, 50), percentile(sorted, 95), percentile(sorted, 99)]).toEqual([50, 95, 99]);
    expect(percentile([], 50)).toBeNull();
  });
});

describe("TelemetryMetricsService", () => {
  it("summarises latencies with p50, p95, p99 and max", () => {
    const clock: FakeTelemetryClock = new FakeTelemetryClock();
    const metrics: TelemetryMetricsService = new TelemetryMetricsService(buildTelemetrySettings(), clock);

    for (let value: number = 100; value >= 1; value--) {
      metrics.recordLatency("processing", value, clock.nowMs);
    }

    const snapshot: TelemetryMetricsSnapshot = metrics.snapshot(clock.nowMs);

    expect(snapshot.processingMs).toEqual({ count: 100, p50: 50, p95: 95, p99: 99, max: 100 });
    expect(snapshot.totalMs).toEqual({ count: 0, p50: null, p95: null, p99: null, max: null });
  });

  it("keeps only the last VENTILATOR_METRICS_WINDOW samples per kind", () => {
    const clock: FakeTelemetryClock = new FakeTelemetryClock();
    const metrics: TelemetryMetricsService = new TelemetryMetricsService(buildTelemetrySettings({ metricsWindow: 10 }), clock);

    for (let value: number = 1; value <= 25; value++) {
      metrics.recordLatency("total", value, clock.nowMs + value);
    }

    const snapshot: TelemetryMetricsSnapshot = metrics.snapshot(clock.nowMs);

    expect(snapshot.totalMs.count).toBe(10);
    expect(snapshot.totalMs.max).toBe(25);
    expect(metrics.samples().map((sample: { valueMs: number }): number => sample.valueMs)).toEqual([16, 17, 18, 19, 20, 21, 22, 23, 24, 25]);
  });

  it("computes per-second rates over a sliding window and resets everything", () => {
    const clock: FakeTelemetryClock = new FakeTelemetryClock();
    const metrics: TelemetryMetricsService = new TelemetryMetricsService(buildTelemetrySettings(), clock);

    for (let index: number = 0; index < 60; index++) {
      metrics.recordMessage(clock.nowMs + index * 20);
    }

    metrics.recordInvalid();
    metrics.recordLost(3);
    const ratePerSecond: number = metrics.snapshot(clock.nowMs + 1199).messagesPerSecond;

    metrics.reset();
    const afterReset: TelemetryMetricsSnapshot = metrics.snapshot(clock.nowMs + 1199);

    expect(ratePerSecond).toBe(50);
    expect([afterReset.totalMessages, afterReset.invalidMessages, afterReset.lostMessages, afterReset.messagesPerSecond]).toEqual([0, 0, 0, 0]);
  });

  it("exports one csv row per retained sample", () => {
    const clock: FakeTelemetryClock = new FakeTelemetryClock(Date.UTC(2026, 9, 10, 12, 0, 0));
    const metrics: TelemetryMetricsService = new TelemetryMetricsService(buildTelemetrySettings(), clock);

    metrics.recordLatency("processing", 0.25, clock.nowMs);
    metrics.recordLatency("device_latency", -3, clock.nowMs + 1000);

    const csv: string = toCsv(VentilatorTelemetryMapper.toCsvRows(metrics.samples()), TELEMETRY_METRIC_CSV_COLUMNS);

    expect(csv).toBe([
      "kind,valueMs,recordedAt",
      "processing,0.25,2026-10-10T12:00:00.000Z",
      "device_latency,-3,2026-10-10T12:00:01.000Z",
      "",
    ].join("\r\n"));
  });
});
