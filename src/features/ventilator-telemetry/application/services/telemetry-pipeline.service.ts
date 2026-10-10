/*
 * Funcionalidad: Pipeline de telemetría del ventilador
 * Descripción: Camino caliente MQTT→Socket.io sin base de datos ni await: decodifica cada mensaje, sella serverTs, detecta huecos de secuencia (con ventana de reordenamiento VENTILATOR_SEQ_REORDER_WINDOW y vuelta opcional VENTILATOR_SEQ_WRAP_BITS), actualiza parámetros y actividad, notifica a los oyentes de tramas y encola en un búfer acotado por VENTILATOR_MAX_BUFFERED_FRAMES que descarta las tramas más antiguas y las cuenta en bufferDrops; cada VENTILATOR_FLUSH_INTERVAL_MS emite un lote volátil ventilator:telemetry y la lectura heredada ventilator:data a la sala ventilator y a docentes y administradores, y registra las latencias
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { type IRealtimePublisher, REALTIME_PUBLISHER_TOKEN, roleRoom, VENTILATOR_ROOM } from "@/common/application/ports/realtime-publisher.interface";
import { type ITelemetryClock, TELEMETRY_CLOCK_TOKEN } from "@/features/ventilator-telemetry/application/ports/telemetry-clock.interface";
import {
  TELEMETRY_PRIVILEGED_ROLES,
  VENTILATOR_ALARM_EVENT,
  VENTILATOR_DATA_EVENT,
  VENTILATOR_TELEMETRY_EVENT,
  type VentilatorTelemetryBatchPayload,
} from "@/features/ventilator-telemetry/application/realtime/ventilator-telemetry-events";
import { DeviceStalenessService } from "@/features/ventilator-telemetry/application/services/device-staleness.service";
import { TelemetryMetricsService } from "@/features/ventilator-telemetry/application/services/telemetry-metrics.service";
import { TelemetryRecorderService } from "@/features/ventilator-telemetry/application/services/telemetry-recorder.service";
import {
  TELEMETRY_DECODER_TOKEN,
  VENTILATOR_TELEMETRY_SETTINGS_TOKEN,
  type VentilatorTelemetrySettings,
} from "@/features/ventilator-telemetry/application/tokens/ventilator-telemetry-settings.token";
import { decodeJsonAlarm } from "@/features/ventilator-telemetry/domain/decoders/json-alarm.decoder";
import { type DecodeResult, type TelemetryDecoder, type TelemetryDecoderName } from "@/features/ventilator-telemetry/domain/decoders/telemetry-decoder";
import { type SequenceObservation, SequenceGapTracker } from "@/features/ventilator-telemetry/domain/services/sequence-gap-tracker";
import { stampTelemetryFrame, type TelemetryFrame, toVentilatorReading } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-frame";
import { type VentilatorAlarm } from "@/features/ventilator-telemetry/domain/value-objects/ventilator-alarm";

export type TelemetryFrameListener = (frame: TelemetryFrame) => void;

interface PendingFrame {
  readonly frame: TelemetryFrame;
  readonly receivedAt: number;
}

const BATCH_EMITS_PER_FLUSH: number = 2;

@Injectable()
export class TelemetryPipelineService {
  private readonly _logger: Logger = new Logger(TelemetryPipelineService.name);
  private readonly _audience: readonly string[] = [VENTILATOR_ROOM, ...TELEMETRY_PRIVILEGED_ROLES.map(roleRoom)];
  private readonly _listeners: Set<TelemetryFrameListener> = new Set<TelemetryFrameListener>();
  private readonly _activeAlarms: Map<string, VentilatorAlarm> = new Map<string, VentilatorAlarm>();
  private readonly _sequence: SequenceGapTracker;
  private _pending: PendingFrame[] = [];
  private _latestSettings: Readonly<Record<string, number>> | undefined;
  private _timer: ReturnType<typeof setInterval> | undefined;
  private _lastInvalidLogAt: number | undefined;
  private _suppressedInvalid: number = 0;

  public constructor(
    @Inject(VENTILATOR_TELEMETRY_SETTINGS_TOKEN)
    private readonly _settings: VentilatorTelemetrySettings,
    @Inject(TELEMETRY_DECODER_TOKEN)
    private readonly _decoder: TelemetryDecoder,
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtimePublisher: IRealtimePublisher,
    private readonly _metrics: TelemetryMetricsService,
    private readonly _staleness: DeviceStalenessService,
    private readonly _recorder: TelemetryRecorderService,
    @Inject(TELEMETRY_CLOCK_TOKEN)
    private readonly _clock: ITelemetryClock,
  ) {
    this._sequence = new SequenceGapTracker({ reorderWindow: _settings.sequenceReorderWindow, wrapBits: _settings.sequenceWrapBits });
  }

  public get decoderName(): TelemetryDecoderName {
    return this._decoder.name;
  }

  public get latestSettings(): Readonly<Record<string, number>> | undefined {
    return this._latestSettings;
  }

  public get activeAlarms(): VentilatorAlarm[] {
    return Array.from(this._activeAlarms.values());
  }

  public start(): void {
    if (this._timer !== undefined) {
      return;
    }

    this._timer = setInterval((): void => this.flush(), this._settings.flushIntervalMs);
    this._timer.unref();
  }

  public stop(): void {
    if (this._timer !== undefined) {
      clearInterval(this._timer);
      this._timer = undefined;
    }

    this.flush();
  }

  public onFrame(listener: TelemetryFrameListener): () => void {
    this._listeners.add(listener);

    return (): void => {
      this._listeners.delete(listener);
    };
  }

  public handleMessage(topic: string, payload: Buffer): void {
    const receivedAt: number = this._clock.monotonic();
    const now: number = this._clock.now();

    try {
      this._metrics.recordMessage(now);
      this._staleness.markMessage(now);

      const result: DecodeResult = topic === this._settings.alarmTopic
        ? decodeJsonAlarm(payload, now) ?? this._decoder.decode(payload)
        : this._decoder.decode(payload);

      if (!result.ok) {
        this._dropInvalid(result.reason, now);

        return;
      }

      if (result.kind === "alarm") {
        this._publishAlarm(result.alarm);

        return;
      }

      this._acceptFrame(stampTelemetryFrame(result.frame, now), receivedAt);
    } catch (error: unknown) {
      this._dropInvalid(error instanceof Error ? error.message : "unexpected_error", now);
    }
  }

  public flush(): void {
    if (this._pending.length === 0) {
      return;
    }

    const pending: PendingFrame[] = this._pending;

    this._pending = [];

    try {
      const flushStartedAt: number = this._clock.monotonic();
      const frames: TelemetryFrame[] = pending.map((entry: PendingFrame): TelemetryFrame => entry.frame);
      const batch: VentilatorTelemetryBatchPayload = { frames, serverTs: this._clock.now() };

      this._realtimePublisher.emitToRoomsVolatile(this._audience, VENTILATOR_TELEMETRY_EVENT, batch);
      this._realtimePublisher.emitToRoomsVolatile(this._audience, VENTILATOR_DATA_EVENT, toVentilatorReading(frames[frames.length - 1]));

      const emittedAt: number = this._clock.monotonic();
      const now: number = this._clock.now();

      for (const entry of pending) {
        this._metrics.recordLatency("total", emittedAt - entry.receivedAt, now);
      }

      this._metrics.recordLatency("flush", emittedAt - flushStartedAt, now);
      this._metrics.recordBatch(now);
      this._metrics.recordVolatileEmits(BATCH_EMITS_PER_FLUSH);
    } catch (error: unknown) {
      this._logger.error(`Telemetry flush failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private _acceptFrame(frame: TelemetryFrame, receivedAt: number): void {
    const sequence: SequenceObservation = this._sequence.observe(frame.seq);

    if (sequence.lost > 0) {
      this._metrics.recordLost(sequence.lost);
    }

    if (sequence.reordered) {
      this._metrics.recordReordered();
    }

    if (frame.settings !== undefined) {
      this._latestSettings = frame.settings;
    }

    for (const listener of this._listeners) {
      try {
        listener(frame);
      } catch (error: unknown) {
        this._logger.error(`Telemetry frame listener failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (this._pending.length >= this._settings.maxBufferedFrames) {
      const dropped: number = this._pending.length - this._settings.maxBufferedFrames + 1;

      this._pending.splice(0, dropped);
      this._metrics.recordBufferDrops(dropped);
    }

    this._pending.push({ frame, receivedAt });
    this._recorder.offer(frame);

    this._metrics.recordLatency("processing", this._clock.monotonic() - receivedAt, frame.serverTs);

    if (frame.deviceTs !== undefined) {
      this._metrics.recordLatency("device_latency", frame.serverTs - frame.deviceTs, frame.serverTs);
    }
  }

  private _publishAlarm(alarm: VentilatorAlarm): void {
    this._activeAlarms.set(alarm.type, alarm);
    this._realtimePublisher.broadcast(VENTILATOR_ALARM_EVENT, alarm);
  }

  private _dropInvalid(reason: string, now: number): void {
    this._metrics.recordInvalid();

    const last: number | undefined = this._lastInvalidLogAt;

    if (last !== undefined && now - last < this._settings.invalidLogIntervalMs) {
      this._suppressedInvalid++;

      return;
    }

    const suppressed: string = this._suppressedInvalid > 0 ? ` (${this._suppressedInvalid} similar messages suppressed)` : "";

    this._logger.warn(`Dropped invalid ventilator message: ${reason}${suppressed}`);
    this._lastInvalidLogAt = now;
    this._suppressedInvalid = 0;
  }
}
