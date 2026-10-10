/*
 * Funcionalidad: Resolución de la rúbrica de una sesión de simulación
 * Descripción: Elige la rúbrica de calificación de una sesión (la primera candidata aplicable a la repetición del motor, o la rúbrica por defecto; las rúbricas de comparación de parámetros de las preguntas de evaluación se omiten), acepta tanto la forma de rúbrica de calificación como la rúbrica por defecto de un caso clínico (criterios con peso sobre 100; los límites de seguridad con sus penalizaciones se agrupan en un criterio SAFETY_VIOLATIONS y la asistencia de IA con penalización en AI_ASSIST_USAGE) y la valida con el validador de la calificación
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  DEFAULT_SIMULATION_RUBRIC,
  type SafetyLimits,
  type SimulationRubric,
  type SimulationRubricCriterion,
  type SimulationRubricValidationResult,
  validateSimulationRubric,
} from "@/features/simulation/domain/scoring";
import { SimulationRubricInvalidError } from "@/features/simulation/domain/simulation.errors";

/*
 * Clinical-case rubric conversion (case weights use a 0-100 scale; the scorer normalizes by the total weight):
 * - Limit criteria (Pplat, driving pressure, Vt per kg PBW, auto-PEEP) become ONE SAFETY_VIOLATIONS criterion whose limits
 *   are the case thresholds. Weight = sum of the limit weights; when they are all 0 (seed cases) it is the sum of their
 *   penaltyPoints; when neither is set, CASE_SAFETY_FALLBACK_WEIGHT. Violations are measured in seconds, so the penalty per
 *   violation-second is the strictest penaltyPoints / 100 of the criterion (penaltyPoints / weight would zero it in seconds).
 * - AI_ASSIST_USAGE keeps its threshold as free uses. Weight = its weight, or penaltyPoints x AI_PENALIZED_USES_TO_ZERO when
 *   it is 0; penalty per use = penaltyPoints / weight, so each penalized use costs penaltyPoints rubric points.
 */
const CASE_RUBRIC_PENALTY_SCALE: number = 100;
export const CASE_SAFETY_FALLBACK_WEIGHT: number = 25;
export const AI_PENALIZED_USES_TO_ZERO: number = 4;

const CASE_SAFETY_LIMIT_KEYS: Readonly<Record<string, keyof SafetyLimits>> = {
  PLATEAU_PRESSURE_LIMIT: "plateauPressureMaxCmH2O",
  DRIVING_PRESSURE_LIMIT: "drivingPressureMaxCmH2O",
  TIDAL_VOLUME_LIMIT: "tidalVolumeMaxMlPerKgPbw",
  AUTO_PEEP_LIMIT: "autoPeepMaxCmH2O",
};

interface CaseRubricCriterion {
  readonly type: string;
  readonly weight: number;
  readonly threshold?: number;
  readonly windowMinutes?: number;
  readonly penaltyPoints?: number;
}

interface SafetyAccumulator {
  readonly limits: Partial<Record<keyof SafetyLimits, number>>;
  present: boolean;
  weight: number;
  penaltyPoints: number;
  strictestPenaltyPoints: number;
}

export function resolveSessionRubric(candidates: readonly unknown[]): SimulationRubric {
  const selected: unknown = candidates.find(
    (candidate: unknown): boolean => candidate !== undefined && candidate !== null && !isParameterComparisonRubric(candidate),
  );

  return selected === undefined ? DEFAULT_SIMULATION_RUBRIC : toSimulationRubric(selected);
}

export function toSimulationRubric(raw: unknown): SimulationRubric {
  const candidate: unknown = isCaseRubric(raw) ? fromCaseRubric(raw) : raw;
  const validation: SimulationRubricValidationResult = validateSimulationRubric(candidate);

  if (!validation.valid) {
    throw new SimulationRubricInvalidError();
  }

  return validation.rubric;
}

// Evaluation questions may carry the legacy rubric of expected ventilator settings; it does not describe a replay-based
// grade, so session scoring skips it and falls back to the next candidate (the case default rubric).
export function isParameterComparisonRubric(raw: unknown): boolean {
  return (
    isRecord(raw) &&
    Array.isArray(raw.criteria) &&
    raw.criteria.length > 0 &&
    raw.criteria.every(
      (criterion: unknown): boolean => isRecord(criterion) && typeof criterion.parameter === "string" && criterion.expectedValue !== undefined,
    )
  );
}

function fromCaseRubric(raw: Record<string, unknown>): Record<string, unknown> {
  const criteria: CaseRubricCriterion[] = (raw.criteria as unknown[]).filter(isCaseCriterion);
  const converted: SimulationRubricCriterion[] = [];
  const safety: SafetyAccumulator = { limits: {}, present: false, weight: 0, penaltyPoints: 0, strictestPenaltyPoints: 0 };

  for (const criterion of criteria) {
    const limitKey: keyof SafetyLimits | undefined = CASE_SAFETY_LIMIT_KEYS[criterion.type];

    if (limitKey !== undefined) {
      accumulateSafety(safety, limitKey, criterion);
      continue;
    }

    if (criterion.type === "AI_ASSIST_USAGE") {
      const aiCriterion: SimulationRubricCriterion | undefined = convertAiAssistCriterion(criterion);

      if (aiCriterion !== undefined) {
        converted.push(aiCriterion);
      }

      continue;
    }

    if (criterion.weight <= 0) {
      continue;
    }

    converted.push(convertCriterion(criterion));
  }

  if (safety.present) {
    converted.push(toSafetyCriterion(safety));
  }

  return { criteria: converted, assistancePolicy: raw.assistancePolicy };
}

function accumulateSafety(safety: SafetyAccumulator, limitKey: keyof SafetyLimits, criterion: CaseRubricCriterion): void {
  const penaltyPoints: number = positiveOrZero(criterion.penaltyPoints);

  if (criterion.threshold !== undefined && criterion.threshold > 0) {
    safety.limits[limitKey] = criterion.threshold;
  }

  safety.present = true;
  safety.weight += Math.max(0, criterion.weight);
  safety.penaltyPoints += penaltyPoints;
  safety.strictestPenaltyPoints = Math.max(safety.strictestPenaltyPoints, penaltyPoints);
}

function toSafetyCriterion(safety: SafetyAccumulator): SimulationRubricCriterion {
  const weight: number = safety.weight > 0 ? safety.weight : safety.penaltyPoints > 0 ? safety.penaltyPoints : CASE_SAFETY_FALLBACK_WEIGHT;
  const penaltyPerViolationSecond: number | undefined =
    safety.strictestPenaltyPoints > 0 ? Math.min(1, safety.strictestPenaltyPoints / CASE_RUBRIC_PENALTY_SCALE) : undefined;

  return { type: "SAFETY_VIOLATIONS", weight, params: { penaltyPerViolationSecond, limits: { ...safety.limits } } };
}

function convertAiAssistCriterion(criterion: CaseRubricCriterion): SimulationRubricCriterion | undefined {
  const penaltyPoints: number = positiveOrZero(criterion.penaltyPoints);
  const weight: number = criterion.weight > 0 ? criterion.weight : penaltyPoints * AI_PENALIZED_USES_TO_ZERO;

  if (weight <= 0) {
    return undefined;
  }

  const freeUses: number | undefined =
    criterion.threshold !== undefined && Number.isFinite(criterion.threshold) && criterion.threshold >= 0 ? Math.floor(criterion.threshold) : undefined;

  return {
    type: "AI_ASSIST_USAGE",
    weight,
    threshold: freeUses,
    params: { penaltyPerUse: penaltyPoints > 0 ? Math.min(1, penaltyPoints / weight) : undefined },
  };
}

function convertCriterion(criterion: CaseRubricCriterion): SimulationRubricCriterion {
  switch (criterion.type) {
    case "TARGETS_REACHED":
      return { type: "TARGETS_REACHED", weight: criterion.weight, threshold: withinUnit(criterion.threshold) };
    case "TIME_TO_STABILIZE":
      return { type: "TIME_TO_STABILIZE", weight: criterion.weight, threshold: positive(criterion.threshold) };
    case "TIME_IN_RANGE":
      return {
        type: "TIME_IN_RANGE",
        weight: criterion.weight,
        threshold: positive(criterion.threshold),
        params: { lastMinutes: positive(criterion.windowMinutes) },
      };
    default:
      return { type: criterion.type as SimulationRubricCriterion["type"], weight: criterion.weight, threshold: criterion.threshold };
  }
}

function positiveOrZero(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : 0;
}

function withinUnit(value: number | undefined): number | undefined {
  return value !== undefined && value > 0 && value <= 1 ? value : undefined;
}

function positive(value: number | undefined): number | undefined {
  return value !== undefined && value > 0 ? value : undefined;
}

function isCaseRubric(raw: unknown): raw is Record<string, unknown> {
  return isRecord(raw) && typeof raw.passingScore === "number" && Array.isArray(raw.criteria);
}

function isCaseCriterion(raw: unknown): raw is CaseRubricCriterion {
  return isRecord(raw) && typeof raw.type === "string" && typeof raw.weight === "number" && Number.isFinite(raw.weight);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
