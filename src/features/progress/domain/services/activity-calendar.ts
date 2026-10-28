/*
 * Funcionalidad: Calendario de actividad en America/Bogota
 * Descripción: Funciones puras que convierten un instante en el día calendario de America/Bogota (UTC−05:00 fijo, sin horario de verano), validan fechas ISO YYYY-MM-DD, suman días y cuentan los días de un rango; no dependen de la zona horaria del servidor
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

/** Calendar day in ISO format (YYYY-MM-DD). */
export type LocalDate = string;

export const ACTIVITY_TIME_ZONE: string = "America/Bogota";

const MS_PER_DAY: number = 24 * 60 * 60 * 1000;

// Colombia has kept UTC−05:00 without daylight saving time since 1993, so a fixed offset is exact and needs no tz database.
const BOGOTA_UTC_OFFSET_MS: number = -5 * 60 * 60 * 1000;

const LOCAL_DATE_PATTERN: RegExp = /^\d{4}-\d{2}-\d{2}$/;

const ISO_DATE_LENGTH: number = 10;

export function toBogotaLocalDate(instant: Date): LocalDate {
  return new Date(instant.getTime() + BOGOTA_UTC_OFFSET_MS).toISOString().slice(0, ISO_DATE_LENGTH);
}

export function isLocalDate(value: string): boolean {
  if (!LOCAL_DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed: Date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, ISO_DATE_LENGTH) === value;
}

/** UTC midnight of the calendar day: the value Prisma reads and writes for a DATE column. */
export function localDateToUtcMidnight(date: LocalDate): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function utcMidnightToLocalDate(date: Date): LocalDate {
  return date.toISOString().slice(0, ISO_DATE_LENGTH);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return utcMidnightToLocalDate(new Date(localDateToUtcMidnight(date).getTime() + days * MS_PER_DAY));
}

/** Number of calendar days from `from` to `to`, both included (0 when `to` is before `from`). */
export function countDaysInclusive(from: LocalDate, to: LocalDate): number {
  const days: number = Math.round((localDateToUtcMidnight(to).getTime() - localDateToUtcMidnight(from).getTime()) / MS_PER_DAY) + 1;

  return Math.max(0, days);
}
