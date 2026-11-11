/*
 * Funcionalidad: Destino InfluxDB de la telemetría
 * Descripción: Escribe cada trama de telemetría como punto de la medición telemetry en InfluxDB con escritura por lotes (cada 500 ms o 200 puntos) y la cierra al apagar; la variante deshabilitada no escribe cuando faltan las variables INFLUXDB_*. v1.1: el instante del punto es la hora de recepción del servidor (serverTs) en microsegundos con un ordinal creciente dentro del mismo milisegundo, para que dos tramas del mismo milisegundo no se sobrescriban; el reloj del dispositivo nunca ordena los puntos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InfluxDB, Point, type WriteApi } from "@influxdata/influxdb-client";
import { Logger } from "@nestjs/common";

import { type ITelemetrySink } from "@/features/ventilator-telemetry/application/ports/telemetry-sink.interface";
import { type TelemetryFrame } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-frame";
import { type InfluxSettings } from "@/features/ventilator-telemetry/infrastructure/config/ventilator-telemetry-config";

const FLUSH_INTERVAL_MS: number = 500;
const BATCH_SIZE: number = 200;
const MEASUREMENT: string = "telemetry";
const SOURCE_TAG: string = "ventylab-server";
const MICROS_PER_MS: number = 1000;

// Influx keys a point by measurement, tags and timestamp, so frames received in the same millisecond need distinct
// timestamps: serverTs is written in microseconds plus a per-process ordinal that grows while the millisecond repeats.
export class SubMillisecondTimestamps {
  private _lastMs: number | undefined;
  private _ordinal: number = 0;

  public next(serverTs: number): number {
    const ms: number = Math.trunc(serverTs);

    this._ordinal = ms === this._lastMs ? Math.min(this._ordinal + 1, MICROS_PER_MS - 1) : 0;
    this._lastMs = ms;

    return ms * MICROS_PER_MS + this._ordinal;
  }
}

export class InfluxTelemetrySink implements ITelemetrySink {
  public readonly isEnabled: boolean = true;
  private readonly _logger: Logger = new Logger(InfluxTelemetrySink.name);
  private readonly _writeApi: WriteApi;
  private readonly _timestamps: SubMillisecondTimestamps = new SubMillisecondTimestamps();

  public constructor(settings: InfluxSettings) {
    const client: InfluxDB = new InfluxDB({ url: settings.url, token: settings.token });

    this._writeApi = client.getWriteApi(settings.org, settings.bucket, "us", {
      flushInterval: FLUSH_INTERVAL_MS,
      batchSize: BATCH_SIZE,
    });

    this._writeApi.useDefaultTags({ source: SOURCE_TAG });
  }

  public write(frame: TelemetryFrame): void {
    const point: Point = new Point(MEASUREMENT)
      .tag("deviceId", frame.deviceId)
      .floatField("pressure", frame.pressure)
      .floatField("flow", frame.flow)
      .floatField("volume", frame.volume)
      .timestamp(this._timestamps.next(frame.serverTs));

    if (frame.pco2 !== undefined) {
      point.floatField("pco2", frame.pco2);
    }

    if (frame.spo2 !== undefined) {
      point.floatField("spo2", frame.spo2);
    }

    this._writeApi.writePoint(point);
  }

  public async close(): Promise<void> {
    try {
      await this._writeApi.close();
    } catch (error: unknown) {
      this._logger.error(`Error closing WriteApi: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export class DisabledTelemetrySink implements ITelemetrySink {
  public readonly isEnabled: boolean = false;

  public write(_frame: TelemetryFrame): void {
    return;
  }

  public async close(): Promise<void> {
    return await Promise.resolve();
  }
}
