/*
 * Funcionalidad: Rango de fechas de analítica
 * Descripción: Función pura que resuelve el rango de una consulta de actividad: fin por defecto el instante actual, inicio por defecto 30 días antes del fin, y rechaza con InvalidAnalyticsRangeError un rango que no empieza antes de terminar o abarca más de 366 días
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidAnalyticsRangeError } from "@/features/analytics/domain/analytics.errors";

const DAY_MS: number = 86_400_000;

export const DEFAULT_ANALYTICS_RANGE_DAYS: number = 30;

export const MAX_ANALYTICS_RANGE_DAYS: number = 366;

export interface AnalyticsRange {
  readonly from: Date;
  readonly to: Date;
}

export function resolveAnalyticsRange(from: Date | undefined, to: Date | undefined, now: Date): AnalyticsRange {
  const end: Date = to ?? now;
  const start: Date = from ?? new Date(end.getTime() - DEFAULT_ANALYTICS_RANGE_DAYS * DAY_MS);

  if (start.getTime() >= end.getTime() || end.getTime() - start.getTime() > MAX_ANALYTICS_RANGE_DAYS * DAY_MS) {
    throw new InvalidAnalyticsRangeError();
  }

  return { from: start, to: end };
}
