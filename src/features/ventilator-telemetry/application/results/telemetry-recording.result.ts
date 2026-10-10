/*
 * Funcionalidad: Resultado de la grabación de telemetría
 * Descripción: Tramas decodificadas y ordenadas por tiempo de la grabación de una reserva
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type RecordedTelemetrySample } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-chunk";

export interface TelemetryRecordingResult {
  readonly reservationId: string;
  readonly sampleRateHz: number | undefined;
  readonly chunkCount: number;
  readonly frames: readonly RecordedTelemetrySample[];
}
