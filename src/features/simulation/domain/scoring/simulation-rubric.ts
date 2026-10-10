/*
 * Funcionalidad: Rúbrica de calificación de simulaciones
 * Descripción: Tipos de la rúbrica (criterios TARGETS_REACHED, TIME_TO_STABILIZE, TIME_IN_RANGE, SAFETY_VIOLATIONS y AI_ASSIST_USAGE, pesos, umbrales, parámetros y política de asistencia), valores por defecto, rúbrica por defecto y validador con errores tipados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { SimulationRubricIssue, SimulationRubricIssueCode } from "./simulation-scoring.errors";

export type SimulationCriterionType =
  | "TARGETS_REACHED"
  | "TIME_TO_STABILIZE"
  | "TIME_IN_RANGE"
  | "SAFETY_VIOLATIONS"
  | "AI_ASSIST_USAGE";

export type AssistancePolicy = "DISABLED" | "ALLOWED_WITH_PENALTY";

export interface SafetyLimits {
  readonly plateauPressureMaxCmH2O: number;
  readonly drivingPressureMaxCmH2O: number;
  readonly tidalVolumeMaxMlPerKgPbw: number;
  readonly autoPeepMaxCmH2O: number;
}

export interface SimulationCriterionParams {
  readonly holdWindowS?: number;
  readonly lastMinutes?: number;
  readonly penaltyPerViolationSecond?: number;
  readonly limits?: Partial<SafetyLimits>;
  readonly penaltyPerUse?: number;
}

export interface SimulationRubricCriterion {
  readonly type: SimulationCriterionType;
  readonly weight: number;
  readonly threshold?: number;
  readonly params?: SimulationCriterionParams;
}

export interface SimulationRubric {
  readonly criteria: readonly SimulationRubricCriterion[];
  readonly assistancePolicy?: AssistancePolicy;
  readonly lastMinutes?: number;
}

export type SimulationRubricValidationResult =
  | { readonly valid: true; readonly rubric: SimulationRubric }
  | { readonly valid: false; readonly issues: readonly SimulationRubricIssue[] };

export const SIMULATION_CRITERION_TYPES: readonly SimulationCriterionType[] = [
  "TARGETS_REACHED",
  "TIME_TO_STABILIZE",
  "TIME_IN_RANGE",
  "SAFETY_VIOLATIONS",
  "AI_ASSIST_USAGE",
];

export const ASSISTANCE_POLICIES: readonly AssistancePolicy[] = ["DISABLED", "ALLOWED_WITH_PENALTY"];

export const DEFAULT_ASSISTANCE_POLICY: AssistancePolicy = "DISABLED";

export const DEFAULT_SAFETY_LIMITS: SafetyLimits = {
  plateauPressureMaxCmH2O: 30,
  drivingPressureMaxCmH2O: 15,
  tidalVolumeMaxMlPerKgPbw: 8,
  autoPeepMaxCmH2O: 5,
};

export const DEFAULT_LAST_MINUTES: number = 5;
export const DEFAULT_HOLD_WINDOW_S: number = 30;
export const DEFAULT_TARGETS_REACHED_THRESHOLD: number = 1;
export const DEFAULT_TIME_TO_STABILIZE_THRESHOLD_S: number = 300;
export const DEFAULT_TIME_IN_RANGE_THRESHOLD_PERCENT: number = 80;
export const DEFAULT_SAFETY_TOLERANCE_S: number = 0;
export const DEFAULT_PENALTY_PER_VIOLATION_SECOND: number = 0.02;
export const DEFAULT_AI_FREE_USES: number = 0;
export const DEFAULT_PENALTY_PER_AI_USE: number = 0.1;

export const DEFAULT_SIMULATION_RUBRIC: SimulationRubric = {
  criteria: [
    { type: "TARGETS_REACHED", weight: 0.3, threshold: DEFAULT_TARGETS_REACHED_THRESHOLD },
    {
      type: "TIME_TO_STABILIZE",
      weight: 0.2,
      threshold: DEFAULT_TIME_TO_STABILIZE_THRESHOLD_S,
      params: { holdWindowS: DEFAULT_HOLD_WINDOW_S },
    },
    { type: "TIME_IN_RANGE", weight: 0.25, threshold: DEFAULT_TIME_IN_RANGE_THRESHOLD_PERCENT },
    {
      type: "SAFETY_VIOLATIONS",
      weight: 0.25,
      threshold: DEFAULT_SAFETY_TOLERANCE_S,
      params: { penaltyPerViolationSecond: DEFAULT_PENALTY_PER_VIOLATION_SECOND, limits: DEFAULT_SAFETY_LIMITS },
    },
  ],
  assistancePolicy: DEFAULT_ASSISTANCE_POLICY,
  lastMinutes: DEFAULT_LAST_MINUTES,
};

const SAFETY_LIMIT_KEYS: readonly (keyof SafetyLimits)[] = [
  "plateauPressureMaxCmH2O",
  "drivingPressureMaxCmH2O",
  "tidalVolumeMaxMlPerKgPbw",
  "autoPeepMaxCmH2O",
];

const THRESHOLD_DESCRIPTIONS: Record<SimulationCriterionType, string> = {
  TARGETS_REACHED: "a fraction greater than 0 and at most 1",
  TIME_TO_STABILIZE: "a positive number of seconds",
  TIME_IN_RANGE: "a percentage greater than 0 and at most 100",
  SAFETY_VIOLATIONS: "a non-negative number of violation-seconds",
  AI_ASSIST_USAGE: "a non-negative integer number of free uses",
};

export function validateSimulationRubric(input: unknown): SimulationRubricValidationResult {
  if (!isRecord(input)) {
    return { valid: false, issues: [issue("INVALID_SHAPE", "rubric", "Rubric must be an object")] };
  }

  const issues: SimulationRubricIssue[] = [];
  const assistancePolicy: AssistancePolicy | undefined = validateAssistancePolicy(input.assistancePolicy, issues);
  const lastMinutes: number | undefined = positiveNumber(input.lastMinutes, "lastMinutes", issues);
  const criteriaInput: unknown = input.criteria;

  if (!Array.isArray(criteriaInput)) {
    issues.push(issue("INVALID_SHAPE", "criteria", "Rubric criteria must be an array"));

    return { valid: false, issues };
  }

  if (criteriaInput.length === 0) {
    issues.push(issue("ZERO_TOTAL_WEIGHT", "criteria", "Rubric needs at least one criterion with a positive weight"));
  }

  const criteria: SimulationRubricCriterion[] = [];
  const seenTypes: Set<SimulationCriterionType> = new Set<SimulationCriterionType>();

  criteriaInput.forEach((raw: unknown, index: number): void => {
    const field: string = `criteria[${index}]`;
    const criterion: SimulationRubricCriterion | undefined = validateCriterion(raw, field, issues);

    if (criterion === undefined) {
      return;
    }

    if (seenTypes.has(criterion.type)) {
      issues.push(issue("DUPLICATE_CRITERION", `${field}.type`, `Criterion ${criterion.type} appears more than once`));

      return;
    }

    seenTypes.add(criterion.type);
    criteria.push(criterion);
  });

  if (issues.length > 0) {
    return { valid: false, issues };
  }

  return { valid: true, rubric: { criteria, assistancePolicy: assistancePolicy ?? DEFAULT_ASSISTANCE_POLICY, lastMinutes } };
}

function validateCriterion(
  raw: unknown,
  field: string,
  issues: SimulationRubricIssue[],
): SimulationRubricCriterion | undefined {
  if (!isRecord(raw)) {
    issues.push(issue("INVALID_SHAPE", field, `${field} must be an object`));

    return undefined;
  }

  const issueCountBefore: number = issues.length;
  const type: unknown = raw.type;

  if (!isCriterionType(type)) {
    issues.push(issue("UNKNOWN_CRITERION", `${field}.type`, `Unknown criterion type ${String(type)}`));

    return undefined;
  }

  const weight: unknown = raw.weight;

  if (typeof weight !== "number" || !Number.isFinite(weight) || weight <= 0) {
    issues.push(issue("NON_POSITIVE_WEIGHT", `${field}.weight`, `Weight of ${type} must be a positive finite number`));
  }

  const threshold: unknown = raw.threshold;

  if (threshold !== undefined && !isValidThreshold(type, threshold)) {
    issues.push(
      issue("INVALID_THRESHOLD", `${field}.threshold`, `Threshold of ${type} must be ${THRESHOLD_DESCRIPTIONS[type]}`),
    );
  }

  let params: SimulationCriterionParams | undefined;

  if (raw.params !== undefined) {
    if (isRecord(raw.params)) {
      params = validateParams(type, raw.params, `${field}.params`, issues);
    } else {
      issues.push(issue("INVALID_PARAM", `${field}.params`, `Params of ${type} must be an object`));
    }
  }

  if (issues.length > issueCountBefore || typeof weight !== "number") {
    return undefined;
  }

  return { type, weight, threshold: typeof threshold === "number" ? threshold : undefined, params };
}

function validateParams(
  type: SimulationCriterionType,
  raw: Record<string, unknown>,
  field: string,
  issues: SimulationRubricIssue[],
): SimulationCriterionParams {
  switch (type) {
    case "TIME_TO_STABILIZE":
      return { holdWindowS: positiveNumber(raw.holdWindowS, `${field}.holdWindowS`, issues) };
    case "TIME_IN_RANGE":
      return { lastMinutes: positiveNumber(raw.lastMinutes, `${field}.lastMinutes`, issues) };
    case "SAFETY_VIOLATIONS":
      return {
        penaltyPerViolationSecond: positiveNumber(raw.penaltyPerViolationSecond, `${field}.penaltyPerViolationSecond`, issues),
        limits: validateSafetyLimits(raw.limits, `${field}.limits`, issues),
      };
    case "AI_ASSIST_USAGE":
      return { penaltyPerUse: positiveNumber(raw.penaltyPerUse, `${field}.penaltyPerUse`, issues) };
    case "TARGETS_REACHED":
      return {};
  }
}

function validateSafetyLimits(
  raw: unknown,
  field: string,
  issues: SimulationRubricIssue[],
): Partial<SafetyLimits> | undefined {
  if (raw === undefined) {
    return undefined;
  }

  if (!isRecord(raw)) {
    issues.push(issue("INVALID_PARAM", field, "Safety limits must be an object"));

    return undefined;
  }

  const limits: Partial<Record<keyof SafetyLimits, number>> = {};

  for (const key of SAFETY_LIMIT_KEYS) {
    const value: number | undefined = positiveNumber(raw[key], `${field}.${key}`, issues);

    if (value !== undefined) {
      limits[key] = value;
    }
  }

  return limits;
}

function validateAssistancePolicy(raw: unknown, issues: SimulationRubricIssue[]): AssistancePolicy | undefined {
  if (raw === undefined) {
    return undefined;
  }

  const policy: AssistancePolicy | undefined = ASSISTANCE_POLICIES.find(
    (candidate: AssistancePolicy): boolean => candidate === raw,
  );

  if (policy === undefined) {
    issues.push(
      issue("INVALID_ASSISTANCE_POLICY", "assistancePolicy", `Assistance policy must be one of ${ASSISTANCE_POLICIES.join(", ")}`),
    );
  }

  return policy;
}

function positiveNumber(raw: unknown, field: string, issues: SimulationRubricIssue[]): number | undefined {
  if (raw === undefined) {
    return undefined;
  }

  if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) {
    issues.push(issue("INVALID_PARAM", field, `${field} must be a positive finite number`));

    return undefined;
  }

  return raw;
}

function isValidThreshold(type: SimulationCriterionType, raw: unknown): boolean {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return false;
  }

  switch (type) {
    case "TARGETS_REACHED":
      return raw > 0 && raw <= 1;
    case "TIME_TO_STABILIZE":
      return raw > 0;
    case "TIME_IN_RANGE":
      return raw > 0 && raw <= 100;
    case "SAFETY_VIOLATIONS":
      return raw >= 0;
    case "AI_ASSIST_USAGE":
      return Number.isInteger(raw) && raw >= 0;
  }
}

function isCriterionType(raw: unknown): raw is SimulationCriterionType {
  return SIMULATION_CRITERION_TYPES.some((type: SimulationCriterionType): boolean => type === raw);
}

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return typeof raw === "object" && raw !== null && !Array.isArray(raw);
}

function issue(code: SimulationRubricIssueCode, field: string, message: string): SimulationRubricIssue {
  return { code, field, message };
}
