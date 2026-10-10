/*
 * Funcionalidad: Pruebas de la resolución de la rúbrica de una sesión de simulación
 * Descripción: Verifica que la rúbrica por defecto de un caso clínico convierte los límites de seguridad con peso 0 y penalización en un único criterio SAFETY_VIOLATIONS y la asistencia de IA en AI_ASSIST_USAGE, que esas penalizaciones se califican de verdad, y que las rúbricas de comparación de parámetros de las preguntas se omiten
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ReplayResult } from "@/features/simulation/domain/engine";
import {
  computeSimulationScore,
  DEFAULT_SIMULATION_RUBRIC,
  type SimulationRubric,
  type SimulationRubricCriterion,
  type SimulationScore,
} from "@/features/simulation/domain/scoring";
import {
  AI_PENALIZED_USES_TO_ZERO,
  CASE_SAFETY_FALLBACK_WEIGHT,
  resolveSessionRubric,
  toSimulationRubric,
} from "@/features/simulation/domain/sessions/simulation-session-rubric";
import { SimulationRubricInvalidError } from "@/features/simulation/domain/simulation.errors";

const SEED_CASE_RUBRIC: Record<string, unknown> = {
  assistancePolicy: "ALLOWED_WITH_PENALTY",
  passingScore: 70,
  criteria: [
    { type: "TARGETS_REACHED", weight: 40, threshold: 1 },
    { type: "TIME_TO_STABILIZE", weight: 20, threshold: 600 },
    { type: "TIME_IN_RANGE", weight: 40, threshold: 80, windowMinutes: 5 },
    { type: "PLATEAU_PRESSURE_LIMIT", weight: 0, threshold: 30, penaltyPoints: 5 },
    { type: "DRIVING_PRESSURE_LIMIT", weight: 0, threshold: 15, penaltyPoints: 5 },
    { type: "TIDAL_VOLUME_LIMIT", weight: 0, threshold: 8, penaltyPoints: 5 },
    { type: "AUTO_PEEP_LIMIT", weight: 0, threshold: 4, penaltyPoints: 5 },
    { type: "AI_ASSIST_USAGE", weight: 0, threshold: 0, penaltyPoints: 5 },
  ],
};

function criterionOf(rubric: SimulationRubric, type: SimulationRubricCriterion["type"]): SimulationRubricCriterion | undefined {
  return rubric.criteria.find((criterion: SimulationRubricCriterion): boolean => criterion.type === type);
}

function replayWithPlateau(plateauPressureCmH2O: number, violationMs: number): ReplayResult {
  const cycle: Record<string, number> = { plateauPressureCmH2O, drivingPressureCmH2O: 10, tidalVolumePerKgPbw: 6, autoPeepCmH2O: 0 };
  const final: Record<string, unknown> = { simTimeMs: violationMs, targets: [], lastCycle: cycle };

  return { final, metricsTimeline: [final] } as unknown as ReplayResult;
}

describe("resolveSessionRubric", () => {
  it("maps the seed limit criteria into one SAFETY_VIOLATIONS criterion with the case limits and penalty", () => {
    const rubric: SimulationRubric = toSimulationRubric(SEED_CASE_RUBRIC);

    const safety: SimulationRubricCriterion | undefined = criterionOf(rubric, "SAFETY_VIOLATIONS");

    expect(rubric.criteria.map((criterion: SimulationRubricCriterion): string => criterion.type)).toEqual([
      "TARGETS_REACHED",
      "TIME_TO_STABILIZE",
      "TIME_IN_RANGE",
      "AI_ASSIST_USAGE",
      "SAFETY_VIOLATIONS",
    ]);
    expect(safety?.weight).toBe(20);
    expect(safety?.params?.penaltyPerViolationSecond).toBe(0.05);
    expect(safety?.params?.limits).toEqual({
      plateauPressureMaxCmH2O: 30,
      drivingPressureMaxCmH2O: 15,
      tidalVolumeMaxMlPerKgPbw: 8,
      autoPeepMaxCmH2O: 4,
    });
  });

  it("maps the seed AI criterion into AI_ASSIST_USAGE where each penalized use costs its penalty points", () => {
    const rubric: SimulationRubric = toSimulationRubric(SEED_CASE_RUBRIC);

    const ai: SimulationRubricCriterion | undefined = criterionOf(rubric, "AI_ASSIST_USAGE");

    expect(ai?.weight).toBe(5 * AI_PENALIZED_USES_TO_ZERO);
    expect(ai?.threshold).toBe(0);
    expect(ai?.params?.penaltyPerUse).toBe(0.25);
  });

  it("actually scores the seed penalties for limit violations and AI uses", () => {
    const rubric: SimulationRubric = toSimulationRubric(SEED_CASE_RUBRIC);

    const clean: SimulationScore = computeSimulationScore(replayWithPlateau(25, 10_000), rubric, { aiHelpCount: 0 });
    const penalized: SimulationScore = computeSimulationScore(replayWithPlateau(35, 10_000), rubric, { aiHelpCount: 2 });

    expect(clean.score).toBe(1);
    expect(penalized.breakdown.find((item: { criterion: string }): boolean => item.criterion === "SAFETY_VIOLATIONS")?.points).toBe(0.5);
    expect(penalized.breakdown.find((item: { criterion: string }): boolean => item.criterion === "AI_ASSIST_USAGE")?.points).toBe(0.5);
    expect(penalized.score).toBeCloseTo((100 + 20 * 0.5 + 20 * 0.5) / 140, 4);
  });

  it("uses positive limit weights as the safety weight and a fallback weight when no penalty is defined", () => {
    const weighted: SimulationRubric = toSimulationRubric({
      passingScore: 70,
      criteria: [
        { type: "TARGETS_REACHED", weight: 80, threshold: 1 },
        { type: "PLATEAU_PRESSURE_LIMIT", weight: 20, threshold: 28 },
      ],
    });
    const unweighted: SimulationRubric = toSimulationRubric({
      passingScore: 70,
      criteria: [
        { type: "TARGETS_REACHED", weight: 100, threshold: 1 },
        { type: "PLATEAU_PRESSURE_LIMIT", weight: 0, threshold: 28 },
        { type: "AI_ASSIST_USAGE", weight: 0, threshold: 0 },
      ],
    });

    expect(criterionOf(weighted, "SAFETY_VIOLATIONS")?.weight).toBe(20);
    expect(criterionOf(unweighted, "SAFETY_VIOLATIONS")?.weight).toBe(CASE_SAFETY_FALLBACK_WEIGHT);
    expect(criterionOf(unweighted, "SAFETY_VIOLATIONS")?.params?.penaltyPerViolationSecond).toBeUndefined();
    expect(criterionOf(unweighted, "AI_ASSIST_USAGE")).toBeUndefined();
  });

  it("skips a legacy parameter-comparison rubric and falls back to the next candidate", () => {
    const legacy: Record<string, unknown> = { criteria: [{ parameter: "peep", expectedValue: 8, min: 6, max: 10 }] };

    expect(resolveSessionRubric([legacy, SEED_CASE_RUBRIC])).toEqual(toSimulationRubric(SEED_CASE_RUBRIC));
    expect(resolveSessionRubric([legacy])).toBe(DEFAULT_SIMULATION_RUBRIC);
  });

  it("rejects an invalid engine rubric", () => {
    expect(() => resolveSessionRubric([{ criteria: [] }])).toThrow(SimulationRubricInvalidError);
  });
});
