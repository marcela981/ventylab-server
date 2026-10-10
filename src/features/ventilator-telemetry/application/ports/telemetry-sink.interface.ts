/*
 * Funcionalidad: Puerto ITelemetrySink
 * Descripción: Destino opcional de las tramas de telemetría (InfluxDB cuando INFLUXDB_* está configurado) alimentado por los oyentes de tramas; escribe sin bloquear y se cierra al apagar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type TelemetryFrame } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-frame";

export const TELEMETRY_SINK_TOKEN: unique symbol = Symbol("TELEMETRY_SINK_TOKEN");

export interface ITelemetrySink {
  readonly isEnabled: boolean;
  write(frame: TelemetryFrame): void;
  close(): Promise<void>;
}
