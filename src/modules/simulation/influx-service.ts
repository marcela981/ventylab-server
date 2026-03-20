/**
 * @module InfluxTelemetryService
 * @description Servicio de escritura rápida de telemetría en InfluxDB.
 * Recibe objetos TelemetryPayload (presión, flujo, volumen) parseados
 * desde MQTT y los persiste como series de tiempo usando el SDK oficial
 * de InfluxDB para Node.js con escritura por lotes (batched writes).
 *
 * Responsabilidades:
 * - Convertir cada TelemetryPayload en un Point de InfluxDB
 * - Escribir con batching eficiente (flushInterval + batchSize)
 * - Cerrar el WriteApi limpiamente en shutdown (flush pendientes)
 *
 * NO usa PostgreSQL ni Prisma — esto es exclusivo para datos de sensores.
 */

import { InfluxDB, Point } from '@influxdata/influxdb-client';
import type { WriteApi } from '@influxdata/influxdb-client';
import type { TelemetryPayload } from './mqtt-client';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface InfluxServiceOptions {
  /** InfluxDB server URL (e.g. http://localhost:8086) */
  url: string;
  /** API token with write permissions to the target bucket */
  token: string;
  /** InfluxDB organisation name */
  org: string;
  /** Target bucket for telemetry data */
  bucket: string;
  /** Flush interval in milliseconds (default: 500) */
  flushInterval?: number;
  /** Max batch size before auto-flush (default: 200) */
  batchSize?: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class InfluxTelemetryService {
  private readonly writeApi: WriteApi;

  constructor(private readonly options: InfluxServiceOptions) {
    const client = new InfluxDB({
      url: options.url,
      token: options.token,
    });

    this.writeApi = client.getWriteApi(
      options.org,
      options.bucket,
      'ms',
      {
        flushInterval: options.flushInterval ?? 500,
        batchSize: options.batchSize ?? 200,
        // Retry defaults from the SDK are fine (max 5 retries, exp backoff)
      },
    );

    // Default tags applied to every point written through this API
    this.writeApi.useDefaultTags({ source: 'ventylab-server' });

    console.log(
      `[InfluxTelemetryService] Initialized → ${options.url} / org="${options.org}" / bucket="${options.bucket}"`,
    );
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Convierte un TelemetryPayload en un Point de InfluxDB y lo encola
   * para escritura por lotes.  El SDK se encarga del flush automático
   * según flushInterval / batchSize.
   *
   * @param payload - Objeto de telemetría parseado desde MQTT
   */
  writeTelemetry(payload: TelemetryPayload): void {
    const point = new Point('telemetry')
      .tag('deviceId', payload.deviceId)
      .floatField('pressure', payload.pressure)
      .floatField('flow', payload.flow)
      .floatField('volume', payload.volume)
      .timestamp(payload.timestamp);

    // Campos opcionales — solo se agregan si están presentes
    if (payload.pco2 !== undefined) {
      point.floatField('pco2', payload.pco2);
    }
    if (payload.spo2 !== undefined) {
      point.floatField('spo2', payload.spo2);
    }

    this.writeApi.writePoint(point);
  }

  /**
   * Cierra el WriteApi, forzando flush de todos los puntos pendientes.
   * Debe llamarse durante el graceful shutdown del servidor.
   */
  async close(): Promise<void> {
    try {
      await this.writeApi.close();
      console.log('[InfluxTelemetryService] WriteApi closed – all points flushed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[InfluxTelemetryService] Error closing WriteApi: ${msg}`);
    }
  }

  // -------------------------------------------------------------------------
  // Factory helper
  // -------------------------------------------------------------------------

  /**
   * Crea una instancia leyendo las variables de entorno estándar.
   * Retorna `null` si las variables requeridas no están definidas,
   * permitiendo que el servidor arranque sin InfluxDB.
   */
  static fromEnv(): InfluxTelemetryService | null {
    const url = process.env.INFLUXDB_URL;
    const token = process.env.INFLUXDB_TOKEN;
    const org = process.env.INFLUXDB_ORG;
    const bucket = process.env.INFLUXDB_BUCKET;

    if (!url || !token || !org || !bucket) {
      console.warn(
        '[InfluxTelemetryService] Missing env vars (INFLUXDB_URL, INFLUXDB_TOKEN, INFLUXDB_ORG, INFLUXDB_BUCKET) – InfluxDB writes disabled',
      );
      return null;
    }

    return new InfluxTelemetryService({ url, token, org, bucket });
  }
}
