/*
 * Funcionalidad: Pruebas del asesor determinista de la simulación
 * Descripción: Verifica que cada regla (presión meseta, presión de distensión, auto-PEEP, SpO2, PaCO2 y pH, volumen corriente por kg, alarmas de presión alta, volumen bajo, desconexión y apnea en PSV/CPAP) se active solo con su condición, que el texto explique qué revisar y por qué en español e inglés, y que la salida sea estable
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AssistSnapshotInput } from "./assist-snapshot";
import { AssistInputOverrides, buildAssistInput } from "./assist-test-input-spec";
import { adviseDeterministically, AssistFinding, AssistFindingCode, detectAssistFindings } from "./deterministic-assist-advisor";

function codes(overrides: AssistInputOverrides): AssistFindingCode[] {
  return detectAssistFindings(buildAssistInput(overrides)).map((finding: AssistFinding): AssistFindingCode => finding.code);
}

describe("detectAssistFindings", () => {
  it("finds nothing for a patient within every limit", () => {
    const input: AssistSnapshotInput = buildAssistInput();

    const findings: AssistFinding[] = detectAssistFindings(input);

    expect(findings).toEqual([]);
  });

  it.each<[string, AssistInputOverrides, AssistFindingCode]>([
    ["plateau pressure above 30", { cycle: { plateauPressureCmH2O: 33 } }, "HIGH_PLATEAU_PRESSURE"],
    ["driving pressure above 15", { cycle: { drivingPressureCmH2O: 18 } }, "HIGH_DRIVING_PRESSURE"],
    ["significant auto-PEEP", { cycle: { autoPeepCmH2O: 4 } }, "AUTO_PEEP"],
    ["SpO2 below the default minimum", { gas: { spo2Percent: 86 } }, "LOW_SPO2"],
    ["high PaCO2", { gas: { paco2MmHg: 58, ph: 7.25 } }, "HYPERCAPNIA_OR_ACIDOSIS"],
    ["low pH with normal PaCO2", { gas: { ph: 7.28 } }, "HYPERCAPNIA_OR_ACIDOSIS"],
    ["low PaCO2", { gas: { paco2MmHg: 28, ph: 7.52 } }, "HYPOCAPNIA"],
    ["tidal volume above 8 mL/kg PBW", { cycle: { tidalVolumePerKgPbw: 9.5 } }, "HIGH_TIDAL_VOLUME_PER_KG"],
    ["a high pressure alarm", { alarms: [{ code: "HIGH_PRESSURE", severity: "HIGH", value: 45, threshold: 40 }] }, "HIGH_PRESSURE_ALARM"],
    ["a low tidal volume alarm", { cycle: { tidalVolumePerKgPbw: 3.5 }, alarms: [{ code: "LOW_TIDAL_VOLUME", severity: "MEDIUM", value: 210, threshold: 4 }] }, "LOW_TIDAL_VOLUME"],
    ["a disconnection", { alarms: [{ code: "DISCONNECTION", severity: "HIGH", value: 1, threshold: 1 }] }, "DISCONNECTION"],
    ["apnea in PSV", { settings: { mode: "PSV" }, alarms: [{ code: "APNEA", severity: "HIGH", value: 25, threshold: 20 }] }, "APNEA_SPONTANEOUS_MODE"],
    ["apnea in CPAP", { settings: { mode: "CPAP" }, alarms: [{ code: "APNEA", severity: "HIGH", value: 25, threshold: 20 }] }, "APNEA_SPONTANEOUS_MODE"],
  ])("fires only its rule for %s", (_label: string, overrides: AssistInputOverrides, expected: AssistFindingCode) => {
    const found: AssistFindingCode[] = codes(overrides);

    expect(found).toEqual([expected]);
  });

  it("does not report apnea in a controlled mode as a spontaneous-mode problem", () => {
    const found: AssistFindingCode[] = codes({ settings: { mode: "VCV" }, alarms: [{ code: "APNEA", severity: "HIGH", value: 25, threshold: 20 }] });

    expect(found).toEqual([]);
  });

  it("uses the case targets when they are stricter or define the oxygenation range", () => {
    const found: AssistFindingCode[] = codes({
      gas: { spo2Percent: 91 },
      targets: [{ id: "SPO2", status: "UNMET", value: 91, min: 92, max: 96 }],
    });

    expect(found).toEqual(["LOW_SPO2"]);
  });

  it("keeps the lung-protective plateau limit even when the case target is looser", () => {
    const found: AssistFindingCode[] = codes({
      cycle: { plateauPressureCmH2O: 32 },
      targets: [{ id: "PLATEAU_PRESSURE", status: "MET", value: 32, min: null, max: 35 }],
    });

    expect(found).toEqual(["HIGH_PLATEAU_PRESSURE"]);
  });

  it("evaluates no breath-based rule before the first complete breath", () => {
    const found: AssistFindingCode[] = codes({ cycle: null });

    expect(found).toEqual([]);
  });
});

describe("adviseDeterministically", () => {
  it("says what is going well when nothing is wrong", () => {
    const input: AssistSnapshotInput = buildAssistInput({ targets: [{ id: "SPO2", status: "MET", value: 96, min: 92, max: 98 }] });

    const advice: string = adviseDeterministically(input, "es");

    expect(advice).toContain("Lo que va bien:");
    expect(advice).toContain("SpO2 dentro del objetivo del caso (96)");
    expect(advice).toContain("No se detectan problemas");
    expect(advice).not.toContain("Lo que conviene revisar:");
  });

  it("explains why to review the tidal volume when plateau pressure is high", () => {
    const input: AssistSnapshotInput = buildAssistInput({ cycle: { plateauPressureCmH2O: 33 } });

    const advice: string = adviseDeterministically(input, "es");

    expect(advice).toContain("Lo que conviene revisar:");
    expect(advice).toContain("Presión meseta de 33 cmH2O");
    expect(advice).toContain("ARDSNet");
    expect(advice).toContain("barotrauma");
  });

  it("mentions inspiratory flow for auto-PEEP only in volume control", () => {
    const volume: string = adviseDeterministically(buildAssistInput({ cycle: { autoPeepCmH2O: 4 } }), "en");
    const pressure: string = adviseDeterministically(buildAssistInput({ settings: { mode: "PCV" }, cycle: { autoPeepCmH2O: 4 } }), "en");

    expect(volume).toContain("inspiratory flow");
    expect(pressure).not.toContain("inspiratory flow");
    expect(pressure).toContain("I:E ratio");
  });

  it("writes the guidance in English when asked", () => {
    const input: AssistSnapshotInput = buildAssistInput({ gas: { spo2Percent: 86 } });

    const advice: string = adviseDeterministically(input, "en");

    expect(advice).toContain("What to review:");
    expect(advice).toContain("Review FiO2 and PEEP.");
  });

  it("returns the same text for the same input", () => {
    const overrides: AssistInputOverrides = { cycle: { drivingPressureCmH2O: 18, autoPeepCmH2O: 3 }, gas: { paco2MmHg: 55 } };

    const first: string = adviseDeterministically(buildAssistInput(overrides), "es");
    const second: string = adviseDeterministically(buildAssistInput(overrides), "es");

    expect(second).toBe(first);
  });
});
