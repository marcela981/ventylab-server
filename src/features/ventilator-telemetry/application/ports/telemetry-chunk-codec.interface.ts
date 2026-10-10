/*
 * Funcionalidad: Puerto ITelemetryChunkCodec
 * Descripción: Codifica las muestras grabadas de telemetría en los bytes de un fragmento (gzip-json) y las decodifica al leer la grabación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type RecordedTelemetrySample } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-chunk";

export const TELEMETRY_CHUNK_CODEC_TOKEN: unique symbol = Symbol("TELEMETRY_CHUNK_CODEC_TOKEN");

export interface ITelemetryChunkCodec {
  readonly encoding: string;
  encode(samples: readonly RecordedTelemetrySample[]): Promise<Buffer>;
  decode(data: Buffer): Promise<RecordedTelemetrySample[]>;
}
