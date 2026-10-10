/*
 * Funcionalidad: Grabación de telemetría
 * Descripción: Grabación opcional de la telemetría de la reserva activa: submuestrea las tramas a VENTILATOR_RECORDING_HZ y cada VENTILATOR_RECORDING_FLUSH_SECONDS codifica y guarda un TelemetryChunk en segundo plano (sin esperar la escritura); se detiene al terminar o cambiar la reserva activa
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { type ITelemetryChunkCodec, TELEMETRY_CHUNK_CODEC_TOKEN } from "@/features/ventilator-telemetry/application/ports/telemetry-chunk-codec.interface";
import { type ITelemetryClock, TELEMETRY_CLOCK_TOKEN } from "@/features/ventilator-telemetry/application/ports/telemetry-clock.interface";
import { VENTILATOR_TELEMETRY_SETTINGS_TOKEN, type VentilatorTelemetrySettings } from "@/features/ventilator-telemetry/application/tokens/ventilator-telemetry-settings.token";
import { type ITelemetryChunksRepository, TELEMETRY_CHUNKS_REPOSITORY_TOKEN } from "@/features/ventilator-telemetry/domain/repositories/telemetry-chunks.repository";
import {
  createTelemetryChunk,
  type RecordedTelemetrySample,
  toRecordedSample,
} from "@/features/ventilator-telemetry/domain/value-objects/telemetry-chunk";
import { type TelemetryFrame } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-frame";

export interface TelemetryRecordingStatus {
  readonly active: boolean;
  readonly reservationId?: string;
  readonly startedAt?: number;
  readonly sampleRateHz: number;
}

interface RecordingSession {
  readonly reservationId: string;
  readonly startedAt: number;
  samples: RecordedTelemetrySample[];
  nextDueTs: number;
}

const MS_PER_SECOND: number = 1000;

@Injectable()
export class TelemetryRecorderService {
  private readonly _logger: Logger = new Logger(TelemetryRecorderService.name);
  private readonly _intervalMs: number;
  private _session: RecordingSession | undefined;
  private _timer: ReturnType<typeof setInterval> | undefined;

  public constructor(
    @Inject(VENTILATOR_TELEMETRY_SETTINGS_TOKEN)
    private readonly _settings: VentilatorTelemetrySettings,
    @Inject(TELEMETRY_CHUNKS_REPOSITORY_TOKEN)
    private readonly _chunksRepository: ITelemetryChunksRepository,
    @Inject(TELEMETRY_CHUNK_CODEC_TOKEN)
    private readonly _codec: ITelemetryChunkCodec,
    @Inject(TELEMETRY_CLOCK_TOKEN)
    private readonly _clock: ITelemetryClock,
  ) {
    this._intervalMs = MS_PER_SECOND / _settings.recordingHz;
  }

  public get status(): TelemetryRecordingStatus {
    const session: RecordingSession | undefined = this._session;

    return session
      ? { active: true, reservationId: session.reservationId, startedAt: session.startedAt, sampleRateHz: this._settings.recordingHz }
      : { active: false, sampleRateHz: this._settings.recordingHz };
  }

  public start(reservationId: string): TelemetryRecordingStatus {
    if (this._session?.reservationId === reservationId) {
      return this.status;
    }

    this.stop();

    this._session = { reservationId, startedAt: this._clock.now(), samples: [], nextDueTs: 0 };
    this._timer = setInterval((): void => this.flushChunk(), this._settings.recordingFlushSeconds * MS_PER_SECOND);
    this._timer.unref();

    this._logger.log(`Telemetry recording started for reservation ${reservationId}`);

    return this.status;
  }

  public stop(): TelemetryRecordingStatus {
    const session: RecordingSession | undefined = this._session;

    if (!session) {
      return this.status;
    }

    this.flushChunk();

    if (this._timer !== undefined) {
      clearInterval(this._timer);
      this._timer = undefined;
    }

    this._session = undefined;

    this._logger.log(`Telemetry recording stopped for reservation ${session.reservationId}`);

    return this.status;
  }

  public stopUnlessReservation(activeReservationId: string | undefined): void {
    if (this._session && this._session.reservationId !== activeReservationId) {
      this.stop();
    }
  }

  public offer(frame: TelemetryFrame): void {
    const session: RecordingSession | undefined = this._session;

    if (!session || frame.serverTs < session.nextDueTs) {
      return;
    }

    session.samples.push(toRecordedSample(frame));

    const next: number = session.nextDueTs + this._intervalMs;

    session.nextDueTs = next > frame.serverTs ? next : frame.serverTs + this._intervalMs;
  }

  public flushChunk(): void {
    const session: RecordingSession | undefined = this._session;

    if (!session || session.samples.length === 0) {
      return;
    }

    const samples: RecordedTelemetrySample[] = session.samples;

    session.samples = [];

    this._persist(session.reservationId, samples).catch((error: unknown): void => {
      this._logger.error(`Saving a telemetry chunk for reservation ${session.reservationId} failed: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  private async _persist(reservationId: string, samples: RecordedTelemetrySample[]): Promise<void> {
    const data: Buffer = await this._codec.encode(samples);

    await this._chunksRepository.save(createTelemetryChunk({
      reservationId,
      samples,
      sampleRateHz: this._settings.recordingHz,
      encoding: this._codec.encoding,
      data,
      createdAt: new Date(this._clock.now()),
    }));
  }
}
