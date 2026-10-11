/*
 * Funcionalidad: Mapper de presentación de la telemetría del ventilador
 * Descripción: Convierte la instantánea de métricas (con los duplicados de secuencia), las tramas grabadas y las muestras de latencia (filas CSV) en sus DTO de respuesta
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type TelemetryRecordingResult } from "@/features/ventilator-telemetry/application/results/telemetry-recording.result";
import { type TelemetryMetricSample, type TelemetryMetricsSnapshot } from "@/features/ventilator-telemetry/application/services/telemetry-metrics.service";
import { type LatencySummary } from "@/features/ventilator-telemetry/domain/services/latency-ring-buffer";
import { type RecordedTelemetrySample } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-chunk";
import {
  LatencySummaryDTO,
  RecordedTelemetryFrameDTO,
  TelemetryMetricsDTO,
  TelemetryRecordingDTO,
} from "@/features/ventilator-telemetry/presentation/dtos/ventilator-telemetry.dto";
import { type TelemetryMetricCsvRow } from "@/features/ventilator-telemetry/presentation/utils/telemetry-metrics-csv.columns";

export class VentilatorTelemetryMapper {
  public static toMetricsDTO(snapshot: TelemetryMetricsSnapshot): TelemetryMetricsDTO {
    return new TelemetryMetricsDTO({
      since: new Date(snapshot.since).toISOString(),
      windowSize: snapshot.windowSize,
      messagesPerSecond: snapshot.messagesPerSecond,
      batchesPerSecond: snapshot.batchesPerSecond,
      totalMessages: snapshot.totalMessages,
      invalidMessages: snapshot.invalidMessages,
      lostMessages: snapshot.lostMessages,
      reorderedMessages: snapshot.reorderedMessages,
      duplicateMessages: snapshot.duplicateMessages,
      bufferDrops: snapshot.bufferDrops,
      volatileEmits: snapshot.volatileEmits,
      processingMs: VentilatorTelemetryMapper._toLatencyDTO(snapshot.processingMs),
      totalMs: VentilatorTelemetryMapper._toLatencyDTO(snapshot.totalMs),
      flushMs: VentilatorTelemetryMapper._toLatencyDTO(snapshot.flushMs),
      deviceLatencyMs: VentilatorTelemetryMapper._toLatencyDTO(snapshot.deviceLatencyMs),
    });
  }

  public static toCsvRows(samples: readonly TelemetryMetricSample[]): TelemetryMetricCsvRow[] {
    return samples.map((sample: TelemetryMetricSample): TelemetryMetricCsvRow => ({
      kind: sample.kind,
      valueMs: sample.valueMs,
      recordedAt: new Date(sample.recordedAt).toISOString(),
    }));
  }

  public static toRecordingDTO(result: TelemetryRecordingResult): TelemetryRecordingDTO {
    return new TelemetryRecordingDTO({
      reservationId: result.reservationId,
      sampleRateHz: result.sampleRateHz ?? null,
      chunkCount: result.chunkCount,
      frames: result.frames.map((frame: RecordedTelemetrySample): RecordedTelemetryFrameDTO => new RecordedTelemetryFrameDTO({
        serverTs: frame.serverTs,
        deviceTs: frame.deviceTs ?? null,
        seq: frame.seq ?? null,
        pressure: frame.pressure,
        flow: frame.flow,
        volume: frame.volume,
        pco2: frame.pco2 ?? null,
        spo2: frame.spo2 ?? null,
      })),
    });
  }

  private static _toLatencyDTO(summary: LatencySummary): LatencySummaryDTO {
    return new LatencySummaryDTO({ count: summary.count, p50: summary.p50, p95: summary.p95, p99: summary.p99, max: summary.max });
  }
}
