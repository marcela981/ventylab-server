/*
 * Funcionalidad: Puerto IProcessMetrics
 * Descripción: Contrato para leer las métricas del proceso Node (tiempo en marcha, memoria residente y heap usado, retardo del bucle de eventos)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const PROCESS_METRICS_TOKEN: unique symbol = Symbol("PROCESS_METRICS_TOKEN");

export interface ProcessMetricsSnapshot {
  readonly uptimeSeconds: number;
  readonly rssBytes: number;
  readonly heapUsedBytes: number;
  readonly eventLoopLagMs: number;
}

export interface IProcessMetrics {
  snapshot(): ProcessMetricsSnapshot;
}
