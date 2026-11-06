/*
 * Funcionalidad: Pruebas del estado actual para la asistencia de IA
 * Descripción: Verifica que el estado de SIM_ASSIST 1.3.0 y SIM_ALARM_HELP 1.1.0 lleva el tiempo simulado mm:ss, el estado y la gravedad con su etiqueta, las alarmas con prioridad, los signos, la mecánica del último ciclo y las pendientes de tendencia; que el recorte por estructura deja siempre un JSON válido sin perder alarmas, objetivos ni signos, y que el bloque del prompt de alarmas ya no corta el estado (antes se cortaba a 3000 caracteres)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { buildSimAlarmHelpPrompt } from "@/features/ai/domain/prompts/simulator-prompts";

import { type EngineMetrics } from "../engine";

import { type AssistParamChange } from "./assist-snapshot";
import { ASSIST_STATE_MAX_LENGTH, type AssistStateInput, buildAssistSlopes, buildAssistState, formatSimTime } from "./assist-state-snapshot";
import { buildAssistInput } from "./assist-test-input-spec";

function criticalInput(): AssistStateInput {
  const base: AssistStateInput = buildAssistInput({ alarms: [{ code: "LOW_SPO2", severity: "HIGH", value: 72.2, threshold: 90 }] });

  return {
    ...base,
    metrics: {
      ...base.metrics,
      simTimeMs: 76_200,
      patient: { status: "CRITICAL", severity: 0.69, heartRateBpm: 107, insults: ["HYPOXEMIA"], criticalExposureMin: 0.1, firstCriticalAtMs: 65_000, arrestAtMs: null, deceasedAtMs: null },
    },
    language: "es",
  };
}

function manyChanges(count: number): AssistParamChange[] {
  return Array.from({ length: count }, (_value: unknown, index: number): AssistParamChange => ({
    simTimeMs: index * 1000,
    changes: { peepCmH2O: 5 + (index % 10), fio2: 0.4 + index / 100, tidalVolumeMl: 400 + index, respiratoryRateBpm: 14 + (index % 6) },
    previous: { peepCmH2O: 5, fio2: 0.4, tidalVolumeMl: 400, respiratoryRateBpm: 14 },
  }));
}

describe("buildAssistState", () => {
  it("puts the current critical state first: time, patient, prioritized alarms, vitals and mechanics", () => {
    const state: Record<string, unknown> = JSON.parse(buildAssistState(criticalInput())) as Record<string, unknown>;

    expect(Object.keys(state).slice(0, 6)).toEqual(["simTime", "simTimeS", "patient", "alarms", "vitals", "ventilation"]);
    expect(state.simTime).toBe("01:16");
    expect(state.patient).toEqual({ status: "CRITICAL", statusLabel: "Crítico", severityPercent: 69, critical: true, insults: ["HYPOXEMIA"] });
    expect(state.alarms).toEqual([{ code: "LOW_SPO2", priority: "HIGH", value: 72.2, threshold: 90 }]);
    expect(state.vitals).toMatchObject({ spo2Percent: 96, pao2MmHg: 95, paco2MmHg: 40, ph: 7.4 });
    expect(state.ventilation).toMatchObject({ peakPressureCmH2O: 22, plateauPressureCmH2O: 18, drivingPressureCmH2O: 13, tidalVolumePerKgPbw: 6.5, ieRatio: 0.47 });
  });

  it("cuts by structure: always valid JSON within the limit, keeping alarms, targets and vitals", () => {
    const input: AssistStateInput = { ...criticalInput(), recentChanges: manyChanges(40), caseSummary: { ...criticalInput().caseSummary, summary: "x".repeat(600) } };
    const text: string = buildAssistState(input);
    const state: Record<string, unknown> = JSON.parse(text) as Record<string, unknown>;

    expect(text.length).toBeLessThanOrEqual(ASSIST_STATE_MAX_LENGTH);
    expect(state.alarms).toHaveLength(1);
    expect(state.targets).toEqual(expect.any(Array));
    expect(state.vitals).toBeDefined();
    // The oldest changes go first; the latest adjustments stay.
    expect((state.recentChanges as { atS: number }[]).at(-1)?.atS).toBe(39);
  });

  it("never lets the alarm help prompt cut the state, which the 1.0.0 block did at 3000 characters", () => {
    const monitorState: string = buildAssistState({ ...criticalInput(), recentChanges: manyChanges(10) });
    const prompt: string = buildSimAlarmHelpPrompt({ alarm: "LOW_SPO2", monitorState, rules: "1. Regla" }).messages[0].content;
    const legacy: string = buildSimAlarmHelpPrompt({ alarm: "LOW_SPO2", monitorState, rules: "1. Regla", promptVersion: "1.0.0" }).messages[0].content;

    expect(monitorState.length).toBeGreaterThan(3000);
    expect(prompt).toContain(monitorState);
    expect(legacy).not.toContain(monitorState);
  });
});

describe("buildAssistSlopes", () => {
  it("gives the SpO2, PaCO2 and MAP slope per simulated minute over the window", () => {
    const base: EngineMetrics = buildAssistInput().metrics;
    const timeline: EngineMetrics[] = [0, 30_000, 60_000].map((simTimeMs: number, index: number): EngineMetrics => ({
      ...base,
      simTimeMs,
      gasExchange: { ...base.gasExchange, spo2Percent: 90 - index * 5, paco2MmHg: 40 + index },
      hemodynamics: { ...base.hemodynamics, meanArterialPressureMmHg: 80 - index * 2 },
    }));

    expect(buildAssistSlopes(timeline)).toEqual({ windowMin: 5, spo2PerMin: -10, paco2PerMin: 2, mapPerMin: -4 });
    expect(buildAssistSlopes([]).spo2PerMin).toBeNull();
  });
});

describe("formatSimTime", () => {
  it("formats the simulated time as mm:ss", () => {
    expect(formatSimTime(0)).toBe("00:00");
    expect(formatSimTime(76_200)).toBe("01:16");
    expect(formatSimTime(3_725_000)).toBe("62:05");
  });
});
