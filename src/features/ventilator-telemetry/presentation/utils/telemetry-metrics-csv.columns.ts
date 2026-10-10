/*
 * Funcionalidad: Columnas CSV de métricas de telemetría
 * Descripción: Fila y orden de columnas (kind, valueMs, recordedAt) del CSV con cada muestra de latencia retenida
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface TelemetryMetricCsvRow {
  readonly kind: string;
  readonly valueMs: number;
  readonly recordedAt: string;
}

export const TELEMETRY_METRIC_CSV_COLUMNS: readonly (keyof TelemetryMetricCsvRow)[] = ["kind", "valueMs", "recordedAt"] as const;

export const TELEMETRY_METRICS_CSV_FILENAME: string = "ventilator-telemetry-metrics.csv";
