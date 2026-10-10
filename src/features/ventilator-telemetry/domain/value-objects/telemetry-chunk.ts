/*
 * Funcionalidad: Fragmento grabado de telemetría
 * Descripción: Registro inmutable TelemetryChunk (reserva, intervalo, número de muestras, frecuencia de muestreo, codificación y bytes) y la muestra submuestreada RecordedTelemetrySample que se guarda durante una grabación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { generateId } from "@/common/domain/utils/generate-id";
import { type TelemetryFrame } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-frame";

export interface RecordedTelemetrySample {
  serverTs: number;
  deviceTs?: number;
  seq?: number;
  pressure: number;
  flow: number;
  volume: number;
  pco2?: number;
  spo2?: number;
}

export interface TelemetryChunk {
  readonly id: string;
  readonly reservationId: string;
  readonly startTs: Date;
  readonly endTs: Date;
  readonly sampleCount: number;
  readonly sampleRateHz: number;
  readonly encoding: string;
  readonly data: Buffer;
  readonly createdAt: Date;
}

export function toRecordedSample(frame: TelemetryFrame): RecordedTelemetrySample {
  const sample: RecordedTelemetrySample = { serverTs: frame.serverTs, pressure: frame.pressure, flow: frame.flow, volume: frame.volume };

  if (frame.deviceTs !== undefined) {
    sample.deviceTs = frame.deviceTs;
  }

  if (frame.seq !== undefined) {
    sample.seq = frame.seq;
  }

  if (frame.pco2 !== undefined) {
    sample.pco2 = frame.pco2;
  }

  if (frame.spo2 !== undefined) {
    sample.spo2 = frame.spo2;
  }

  return sample;
}

export function createTelemetryChunk({
  reservationId,
  samples,
  sampleRateHz,
  encoding,
  data,
  createdAt,
}: {
  reservationId: string;
  samples: readonly RecordedTelemetrySample[];
  sampleRateHz: number;
  encoding: string;
  data: Buffer;
  createdAt: Date;
}): TelemetryChunk {
  return {
    id: generateId(),
    reservationId,
    startTs: new Date(samples[0].serverTs),
    endTs: new Date(samples[samples.length - 1].serverTs),
    sampleCount: samples.length,
    sampleRateHz,
    encoding,
    data,
    createdAt,
  };
}
