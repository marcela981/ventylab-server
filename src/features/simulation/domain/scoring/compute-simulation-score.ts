/*
 * Funcionalidad: Cálculo de la calificación de una simulación
 * Descripción: Califica de forma determinista el resultado de una repetición del motor fisiológico contra una rúbrica: promedio ponderado de los puntos por criterio (objetivos alcanzados, tiempo de estabilización, tiempo en rango, violaciones de seguridad y uso de asistencia de IA) con justificación legible por criterio
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { CycleMetrics, EngineMetrics, ReplayResult, TargetStatus } from "../engine";

import {
  DEFAULT_AI_FREE_USES,
  DEFAULT_HOLD_WINDOW_S,
  DEFAULT_LAST_MINUTES,
  DEFAULT_PENALTY_PER_AI_USE,
  DEFAULT_PENALTY_PER_VIOLATION_SECOND,
  DEFAULT_SAFETY_LIMITS,
  DEFAULT_SAFETY_TOLERANCE_S,
  DEFAULT_TARGETS_REACHED_THRESHOLD,
  DEFAULT_TIME_IN_RANGE_THRESHOLD_PERCENT,
  DEFAULT_TIME_TO_STABILIZE_THRESHOLD_S,
  SafetyLimits,
  SimulationCriterionType,
  SimulationRubric,
  SimulationRubricCriterion,
  SimulationRubricValidationResult,
  validateSimulationRubric,
} from "./simulation-rubric";
import { InvalidScoringContextError, InvalidSimulationRubricError } from "./simulation-scoring.errors";

export interface SimulationScoringContext {
  readonly aiHelpCount: number;
}

export interface SimulationScoreBreakdownItem {
  readonly criterion: SimulationCriterionType;
  readonly weight: number;
  readonly value: number | null;
  readonly threshold: number | null;
  readonly points: number;
  readonly weightedPoints: number;
  readonly justification: string;
}

export interface SimulationScore {
  readonly score: number;
  readonly breakdown: readonly SimulationScoreBreakdownItem[];
}

interface CriterionEvaluation {
  readonly value: number | null;
  readonly threshold: number | null;
  readonly points: number;
  readonly justification: string;
}

interface ScoringInput {
  readonly replayResult: ReplayResult;
  readonly snapshots: readonly EngineMetrics[];
  readonly rubric: SimulationRubric;
  readonly context: SimulationScoringContext;
}

interface SafetyCheck {
  readonly label: string;
  readonly unit: string;
  readonly limit: number;
  readonly read: (cycle: CycleMetrics) => number;
}

interface SafetyExposure {
  readonly check: SafetyCheck;
  readonly seconds: number;
  readonly worstValue: number;
}

const PRECISION: number = 10000;

export function computeSimulationScore(
  replayResult: ReplayResult,
  rubric: SimulationRubric,
  context: SimulationScoringContext,
): SimulationScore {
  const validation: SimulationRubricValidationResult = validateSimulationRubric(rubric);

  if (!validation.valid) {
    throw new InvalidSimulationRubricError(validation.issues);
  }

  if (!Number.isInteger(context.aiHelpCount) || context.aiHelpCount < 0) {
    throw new InvalidScoringContextError("aiHelpCount", "aiHelpCount must be a non-negative integer");
  }

  const input: ScoringInput = {
    replayResult,
    snapshots: replayResult.metricsTimeline.length > 0 ? replayResult.metricsTimeline : [replayResult.final],
    rubric: validation.rubric,
    context,
  };
  const totalWeight: number = validation.rubric.criteria.reduce(
    (sum: number, criterion: SimulationRubricCriterion): number => sum + criterion.weight,
    0,
  );
  let weightedSum: number = 0;

  const breakdown: SimulationScoreBreakdownItem[] = validation.rubric.criteria.map(
    (criterion: SimulationRubricCriterion): SimulationScoreBreakdownItem => {
      const evaluation: CriterionEvaluation = evaluateCriterion(criterion, input);
      const weightedPoints: number = (criterion.weight / totalWeight) * evaluation.points;

      weightedSum += weightedPoints;

      return {
        criterion: criterion.type,
        weight: criterion.weight,
        value: evaluation.value === null ? null : round(evaluation.value),
        threshold: evaluation.threshold,
        points: round(evaluation.points),
        weightedPoints: round(weightedPoints),
        justification: evaluation.justification,
      };
    },
  );

  return { score: round(clamp(weightedSum, 0, 1)), breakdown };
}

function evaluateCriterion(criterion: SimulationRubricCriterion, input: ScoringInput): CriterionEvaluation {
  switch (criterion.type) {
    case "TARGETS_REACHED":
      return evaluateTargetsReached(criterion, input);
    case "TIME_TO_STABILIZE":
      return evaluateTimeToStabilize(criterion, input);
    case "TIME_IN_RANGE":
      return evaluateTimeInRange(criterion, input);
    case "SAFETY_VIOLATIONS":
      return evaluateSafetyViolations(criterion, input);
    case "AI_ASSIST_USAGE":
      return evaluateAiAssistUsage(criterion, input);
  }
}

function evaluateTargetsReached(criterion: SimulationRubricCriterion, input: ScoringInput): CriterionEvaluation {
  const threshold: number = criterion.threshold ?? DEFAULT_TARGETS_REACHED_THRESHOLD;
  const targets: readonly TargetStatus[] = input.replayResult.final.targets;

  if (targets.length === 0) {
    return notApplicable(threshold);
  }

  const unmet: TargetStatus[] = targets.filter((target: TargetStatus): boolean => target.status !== "MET");
  const fraction: number = (targets.length - unmet.length) / targets.length;
  const unmetText: string =
    unmet.length === 0 ? "" : ` Unmet: ${unmet.map((target: TargetStatus): string => describeTarget(target)).join(", ")}.`;

  return {
    value: fraction,
    threshold,
    points: clamp(fraction / threshold, 0, 1),
    justification:
      `${targets.length - unmet.length} of ${targets.length} targets met at the end of the simulation ` +
      `(${formatPercent(fraction)}); required ${formatPercent(threshold)}.${unmetText}`,
  };
}

function evaluateTimeToStabilize(criterion: SimulationRubricCriterion, input: ScoringInput): CriterionEvaluation {
  const threshold: number = criterion.threshold ?? DEFAULT_TIME_TO_STABILIZE_THRESHOLD_S;
  const holdWindowS: number = criterion.params?.holdWindowS ?? DEFAULT_HOLD_WINDOW_S;

  if (input.replayResult.final.targets.length === 0) {
    return notApplicable(threshold);
  }

  const holdWindowMs: number = holdWindowS * 1000;
  let streakStartMs: number | null = null;
  let stabilizedAtMs: number | null = null;

  for (const snapshot of input.snapshots) {
    if (!allTargetsMet(snapshot.targets)) {
      streakStartMs = null;

      continue;
    }

    streakStartMs = streakStartMs ?? snapshot.simTimeMs;

    if (snapshot.simTimeMs - streakStartMs >= holdWindowMs) {
      stabilizedAtMs = streakStartMs;

      break;
    }
  }

  if (stabilizedAtMs === null) {
    return {
      value: null,
      threshold,
      points: 0,
      justification:
        `Targets were never all met and held for ${format(holdWindowS)} s during ` +
        `${format(input.replayResult.final.simTimeMs / 1000)} s of simulation; limit ${format(threshold)} s.`,
    };
  }

  const seconds: number = stabilizedAtMs / 1000;
  // Linear decay past the limit, reaching zero points at twice the limit.
  const points: number = seconds <= threshold ? 1 : clamp(1 - (seconds - threshold) / threshold, 0, 1);

  return {
    value: seconds,
    threshold,
    points,
    justification:
      `All targets were met and held for ${format(holdWindowS)} s starting at ${format(seconds)} s; ` +
      `limit ${format(threshold)} s.`,
  };
}

function evaluateTimeInRange(criterion: SimulationRubricCriterion, input: ScoringInput): CriterionEvaluation {
  const threshold: number = criterion.threshold ?? DEFAULT_TIME_IN_RANGE_THRESHOLD_PERCENT;
  const lastMinutes: number = criterion.params?.lastMinutes ?? input.rubric.lastMinutes ?? DEFAULT_LAST_MINUTES;

  if (input.replayResult.final.targets.length === 0) {
    return notApplicable(threshold);
  }

  const windowStartMs: number = input.replayResult.final.simTimeMs - lastMinutes * 60000;
  const windowSnapshots: EngineMetrics[] = input.snapshots.filter(
    (snapshot: EngineMetrics): boolean => snapshot.simTimeMs > windowStartMs,
  );

  if (windowSnapshots.length === 0) {
    return {
      value: null,
      threshold,
      points: 0,
      justification: `No metrics snapshots were recorded during the last ${format(lastMinutes)} min.`,
    };
  }

  const inRange: number = windowSnapshots.filter((snapshot: EngineMetrics): boolean => allTargetsMet(snapshot.targets)).length;
  const percent: number = (inRange / windowSnapshots.length) * 100;

  return {
    value: percent,
    threshold,
    points: clamp(percent / threshold, 0, 1),
    justification:
      `All targets were met in ${inRange} of ${windowSnapshots.length} snapshots (${format(percent)}%) ` +
      `during the last ${format(lastMinutes)} min; required ${format(threshold)}%.`,
  };
}

function evaluateSafetyViolations(criterion: SimulationRubricCriterion, input: ScoringInput): CriterionEvaluation {
  const threshold: number = criterion.threshold ?? DEFAULT_SAFETY_TOLERANCE_S;
  const penaltyPerSecond: number = criterion.params?.penaltyPerViolationSecond ?? DEFAULT_PENALTY_PER_VIOLATION_SECOND;
  const limits: SafetyLimits = { ...DEFAULT_SAFETY_LIMITS, ...criterion.params?.limits };
  const exposures: SafetyExposure[] = measureSafetyExposures(safetyChecks(limits), input.snapshots);
  const violationSeconds: number = exposures.reduce((sum: number, exposure: SafetyExposure): number => sum + exposure.seconds, 0);
  const points: number = clamp(1 - penaltyPerSecond * Math.max(0, violationSeconds - threshold), 0, 1);
  const exceeded: SafetyExposure[] = exposures.filter((exposure: SafetyExposure): boolean => exposure.seconds > 0);

  if (exceeded.length === 0) {
    const limitsText: string = exposures
      .map((exposure: SafetyExposure): string => `${exposure.check.label} <= ${format(exposure.check.limit)} ${exposure.check.unit}`)
      .join(", ");

    return { value: 0, threshold, points, justification: `No safety limit was exceeded (${limitsText}).` };
  }

  const detail: string = exceeded
    .map(
      (exposure: SafetyExposure): string =>
        `${exposure.check.label} > ${format(exposure.check.limit)} ${exposure.check.unit} for ${format(exposure.seconds)} s ` +
        `(worst ${format(exposure.worstValue)} ${exposure.check.unit})`,
    )
    .join("; ");

  return {
    value: violationSeconds,
    threshold,
    points,
    justification:
      `Safety limits exceeded for ${format(violationSeconds)} violation-seconds (tolerance ${format(threshold)} s, ` +
      `penalty ${format(penaltyPerSecond, 3)} per second): ${detail}.`,
  };
}

function evaluateAiAssistUsage(criterion: SimulationRubricCriterion, input: ScoringInput): CriterionEvaluation {
  const freeUses: number = criterion.threshold ?? DEFAULT_AI_FREE_USES;
  const penaltyPerUse: number = criterion.params?.penaltyPerUse ?? DEFAULT_PENALTY_PER_AI_USE;
  const uses: number = input.context.aiHelpCount;
  const penalizedUses: number = Math.max(0, uses - freeUses);

  return {
    value: uses,
    threshold: freeUses,
    points: clamp(1 - penaltyPerUse * penalizedUses, 0, 1),
    justification:
      `AI assistance was used ${uses} time(s) with ${freeUses} free use(s); ${penalizedUses} penalized use(s) ` +
      `at ${format(penaltyPerUse, 3)} points each.`,
  };
}

function safetyChecks(limits: SafetyLimits): SafetyCheck[] {
  return [
    {
      label: "plateau pressure",
      unit: "cmH2O",
      limit: limits.plateauPressureMaxCmH2O,
      read: (cycle: CycleMetrics): number => cycle.plateauPressureCmH2O,
    },
    {
      label: "driving pressure",
      unit: "cmH2O",
      limit: limits.drivingPressureMaxCmH2O,
      read: (cycle: CycleMetrics): number => cycle.drivingPressureCmH2O,
    },
    {
      label: "tidal volume",
      unit: "mL/kg PBW",
      limit: limits.tidalVolumeMaxMlPerKgPbw,
      read: (cycle: CycleMetrics): number => cycle.tidalVolumePerKgPbw,
    },
    {
      label: "auto-PEEP",
      unit: "cmH2O",
      limit: limits.autoPeepMaxCmH2O,
      read: (cycle: CycleMetrics): number => cycle.autoPeepCmH2O,
    },
  ];
}

function measureSafetyExposures(checks: readonly SafetyCheck[], snapshots: readonly EngineMetrics[]): SafetyExposure[] {
  const seconds: number[] = checks.map((): number => 0);
  const worstValues: number[] = checks.map((): number => Number.NEGATIVE_INFINITY);
  let previousMs: number = 0;

  for (const snapshot of snapshots) {
    const intervalS: number = Math.max(0, snapshot.simTimeMs - previousMs) / 1000;
    const cycle: CycleMetrics | null = snapshot.lastCycle;

    previousMs = snapshot.simTimeMs;

    if (cycle === null) {
      continue;
    }

    checks.forEach((check: SafetyCheck, index: number): void => {
      const value: number = check.read(cycle);

      if (value > check.limit) {
        seconds[index] += intervalS;
        worstValues[index] = Math.max(worstValues[index], value);
      }
    });
  }

  return checks.map(
    (check: SafetyCheck, index: number): SafetyExposure => ({ check, seconds: seconds[index], worstValue: worstValues[index] }),
  );
}

function allTargetsMet(targets: readonly TargetStatus[]): boolean {
  return targets.length > 0 && targets.every((target: TargetStatus): boolean => target.status === "MET");
}

function describeTarget(target: TargetStatus): string {
  const value: string = target.value === null ? "unknown" : format(target.value, 2);
  const range: string =
    target.min === null ? `max ${format(target.max ?? 0, 2)}` : `range ${format(target.min, 2)}-${format(target.max ?? 0, 2)}`;

  return `${target.id} (value ${value}, ${range})`;
}

function notApplicable(threshold: number): CriterionEvaluation {
  return {
    value: null,
    threshold,
    points: 1,
    justification: "The case defines no targets, so this criterion is not applicable and grants full points.",
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * PRECISION) / PRECISION;
}

function format(value: number, digits: number = 1): string {
  return value.toFixed(digits);
}

function formatPercent(fraction: number): string {
  return `${format(fraction * 100)}%`;
}
