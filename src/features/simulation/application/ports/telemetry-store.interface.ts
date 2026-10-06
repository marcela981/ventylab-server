/*
 * Funcionalidad: Puerto ITelemetryStore
 * Descripción: Contrato del almacén de series de tiempo para la telemetría del ventilador (escritura por lotes y cierre con vaciado de pendientes)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type TelemetrySample } from "@/features/simulation/domain/value-objects/ventilator-telemetry";

export const TELEMETRY_STORE_TOKEN: unique symbol = Symbol("TELEMETRY_STORE_TOKEN");

export interface ITelemetryStore {
  readonly isEnabled: boolean;
  write(sample: TelemetrySample): void;
  close(): Promise<void>;
}
