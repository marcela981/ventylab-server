/*
 * Funcionalidad: Pruebas del calendario de actividad en America/Bogota
 * Descripción: Verifica el día de Bogotá en los bordes de medianoche local (23:59 frente a 00:01, que en UTC caen en el día siguiente), con instantes expresados en distintos desfases UTC, la validación de fechas ISO, la suma de días entre meses y años bisiestos y el conteo inclusivo de días de un rango
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  addDays,
  countDaysInclusive,
  isLocalDate,
  localDateToUtcMidnight,
  toBogotaLocalDate,
  utcMidnightToLocalDate,
} from "@/features/progress/domain/services/activity-calendar";

describe("toBogotaLocalDate", () => {
  it("keeps 23:59 Bogota on the same local day although it is already the next day in UTC", () => {
    expect(toBogotaLocalDate(new Date("2026-10-28T04:59:00.000Z"))).toBe("2026-10-27");
  });

  it("moves to the next local day at 00:01 Bogota", () => {
    expect(toBogotaLocalDate(new Date("2026-10-28T05:01:00.000Z"))).toBe("2026-10-28");
  });

  it("places exactly 00:00 Bogota on the new day", () => {
    expect(toBogotaLocalDate(new Date("2026-10-28T05:00:00.000Z"))).toBe("2026-10-28");
  });

  it("gives the same day for one instant written with different UTC offsets", () => {
    const instants: string[] = ["2026-03-01T04:30:00.000Z", "2026-02-28T23:30:00-05:00", "2026-03-01T06:30:00+02:00", "2026-02-28T20:30:00-08:00"];

    expect(instants.map((instant: string) => toBogotaLocalDate(new Date(instant)))).toEqual(["2026-02-28", "2026-02-28", "2026-02-28", "2026-02-28"]);
  });

  it("does not depend on the year boundary in UTC", () => {
    expect(toBogotaLocalDate(new Date("2027-01-01T03:00:00.000Z"))).toBe("2026-12-31");
  });
});

describe("isLocalDate", () => {
  it.each(["2026-10-28", "2024-02-29"])("accepts %s", (value: string) => {
    expect(isLocalDate(value)).toBe(true);
  });

  it.each(["2026-02-30", "2026-13-01", "2026-1-01", "28/10/2026", "", "2026-10-28T00:00:00Z"])("rejects %s", (value: string) => {
    expect(isLocalDate(value)).toBe(false);
  });
});

describe("calendar arithmetic", () => {
  it("adds and subtracts days across months, years and leap days", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("counts the days of a range with both ends included", () => {
    expect(countDaysInclusive("2026-10-28", "2026-10-28")).toBe(1);
    expect(countDaysInclusive("2026-01-01", "2026-12-31")).toBe(365);
    expect(countDaysInclusive("2026-10-29", "2026-10-28")).toBe(0);
  });

  it("round-trips a DATE column value", () => {
    expect(localDateToUtcMidnight("2026-10-28").toISOString()).toBe("2026-10-28T00:00:00.000Z");
    expect(utcMidnightToLocalDate(new Date("2026-10-28T00:00:00.000Z"))).toBe("2026-10-28");
  });
});
