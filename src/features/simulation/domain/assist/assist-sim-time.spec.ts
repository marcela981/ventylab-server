/*
 * Funcionalidad: Pruebas del tiempo simulado de la asistencia de IA
 * Descripción: Verifica la validación del tiempo simulado que envía la consola al pedir ayuda: se acepta entre el último evento guardado y la cota del reloj de pared, un retraso pequeño se ajusta al último evento, uno mayor se rechaza como no monótono, uno por delante de la cota o de la fecha límite del examen se rechaza y sin tiempo del cliente se estima con el reloj
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { SimulationEventTimeAheadError, SimulationEventTimeNotMonotonicError } from "../simulation.errors";

import { ASSIST_SIM_TIME_LAG_TOLERANCE_MS, type AssistSimTimeInput, resolveAssistSimTimeMs } from "./assist-sim-time";

const STARTED_AT: Date = new Date("2026-11-05T12:00:00Z");
// 20 s of wall time at ×4: up to 80 s simulated, plus the 5 s tolerance.
const BASE: AssistSimTimeInput = {
  lastSimTimeMs: 10_000,
  startedAt: STARTED_AT,
  now: new Date(STARTED_AT.getTime() + 20_000),
  timeMultiplier: 4,
  toleranceMs: 5_000,
};

describe("resolveAssistSimTimeMs", () => {
  it("accepts the console time between the last stored event and the wall-clock bound", () => {
    expect(resolveAssistSimTimeMs({ ...BASE, requestedMs: 76_200 })).toBe(76_200);
    expect(resolveAssistSimTimeMs({ ...BASE, requestedMs: 85_000 })).toBe(85_000);
  });

  it("refuses a non-monotonic time further behind the last event than the console refresh lag", () => {
    expect(resolveAssistSimTimeMs({ ...BASE, requestedMs: 10_000 - ASSIST_SIM_TIME_LAG_TOLERANCE_MS })).toBe(10_000);
    expect(() => resolveAssistSimTimeMs({ ...BASE, requestedMs: 10_000 - ASSIST_SIM_TIME_LAG_TOLERANCE_MS - 1 })).toThrow(SimulationEventTimeNotMonotonicError);
  });

  it("refuses a time above the bound of elapsed wall time × session multiplier + tolerance", () => {
    expect(() => resolveAssistSimTimeMs({ ...BASE, requestedMs: 85_001 })).toThrow(SimulationEventTimeAheadError);
  });

  it("refuses a time after the exam deadline even when the wall clock went past it", () => {
    const expiresAt: Date = new Date(STARTED_AT.getTime() + 10_000);
    const late: AssistSimTimeInput = { ...BASE, expiresAt };

    expect(resolveAssistSimTimeMs({ ...late, requestedMs: 45_000 })).toBe(45_000);
    expect(() => resolveAssistSimTimeMs({ ...late, requestedMs: 45_001 })).toThrow(SimulationEventTimeAheadError);
  });

  it("estimates the time from the wall clock for a client that sends none, never before the last event", () => {
    expect(resolveAssistSimTimeMs(BASE)).toBe(80_000);
    expect(resolveAssistSimTimeMs({ ...BASE, now: STARTED_AT })).toBe(10_000);
  });
});
