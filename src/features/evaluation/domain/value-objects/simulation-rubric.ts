/*
 * Funcionalidad: Rúbrica de simulación
 * Descripción: Define la rúbrica de una pregunta práctica de simulación (criterios por parámetro del ventilador con valor esperado, rango aceptable opcional y prioridad CRITICO/IMPORTANTE/OPCIONAL) y la valida devolviendo la lista de errores
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type SimulationRubricNumericParameter = "tidalVolume" | "respiratoryRate" | "peep" | "fio2" | "maxPressure";
export type SimulationRubricTextParameter = "ventilationMode" | "iERatio";
export type SimulationRubricParameter = SimulationRubricNumericParameter | SimulationRubricTextParameter;
export type SimulationRubricPriority = "CRITICO" | "IMPORTANTE" | "OPCIONAL";

export const SIMULATION_RUBRIC_NUMERIC_PARAMETERS: readonly SimulationRubricNumericParameter[] = [
  "tidalVolume",
  "respiratoryRate",
  "peep",
  "fio2",
  "maxPressure",
];
export const SIMULATION_RUBRIC_TEXT_PARAMETERS: readonly SimulationRubricTextParameter[] = ["ventilationMode", "iERatio"];
export const SIMULATION_RUBRIC_PRIORITIES: readonly SimulationRubricPriority[] = ["CRITICO", "IMPORTANTE", "OPCIONAL"];
export const DEFAULT_SIMULATION_RUBRIC_PRIORITY: SimulationRubricPriority = "OPCIONAL";

export interface SimulationRubricCriterion {
  parameter: SimulationRubricParameter;
  expectedValue: number | string;
  min?: number;
  max?: number;
  priority?: SimulationRubricPriority;
}

export interface SimulationRubric {
  criteria: SimulationRubricCriterion[];
  justification?: string;
}

export interface SimulationRubricValidation {
  valid: boolean;
  errors: string[];
  rubric?: SimulationRubric;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNumericParameter(parameter: string): parameter is SimulationRubricNumericParameter {
  return (SIMULATION_RUBRIC_NUMERIC_PARAMETERS as readonly string[]).includes(parameter);
}

function isTextParameter(parameter: string): parameter is SimulationRubricTextParameter {
  return (SIMULATION_RUBRIC_TEXT_PARAMETERS as readonly string[]).includes(parameter);
}

function isPriority(value: unknown): value is SimulationRubricPriority {
  return typeof value === "string" && (SIMULATION_RUBRIC_PRIORITIES as readonly string[]).includes(value);
}

function validateRange(raw: Record<string, unknown>, prefix: string, expectedValue: number): string | undefined {
  if (raw.min === undefined && raw.max === undefined) {
    return undefined;
  }

  if (!isFiniteNumber(raw.min) || !isFiniteNumber(raw.max)) {
    return `${prefix} must define both min and max or neither`;
  }

  if (raw.min > raw.max) {
    return `${prefix}.min must not be greater than max`;
  }

  if (expectedValue < raw.min || expectedValue > raw.max) {
    return `${prefix}.expectedValue must be within min and max`;
  }

  return undefined;
}

function validateCriterion(raw: unknown, index: number, seen: Set<string>): { error?: string; criterion?: SimulationRubricCriterion } {
  const prefix: string = `criteria[${index}]`;

  if (!isRecord(raw)) {
    return { error: `${prefix} must be an object` };
  }

  const parameter: unknown = raw.parameter;

  if (typeof parameter !== "string" || (!isNumericParameter(parameter) && !isTextParameter(parameter))) {
    return { error: `${prefix}.parameter is not supported` };
  }

  if (seen.has(parameter)) {
    return { error: `${prefix}.parameter is duplicated` };
  }

  seen.add(parameter);

  if (raw.priority !== undefined && !isPriority(raw.priority)) {
    return { error: `${prefix}.priority must be one of ${SIMULATION_RUBRIC_PRIORITIES.join(", ")}` };
  }

  const priority: SimulationRubricPriority = isPriority(raw.priority) ? raw.priority : DEFAULT_SIMULATION_RUBRIC_PRIORITY;

  if (isTextParameter(parameter)) {
    if (typeof raw.expectedValue !== "string" || raw.expectedValue.trim() === "") {
      return { error: `${prefix}.expectedValue must be a non-empty string` };
    }

    if (raw.min !== undefined || raw.max !== undefined) {
      return { error: `${prefix} ranges are only allowed for numeric parameters` };
    }

    return { criterion: { parameter, expectedValue: raw.expectedValue.trim(), priority } };
  }

  if (!isFiniteNumber(raw.expectedValue)) {
    return { error: `${prefix}.expectedValue must be a finite number` };
  }

  const rangeError: string | undefined = validateRange(raw, prefix, raw.expectedValue);

  if (rangeError) {
    return { error: rangeError };
  }

  const criterion: SimulationRubricCriterion = { parameter, expectedValue: raw.expectedValue, priority };

  if (isFiniteNumber(raw.min) && isFiniteNumber(raw.max)) {
    criterion.min = raw.min;
    criterion.max = raw.max;
  }

  return { criterion };
}

export function validateSimulationRubric(raw: unknown): SimulationRubricValidation {
  if (!isRecord(raw)) {
    return { valid: false, errors: ["rubric must be an object"] };
  }

  if (!Array.isArray(raw.criteria) || raw.criteria.length === 0) {
    return { valid: false, errors: ["criteria must be a non-empty array"] };
  }

  const errors: string[] = [];
  const criteria: SimulationRubricCriterion[] = [];
  const seen: Set<string> = new Set<string>();

  raw.criteria.forEach((item: unknown, index: number) => {
    const { error, criterion } = validateCriterion(item, index, seen);

    if (error) {
      errors.push(error);
    } else if (criterion) {
      criteria.push(criterion);
    }
  });

  if (raw.justification !== undefined && typeof raw.justification !== "string") {
    errors.push("justification must be a string");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const rubric: SimulationRubric = { criteria };

  if (typeof raw.justification === "string") {
    rubric.justification = raw.justification;
  }

  return { valid: true, errors: [], rubric };
}
