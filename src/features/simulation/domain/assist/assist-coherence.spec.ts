/*
 * Funcionalidad: Pruebas del validador de coherencia de la IA del simulador
 * Descripción: Verifica que el validador detecta una respuesta que afirma estabilidad con el paciente crítico o con alarmas de prioridad alta (español e inglés), no confunde "inestable", las negaciones ni las acciones para estabilizar, detecta signos citados lejos del valor actual y acepta los que coinciden con el valor actual, con un punto de la tendencia o con un rango de objetivo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EngineMetrics } from "../engine";

import { type AssistCoherenceState, checkAssistCoherence } from "./assist-coherence";
import { buildAssistInput } from "./assist-test-input-spec";

function criticalState(): AssistCoherenceState {
  const base: EngineMetrics = buildAssistInput().metrics;
  const metrics: EngineMetrics = {
    ...base,
    gasExchange: { ...base.gasExchange, spo2Percent: 72.2, pao2MmHg: 38, paco2MmHg: 33.4, ph: 7.48 },
    hemodynamics: { ...base.hemodynamics, meanArterialPressureMmHg: 65.8, heartRateBpm: 107 },
    alarms: [{ code: "LOW_SPO2", severity: "HIGH", value: 72.2, threshold: 90 }],
    patient: { status: "CRITICAL", severity: 0.69, heartRateBpm: 107, insults: ["HYPOXEMIA"], criticalExposureMin: 0.1, firstCriticalAtMs: 65_000, arrestAtMs: null, deceasedAtMs: null },
  };

  return {
    metrics,
    trends: [{ simTimeMs: 1000, spo2Percent: 89.4, paco2MmHg: 40, ph: 7.4, mapMmHg: 76, heartRateBpm: 100, plateauPressureCmH2O: null, autoPeepCmH2O: null, status: "STABLE" }],
    targets: [{ id: "SPO2", status: "UNMET", value: 72.2, min: 88, max: 95 }],
  };
}

function stableState(): AssistCoherenceState {
  const base: EngineMetrics = buildAssistInput().metrics;

  return { metrics: { ...base, alarms: [], patient: { status: "STABLE", severity: 0.1, heartRateBpm: 80, insults: [], criticalExposureMin: 0, firstCriticalAtMs: null, arrestAtMs: null, deceasedAtMs: null } } };
}

describe("checkAssistCoherence", () => {
  it.each([
    "El paciente está estable, con la SpO2 en rango.",
    "El paciente se encuentra hemodinámicamente estable.",
    "pH y PaCO2 dentro de rangos normales.",
    "The patient remains stable on the current settings.",
  ])("detects a stability claim with a critical patient: %s", (answer: string) => {
    expect(checkAssistCoherence(answer, criticalState())).toMatchObject({ kind: "CLAIMS_STABLE" });
  });

  it.each([
    "El paciente está inestable y crítico: prioriza la oxigenación.",
    "El paciente no está estable: sube la PEEP para estabilizar la oxigenación.",
    "The patient is not stable yet; start by raising PEEP.",
  ])("accepts an answer that does not claim stability: %s", (answer: string) => {
    expect(checkAssistCoherence(answer, criticalState())).toBeUndefined();
  });

  it("accepts a stability statement when the patient really is stable", () => {
    expect(checkAssistCoherence("El paciente está estable.", stableState())).toBeUndefined();
  });

  it("detects a vital cited away from the current value", () => {
    expect(checkAssistCoherence("La SpO₂ en 89 % es aceptable para SDRA.", { ...criticalState(), trends: [] })).toMatchObject({ kind: "WRONG_VITAL" });
    expect(checkAssistCoherence("La PAM de 95 mmHg es adecuada.", criticalState())).toMatchObject({ kind: "WRONG_VITAL" });
  });

  it("accepts vitals that match the current value, a trend point or a target range", () => {
    const state: AssistCoherenceState = criticalState();

    expect(checkAssistCoherence("La SpO2 está en 72 % y la PAM en 66 mmHg.", state)).toBeUndefined();
    expect(checkAssistCoherence("La SpO2 bajó de 89 % a 72 % en un minuto.", state)).toBeUndefined();
    expect(checkAssistCoherence("El objetivo de SpO2 88-95 % no se cumple.", state)).toBeUndefined();
    expect(checkAssistCoherence("pH 7,48 con PaCO2 de 33 mmHg.", state)).toBeUndefined();
  });
});
