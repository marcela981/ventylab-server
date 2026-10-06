/*
 * Funcionalidad: Almacén InfluxDB de telemetría
 * Descripción: Implementa ITelemetryStore con el SDK oficial de InfluxDB v2: escritura por lotes (500 ms o 200 puntos) de puntos `telemetry` con etiqueta deviceId y campos presión, flujo, volumen y pco2/spo2 opcionales; vacía pendientes al cerrar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InfluxDB, Point, type WriteApi } from "@influxdata/influxdb-client";
import { Logger } from "@nestjs/common";

import { type ITelemetryStore } from "@/features/simulation/application/ports/telemetry-store.interface";
import { type TelemetrySample } from "@/features/simulation/domain/value-objects/ventilator-telemetry";
import { type InfluxSettings } from "@/features/simulation/infrastructure/config/simulation-config";

const FLUSH_INTERVAL_MS: number = 500;
const BATCH_SIZE: number = 200;
const MEASUREMENT: string = "telemetry";
const SOURCE_TAG: string = "ventylab-server";

export class InfluxTelemetryStore implements ITelemetryStore {
  public readonly isEnabled: boolean = true;
  private readonly _logger: Logger = new Logger(InfluxTelemetryStore.name);
  private readonly _writeApi: WriteApi;

  public constructor(settings: InfluxSettings) {
    const client: InfluxDB = new InfluxDB({ url: settings.url, token: settings.token });

    this._writeApi = client.getWriteApi(settings.org, settings.bucket, "ms", {
      flushInterval: FLUSH_INTERVAL_MS,
      batchSize: BATCH_SIZE,
    });

    this._writeApi.useDefaultTags({ source: SOURCE_TAG });
  }

  public write(sample: TelemetrySample): void {
    const point: Point = new Point(MEASUREMENT)
      .tag("deviceId", sample.deviceId)
      .floatField("pressure", sample.pressure)
      .floatField("flow", sample.flow)
      .floatField("volume", sample.volume)
      .timestamp(sample.timestamp);

    if (sample.pco2 !== undefined) {
      point.floatField("pco2", sample.pco2);
    }

    if (sample.spo2 !== undefined) {
      point.floatField("spo2", sample.spo2);
    }

    this._writeApi.writePoint(point);
  }

  public async close(): Promise<void> {
    try {
      await this._writeApi.close();
    } catch (error) {
      this._logger.error(`Error closing WriteApi: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
