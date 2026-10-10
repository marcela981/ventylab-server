/*
 * Funcionalidad: Pruebas de eventos, modos y alarmas del motor fisiológico
 * Descripción: Verifica el rechazo de cambios de parámetros fuera de los límites del ventilador, la aplicación de eventos del caso en su instante, el disparo de alarmas, el comportamiento de PSV, CPAP y SIMV con esfuerzo del paciente y el búfer de ondas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { buildTestCase } from "./engine-test-cases-spec";
import { EngineValidationError } from "./engine.errors";
import { Alarm, AlarmCode, EngineCase, EngineMetrics, EngineState, VentilatorSettings, WaveformBatch } from "./engine.types";
import { applyEvent, createSimulation, getMetrics, getWaveformBuffer, replay, step } from "./simulation";

function alarmCodes(metrics: EngineMetrics): AlarmCode[] {
  return metrics.alarms.map((alarm: Alarm): AlarmCode => alarm.code);
}

function captureError(action: () => void): unknown {
  try {
    action();
  } catch (error: unknown) {
    return error;
  }

  return undefined;
}

describe("engine events", () => {
  it("rejects a PARAM_CHANGE outside the ventilator limits and keeps the previous settings", () => {
    const state: EngineState = createSimulation(buildTestCase(), 1, { noise: false });
    const before: VentilatorSettings = state.settings;

    const error: unknown = captureError(() =>
      applyEvent(state, { type: "PARAM_CHANGE", simTimeMs: 0, changes: { peepCmH2O: 30 } }),
    );

    expect(error).toBeInstanceOf(EngineValidationError);
    expect((error as EngineValidationError).code).toBe("OUT_OF_RANGE");
    expect((error as EngineValidationError).field).toBe("peepCmH2O");
    expect(state.settings).toBe(before);
  });

  it("rejects a PARAM_CHANGE that leaves no expiratory time", () => {
    const state: EngineState = createSimulation(buildTestCase(), 1, { noise: false });

    const error: unknown = captureError(() =>
      applyEvent(state, {
        type: "PARAM_CHANGE",
        simTimeMs: 0,
        changes: { respiratoryRateBpm: 40, inspiratoryTimeS: 1.4 },
      }),
    );

    expect((error as EngineValidationError).code).toBe("INVALID_TIMING");
  });

  it("applies a valid PARAM_CHANGE to the following breaths", () => {
    const state: EngineState = createSimulation(buildTestCase(), 1, { noise: false });

    applyEvent(state, { type: "PARAM_CHANGE", simTimeMs: 0, changes: { peepCmH2O: 10 } });
    step(state, 20001);

    expect(getMetrics(state).lastCycle?.totalPeepCmH2O ?? 0).toBeCloseTo(10, 1);
  });

  it("applies a scheduled case event exactly at its simulated time", () => {
    const state: EngineState = createSimulation(
      buildTestCase({ events: [{ simTimeMs: 10000, type: "BRONCHOSPASM", resistanceFactor: 3 }] }),
      1,
      { noise: false },
    );

    step(state, 10000);
    const before: EngineMetrics = getMetrics(state);
    step(state, 1);
    const after: EngineMetrics = getMetrics(state);

    expect(before.conditions.resistanceCmH2OPerLps).toBe(10);
    expect(before.conditions.appliedCaseEvents).toHaveLength(0);
    expect(after.conditions.resistanceCmH2OPerLps).toBe(30);
    expect(after.conditions.appliedCaseEvents).toEqual([{ type: "BRONCHOSPASM", scheduledAtMs: 10000, appliedAtMs: 10000 }]);
  });

  it("raises the high pressure alarm on a stiff lung", () => {
    const engineCase: EngineCase = buildTestCase({ mechanics: { complianceMlPerCmH2O: 15 } });

    const metrics: EngineMetrics = replay(engineCase, 1, [], 15000, { noise: false }).final;

    expect(alarmCodes(metrics)).toContain("HIGH_PRESSURE");
    expect(metrics.lastCycle?.plateauPressureCmH2O ?? 0).toBeGreaterThan(35);
  });

  it("raises disconnection and low tidal volume alarms and desaturates after a disconnection", () => {
    const engineCase: EngineCase = buildTestCase({
      events: [{ simTimeMs: 10000, type: "DISCONNECTION" }],
    });

    const connected: EngineMetrics = replay(engineCase, 1, [], 9000, { noise: false }).final;
    const disconnected: EngineMetrics = replay(engineCase, 1, [], 70000, { noise: false }).final;

    expect(alarmCodes(connected)).not.toContain("DISCONNECTION");
    expect(alarmCodes(disconnected)).toEqual(expect.arrayContaining(["DISCONNECTION", "LOW_TIDAL_VOLUME"]));
    expect(disconnected.gasExchange.spo2Percent).toBeLessThan(connected.gasExchange.spo2Percent - 5);
  });

  it("clears the disconnection with a RECONNECT event", () => {
    const engineCase: EngineCase = buildTestCase({
      events: [{ simTimeMs: 10000, type: "DISCONNECTION" }],
    });

    const metrics: EngineMetrics = replay(engineCase, 1, [{ type: "RECONNECT", simTimeMs: 20000 }], 40000, {
      noise: false,
    }).final;

    expect(alarmCodes(metrics)).not.toContain("DISCONNECTION");
    expect(metrics.lastCycle?.exhaledTidalVolumeMl ?? 0).toBeGreaterThan(450);
  });

  it("raises the apnea alarm in CPAP without patient effort", () => {
    const engineCase: EngineCase = buildTestCase({ settings: { mode: "CPAP" } });

    const early: EngineMetrics = replay(engineCase, 1, [], 10000, { noise: false }).final;
    const late: EngineMetrics = replay(engineCase, 1, [], 21000, { noise: false }).final;

    expect(alarmCodes(early)).not.toContain("APNEA");
    expect(alarmCodes(late)).toContain("APNEA");
  });

  it("raises the auto-PEEP alarm with air trapping", () => {
    const engineCase: EngineCase = buildTestCase({
      mechanics: { resistanceCmH2OPerLps: 30 },
      settings: { respiratoryRateBpm: 30, inspiratoryTimeS: 0.8 },
    });

    const metrics: EngineMetrics = replay(engineCase, 1, [], 30000, { noise: false }).final;

    expect(alarmCodes(metrics)).toContain("AUTO_PEEP");
  });
});

describe("engine patient evolution", () => {
  it("deteriorates while a target is unmet, faster with a higher time multiplier, and not when targets are met", () => {
    const unmetCase: EngineCase = buildTestCase({
      deterioration: { ratePerMin: 0.1 },
      targets: { spo2Percent: { min: 99.9, max: 100 } },
    });
    const metCase: EngineCase = buildTestCase({
      deterioration: { ratePerMin: 0.1 },
      targets: { spo2Percent: { min: 80, max: 100 } },
    });

    const realTime: EngineMetrics = replay(unmetCase, 1, [], 60000, { noise: false }).final;
    const accelerated: EngineMetrics = replay(unmetCase, 1, [], 60000, { noise: false, timeMultiplier: 4 }).final;
    const stable: EngineMetrics = replay(metCase, 1, [], 60000, { noise: false }).final;

    expect(realTime.conditions.deteriorationLevel).toBeCloseTo(0.1, 2);
    expect(accelerated.conditions.deteriorationLevel).toBeCloseTo(0.4, 2);
    expect(realTime.conditions.complianceMlPerCmH2O).toBeLessThan(50);
    expect(stable.conditions.deteriorationLevel).toBe(0);
    expect(stable.targets).toEqual([{ id: "SPO2", status: "MET", value: stable.gasExchange.spo2Percent, min: 80, max: 100 }]);
  });
});

describe("engine modes with patient effort", () => {
  const effort: { amplitudeCmH2O: number; rateBpm: number; inspiratoryFraction: number } = {
    amplitudeCmH2O: 6,
    rateBpm: 20,
    inspiratoryFraction: 0.35,
  };

  it("triggers and flow-cycles pressure-supported breaths in PSV at the patient's rate", () => {
    const engineCase: EngineCase = buildTestCase({ effort, settings: { mode: "PSV" } });

    const metrics: EngineMetrics = replay(engineCase, 3, [], 90000, { noise: false }).final;

    expect(metrics.lastCycle?.breathType).toBe("SPONTANEOUS");
    expect(metrics.lastCycle?.triggered).toBe(true);
    expect(metrics.ventilation.totalRespiratoryRateBpm).toBeGreaterThan(18);
    expect(metrics.ventilation.totalRespiratoryRateBpm).toBeLessThan(22);
    expect(metrics.lastCycle?.peakPressureCmH2O ?? 0).toBeCloseTo(15, 0);
    expect(metrics.lastCycle?.exhaledTidalVolumeMl ?? 0).toBeGreaterThan(300);
  });

  it("delivers backup breaths in PSV when the patient is apneic", () => {
    const engineCase: EngineCase = buildTestCase({ settings: { mode: "PSV" } });

    const metrics: EngineMetrics = replay(engineCase, 1, [], 60000, { noise: false }).final;

    expect(metrics.lastCycle?.breathType).toBe("MANDATORY");
    expect(alarmCodes(metrics)).toContain("APNEA");
  });

  it("lets the patient breathe at the set PEEP in CPAP", () => {
    const engineCase: EngineCase = buildTestCase({ effort, settings: { mode: "CPAP" } });

    const metrics: EngineMetrics = replay(engineCase, 3, [], 60000, { noise: false }).final;

    expect(metrics.lastCycle?.breathType).toBe("SPONTANEOUS");
    expect(metrics.lastCycle?.peakPressureCmH2O ?? 0).toBeCloseTo(5, 5);
    expect(metrics.lastCycle?.exhaledTidalVolumeMl ?? 0).toBeGreaterThan(100);
  });

  it("mixes mandatory breaths at the set rate with spontaneous breaths in SIMV", () => {
    const engineCase: EngineCase = buildTestCase({
      effort,
      settings: { mode: "SIMV", respiratoryRateBpm: 8, pressureSupportCmH2O: 8 },
    });

    const metrics: EngineMetrics = replay(engineCase, 3, [], 90000, { noise: false }).final;

    expect(metrics.ventilation.mandatoryRateBpm).toBeGreaterThan(7);
    expect(metrics.ventilation.mandatoryRateBpm).toBeLessThan(9);
    expect(metrics.ventilation.spontaneousRateBpm).toBeGreaterThan(5);
  });
});

describe("engine waveform buffer", () => {
  it("returns the samples produced since the previous call at the configured rate", () => {
    const state: EngineState = createSimulation(buildTestCase(), 1, { noise: false, sampleRateHz: 50 });

    step(state, 1000);
    const first: WaveformBatch = getWaveformBuffer(state);
    const second: WaveformBatch = getWaveformBuffer(state);

    expect(first.samples).toHaveLength(50);
    expect(first.samples[49].simTimeMs).toBe(1000);
    expect(second.samples).toHaveLength(0);
  });

  it("keeps only the newest samples and reports the dropped ones when the ring buffer overflows", () => {
    const state: EngineState = createSimulation(buildTestCase(), 1, { noise: false, waveformCapacity: 10 });

    step(state, 1000);
    const batch: WaveformBatch = getWaveformBuffer(state);

    expect(batch.samples).toHaveLength(10);
    expect(batch.droppedSamples).toBe(40);
    expect(batch.samples[9].simTimeMs).toBe(1000);
  });
});
