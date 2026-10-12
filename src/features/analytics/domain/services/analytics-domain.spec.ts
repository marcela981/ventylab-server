/*
 * Funcionalidad: Pruebas del dominio de analítica
 * Descripción: Verifica la resolución del rango (30 días por defecto, rechazo de rangos invertidos, vacíos o de más de 366 días) y la fusión de la línea de tiempo (orden descendente con desempate estable y recorte informado)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidAnalyticsRangeError } from "@/features/analytics/domain/analytics.errors";
import { type MergedTimeline, mergeTimeline, type TimelineEntry } from "@/features/analytics/domain/services/activity-timeline";
import { type AnalyticsRange, resolveAnalyticsRange } from "@/features/analytics/domain/services/analytics-range";

const NOW: Date = new Date("2026-10-11T12:00:00.000Z");
const DAY_MS: number = 86_400_000;

function entry(kind: TimelineEntry["kind"], referenceId: string, iso: string): TimelineEntry {
  return { kind, referenceId, occurredAt: new Date(iso) };
}

describe("resolveAnalyticsRange", () => {
  it("defaults to the 30 days before now", () => {
    const range: AnalyticsRange = resolveAnalyticsRange(undefined, undefined, NOW);

    expect(range).toEqual({ from: new Date(NOW.getTime() - 30 * DAY_MS), to: NOW });
  });

  it("rejects inverted, empty and longer than 366 days ranges", () => {
    expect(() => resolveAnalyticsRange(NOW, new Date(NOW.getTime() - 1), NOW)).toThrow(InvalidAnalyticsRangeError);
    expect(() => resolveAnalyticsRange(NOW, NOW, NOW)).toThrow(InvalidAnalyticsRangeError);
    expect(() => resolveAnalyticsRange(new Date(NOW.getTime() - 367 * DAY_MS), NOW, NOW)).toThrow(InvalidAnalyticsRangeError);
    expect(resolveAnalyticsRange(new Date(NOW.getTime() - 366 * DAY_MS), NOW, NOW).to).toEqual(NOW);
  });
});

describe("mergeTimeline", () => {
  it("sorts every source newest first with a stable tie-break and reports truncation", () => {
    const merged: MergedTimeline = mergeTimeline(
      [
        [entry("LESSON_COMPLETED", "lesson-1", "2026-10-02T00:00:00Z")],
        [entry("RESERVATION", "r-2", "2026-10-05T00:00:00Z"), entry("RESERVATION", "r-1", "2026-10-05T00:00:00Z")],
        [entry("EVALUATION_SUBMITTED", "e-1", "2026-10-05T00:00:00Z")],
      ],
      3,
    );

    expect(merged.entries.map((item: TimelineEntry) => item.referenceId)).toEqual(["e-1", "r-1", "r-2"]);
    expect(merged.truncated).toBe(true);
  });
});
