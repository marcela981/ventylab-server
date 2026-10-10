/*
 * Funcionalidad: Pruebas del cálculo de la calificación de simulaciones
 * Descripción: Verifica con repeticiones reales del motor fisiológico que un pulmón normal bien ventilado obtiene una calificación alta, que una presión meseta mayor a 30 cmH2O penaliza la seguridad con justificación, que el uso de IA solo penaliza si el criterio existe, que una rúbrica inválida se rechaza, que la calificación queda en [0, 1] y que es determinista
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { EngineCase, EngineTargets, ReplayResult, replay } from "../engine";
import { buildTestCase } from "../engine/engine-test-cases-spec";

import { SimulationScore, SimulationScoreBreakdownItem, computeSimulationScore } from "./compute-simulation-score";
import { DEFAULT_SIMULATION_RUBRIC, SimulationCriterionType, SimulationRubric } from "./simulation-rubric";
import { InvalidScoringContextError, InvalidSimulationRubricError } from "./simulation-scoring.errors";

const TEN_MINUTES_MS: number = 600000;

const LUNG_PROTECTIVE_TARGETS: EngineTargets = {
  paco2MmHg: { min: 35, max: 45 },
  plateauPressureMaxCmH2O: 30,
  drivingPressureMaxCmH2O: 15,
  tidalVolumePerKgPbw: { min: 6, max: 8 },
};

const NORMAL_LUNG_CASE: EngineCase = buildTestCase({ targets: LUNG_PROTECTIVE_TARGETS });

const STIFF_LUNG_OVERDISTENDED_CASE: EngineCase = buildTestCase({
  mechanics: { complianceMlPerCmH2O: 25 },
  settings: { tidalVolumeMl: 800 },
  targets: LUNG_PROTECTIVE_TARGETS,
});

const NORMAL_REPLAY: ReplayResult = replay(NORMAL_LUNG_CASE, 7, [], TEN_MINUTES_MS, { noise: false });
const OVERDISTENDED_REPLAY: ReplayResult = replay(STIFF_LUNG_OVERDISTENDED_CASE, 7, [], TEN_MINUTES_MS, { noise: false });

const AI_RUBRIC: SimulationRubric = {
  ...DEFAULT_SIMULATION_RUBRIC,
  criteria: [...DEFAULT_SIMULATION_RUBRIC.criteria, { type: "AI_ASSIST_USAGE", weight: 0.2, params: { penaltyPerUse: 0.25 } }],
  assistancePolicy: "ALLOWED_WITH_PENALTY",
};

function findCriterion(score: SimulationScore, type: SimulationCriterionType): SimulationScoreBreakdownItem {
  const item: SimulationScoreBreakdownItem | undefined = score.breakdown.find(
    (entry: SimulationScoreBreakdownItem): boolean => entry.criterion === type,
  );

  if (item === undefined) {
    throw new Error(`Criterion ${type} missing from breakdown`);
  }

  return item;
}

describe("computeSimulationScore", () => {
  it("gives a passive normal lung that is well ventilated a high score", () => {
    const rubric: SimulationRubric = DEFAULT_SIMULATION_RUBRIC;

    const score: SimulationScore = computeSimulationScore(NORMAL_REPLAY, rubric, { aiHelpCount: 0 });

    expect(score.score).toBeGreaterThanOrEqual(0.95);
    expect(findCriterion(score, "TARGETS_REACHED").points).toBe(1);
    expect(findCriterion(score, "SAFETY_VIOLATIONS").value).toBe(0);
    expect(findCriterion(score, "TIME_TO_STABILIZE").justification).toContain("starting at");
  });

  it("penalizes a plateau pressure above 30 cmH2O and explains it with the measured numbers", () => {
    const rubric: SimulationRubric = DEFAULT_SIMULATION_RUBRIC;

    const normal: SimulationScore = computeSimulationScore(NORMAL_REPLAY, rubric, { aiHelpCount: 0 });
    const overdistended: SimulationScore = computeSimulationScore(OVERDISTENDED_REPLAY, rubric, { aiHelpCount: 0 });
    const safety: SimulationScoreBreakdownItem = findCriterion(overdistended, "SAFETY_VIOLATIONS");

    expect(safety.points).toBeLessThan(1);
    expect(safety.value).toBeGreaterThan(0);
    expect(safety.justification).toMatch(/plateau pressure > 30\.0 cmH2O for \d+\.\d s \(worst \d+\.\d cmH2O\)/);
    expect(overdistended.score).toBeLessThan(normal.score);
  });

  it("applies the AI usage penalty only when the rubric includes the AI_ASSIST_USAGE criterion", () => {
    const withoutCriterion: SimulationRubric = DEFAULT_SIMULATION_RUBRIC;

    const unpenalized: SimulationScore = computeSimulationScore(NORMAL_REPLAY, withoutCriterion, { aiHelpCount: 3 });
    const baseline: SimulationScore = computeSimulationScore(NORMAL_REPLAY, withoutCriterion, { aiHelpCount: 0 });
    const penalized: SimulationScore = computeSimulationScore(NORMAL_REPLAY, AI_RUBRIC, { aiHelpCount: 3 });
    const aiItem: SimulationScoreBreakdownItem = findCriterion(penalized, "AI_ASSIST_USAGE");

    expect(unpenalized.score).toBe(baseline.score);
    expect(aiItem.value).toBe(3);
    expect(aiItem.points).toBe(0.25);
    expect(aiItem.justification).toContain("used 3 time(s)");
    expect(penalized.score).toBeLessThan(unpenalized.score);
  });

  it("rejects an invalid rubric and an invalid AI help count", () => {
    const invalidRubric: SimulationRubric = { criteria: [{ type: "TARGETS_REACHED", weight: 0 }] };

    const scoreInvalidRubric = (): SimulationScore => computeSimulationScore(NORMAL_REPLAY, invalidRubric, { aiHelpCount: 0 });
    const scoreInvalidContext = (): SimulationScore =>
      computeSimulationScore(NORMAL_REPLAY, DEFAULT_SIMULATION_RUBRIC, { aiHelpCount: -1 });

    expect(scoreInvalidRubric).toThrow(InvalidSimulationRubricError);
    expect(scoreInvalidContext).toThrow(InvalidScoringContextError);
  });

  it("keeps the score within [0, 1] and the weighted points summing to it", () => {
    const harshRubric: SimulationRubric = {
      criteria: [
        { type: "SAFETY_VIOLATIONS", weight: 3, params: { penaltyPerViolationSecond: 1 } },
        { type: "AI_ASSIST_USAGE", weight: 1, params: { penaltyPerUse: 1 } },
      ],
    };

    const scores: SimulationScore[] = [
      computeSimulationScore(OVERDISTENDED_REPLAY, harshRubric, { aiHelpCount: 50 }),
      computeSimulationScore(NORMAL_REPLAY, harshRubric, { aiHelpCount: 0 }),
      computeSimulationScore(OVERDISTENDED_REPLAY, AI_RUBRIC, { aiHelpCount: 2 }),
    ];

    for (const score of scores) {
      const weightedSum: number = score.breakdown.reduce(
        (sum: number, item: SimulationScoreBreakdownItem): number => sum + item.weightedPoints,
        0,
      );

      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(1);
      expect(Math.abs(weightedSum - score.score)).toBeLessThan(0.001);
    }

    expect(scores[0].score).toBe(0);
    expect(scores[1].score).toBe(1);
  });

  it("returns an identical result for the same input", () => {
    const rubric: SimulationRubric = AI_RUBRIC;

    const first: SimulationScore = computeSimulationScore(OVERDISTENDED_REPLAY, rubric, { aiHelpCount: 1 });
    const second: SimulationScore = computeSimulationScore(OVERDISTENDED_REPLAY, rubric, { aiHelpCount: 1 });

    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });
});
