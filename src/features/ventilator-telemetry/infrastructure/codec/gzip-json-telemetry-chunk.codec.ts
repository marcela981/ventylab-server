/*
 * Funcionalidad: Códec gzip-json de fragmentos de telemetría
 * Descripción: Serializa las muestras grabadas como JSON comprimido con gzip (zlib asíncrono, fuera del hilo del camino caliente) y las recupera validando que el contenido sea una lista
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { promisify } from "util";
import { gunzip, gzip } from "zlib";

import { Injectable } from "@nestjs/common";

import { type ITelemetryChunkCodec } from "@/features/ventilator-telemetry/application/ports/telemetry-chunk-codec.interface";
import { type RecordedTelemetrySample } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-chunk";

const gzipAsync: (input: Buffer) => Promise<Buffer> = promisify(gzip);
const gunzipAsync: (input: Buffer) => Promise<Buffer> = promisify(gunzip);

export const GZIP_JSON_ENCODING: string = "gzip-json";

@Injectable()
export class GzipJsonTelemetryChunkCodec implements ITelemetryChunkCodec {
  public readonly encoding: string = GZIP_JSON_ENCODING;

  public async encode(samples: readonly RecordedTelemetrySample[]): Promise<Buffer> {
    return await gzipAsync(Buffer.from(JSON.stringify(samples), "utf-8"));
  }

  public async decode(data: Buffer): Promise<RecordedTelemetrySample[]> {
    const parsed: unknown = JSON.parse((await gunzipAsync(data)).toString("utf-8"));

    if (!Array.isArray(parsed)) {
      throw new Error("Telemetry chunk does not contain a sample list");
    }

    return parsed as RecordedTelemetrySample[];
  }
}
