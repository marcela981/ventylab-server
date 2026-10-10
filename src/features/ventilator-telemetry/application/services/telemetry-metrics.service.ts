/*
 * Funcionalidad: Métricas de la telemetría del ventilador
 * Descripción: Métricas en memoria del pipeline de telemetría: mensajes y lotes por segundo, mensajes inválidos descartados, perdidos por huecos de secuencia, tramas tardías reordenadas, emisiones volátiles y búferes circulares (VENTILATOR_METRICS_WINDOW) de latencia de procesamiento, total, de envío del lote y dispositivo→servidor con p50/p95/p99
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITelemetryClock, TELEMETRY_CLOCK_TOKEN } from "@/features/ventilator-telemetry/application/ports/telemetry-clock.interface";
import { VENTILATOR_TELEMETRY_SETTINGS_TOKEN, type VentilatorTelemetrySettings } from "@/features/ventilator-telemetry/application/tokens/ventilator-telemetry-settings.token";
import {
  type LatencySample,
  LatencyRingBuffer,
  type LatencySummary,
  RateCounter,
} from "@/features/ventilator-telemetry/domain/services/latency-ring-buffer";

export type TelemetryLatencyKind = "processing" | "total" | "flush" | "device_latency";

export const TELEMETRY_LATENCY_KINDS: readonly TelemetryLatencyKind[] = ["processing", "total", "flush", "device_latency"] as const;

export interface TelemetryMetricSample {
  readonly kind: TelemetryLatencyKind;
  readonly valueMs: number;
  readonly recordedAt: number;
}

export interface TelemetryMetricsSnapshot {
  readonly since: number;
  readonly windowSize: number;
  readonly messagesPerSecond: number;
  readonly batchesPerSecond: number;
  readonly totalMessages: number;
  readonly invalidMessages: number;
  readonly lostMessages: number;
  readonly reorderedMessages: number;
  readonly bufferDrops: number;
  readonly volatileEmits: number;
  readonly processingMs: LatencySummary;
  readonly totalMs: LatencySummary;
  readonly flushMs: LatencySummary;
  readonly deviceLatencyMs: LatencySummary;
}

const RATE_CAPACITY: number = 4096;

@Injectable()
export class TelemetryMetricsService {
  private readonly _messages: RateCounter = new RateCounter(RATE_CAPACITY);
  private readonly _batches: RateCounter = new RateCounter(RATE_CAPACITY);
  private readonly _latencies: Record<TelemetryLatencyKind, LatencyRingBuffer>;
  private _since: number;
  private _totalMessages: number = 0;
  private _invalidMessages: number = 0;
  private _lostMessages: number = 0;
  private _reorderedMessages: number = 0;
  private _bufferDrops: number = 0;
  private _volatileEmits: number = 0;

  public constructor(
    @Inject(VENTILATOR_TELEMETRY_SETTINGS_TOKEN)
    private readonly _settings: VentilatorTelemetrySettings,
    @Inject(TELEMETRY_CLOCK_TOKEN)
    private readonly _clock: ITelemetryClock,
  ) {
    const window: number = _settings.metricsWindow;

    this._latencies = {
      processing: new LatencyRingBuffer(window),
      total: new LatencyRingBuffer(window),
      flush: new LatencyRingBuffer(window),
      device_latency: new LatencyRingBuffer(window),
    };
    this._since = _clock.now();
  }

  public get invalidMessages(): number {
    return this._invalidMessages;
  }

  public get lostMessages(): number {
    return this._lostMessages;
  }

  public get reorderedMessages(): number {
    return this._reorderedMessages;
  }

  public get bufferDrops(): number {
    return this._bufferDrops;
  }

  public recordMessage(now: number): void {
    this._totalMessages++;
    this._messages.record(now);
  }

  public recordInvalid(): void {
    this._invalidMessages++;
  }

  public recordReordered(): void {
    this._reorderedMessages += 1;
  }

  public recordLost(count: number): void {
    this._lostMessages += count;
  }

  public recordBufferDrops(count: number): void {
    this._bufferDrops += count;
  }

  public recordBatch(now: number): void {
    this._batches.record(now);
  }

  public recordVolatileEmits(count: number): void {
    this._volatileEmits += count;
  }

  public recordLatency(kind: TelemetryLatencyKind, valueMs: number, recordedAt: number): void {
    this._latencies[kind].push(valueMs, recordedAt);
  }

  public messagesPerSecond(now: number): number {
    return this._messages.perSecond(now);
  }

  public snapshot(now: number): TelemetryMetricsSnapshot {
    return {
      since: this._since,
      windowSize: this._settings.metricsWindow,
      messagesPerSecond: this._messages.perSecond(now),
      batchesPerSecond: this._batches.perSecond(now),
      totalMessages: this._totalMessages,
      invalidMessages: this._invalidMessages,
      lostMessages: this._lostMessages,
      reorderedMessages: this._reorderedMessages,
      bufferDrops: this._bufferDrops,
      volatileEmits: this._volatileEmits,
      processingMs: this._latencies.processing.summary(),
      totalMs: this._latencies.total.summary(),
      flushMs: this._latencies.flush.summary(),
      deviceLatencyMs: this._latencies.device_latency.summary(),
    };
  }

  public samples(): TelemetryMetricSample[] {
    return TELEMETRY_LATENCY_KINDS.flatMap((kind: TelemetryLatencyKind): TelemetryMetricSample[] =>
      this._latencies[kind].samples().map((sample: LatencySample): TelemetryMetricSample => ({ kind, valueMs: sample.valueMs, recordedAt: sample.recordedAt })),
    );
  }

  public reset(): void {
    this._messages.clear();
    this._batches.clear();

    for (const kind of TELEMETRY_LATENCY_KINDS) {
      this._latencies[kind].clear();
    }

    this._since = this._clock.now();
    this._totalMessages = 0;
    this._invalidMessages = 0;
    this._lostMessages = 0;
    this._reorderedMessages = 0;
    this._bufferDrops = 0;
    this._volatileEmits = 0;
  }
}
