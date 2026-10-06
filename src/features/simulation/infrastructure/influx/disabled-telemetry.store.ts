/*
 * Funcionalidad: Almacén de telemetría deshabilitado
 * Descripción: Implementación nula de ITelemetryStore usada cuando faltan las variables INFLUXDB_*; el servidor arranca sin persistir telemetría
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ITelemetryStore } from "@/features/simulation/application/ports/telemetry-store.interface";
import { type TelemetrySample } from "@/features/simulation/domain/value-objects/ventilator-telemetry";

export class DisabledTelemetryStore implements ITelemetryStore {
  public readonly isEnabled: boolean = false;

  public write(_sample: TelemetrySample): void {
    return;
  }

  public async close(): Promise<void> {
    return await Promise.resolve();
  }
}
