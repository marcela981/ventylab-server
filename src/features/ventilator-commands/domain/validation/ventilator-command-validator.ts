/*
 * Funcionalidad: Validador de comandos del ventilador
 * Descripción: Validación pura de un comando recibido como dato desconocido: carga y modo, números finitos (rechaza NaN, infinitos, cadenas y booleanos), parámetros obligatorios por modo, rangos compartidos de VENTILATOR_PARAMETER_LIMITS, coherencia (tiempo espiratorio mínimo, relación I:E coherente con frecuencia y tiempo inspiratorio, presión límite mayor que PEEP) y límites de seguridad más estrictos; devuelve el comando tipado o la lista de violaciones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { MIN_EXPIRATORY_TIME_S, VENTILATOR_PARAMETER_LIMITS, type VentilatorParameterLimit } from "@/common/domain/ventilator/ventilator-limits";
import { type VentilatorCommandSafetyLimits } from "@/features/ventilator-commands/domain/validation/ventilator-command-safety-limits";
import {
  isVentilatorCommandMode,
  REQUIRED_PARAMETERS_BY_MODE,
  VENTILATOR_COMMAND_MODE_VALUES,
  VENTILATOR_COMMAND_NUMERIC_FIELDS,
  type VentilatorCommandModeValue,
  type VentilatorCommandNumericField,
  type VentilatorCommandParams,
} from "@/features/ventilator-commands/domain/value-objects/ventilator-command-params";

export type VentilatorCommandViolationRule =
  | "invalid_payload"
  | "invalid_mode"
  | "required"
  | "not_a_number"
  | "out_of_range"
  | "expiratory_time_too_short"
  | "ie_ratio_inconsistent"
  | "pressure_limit_not_above_peep"
  | "safety_limit";

export interface VentilatorCommandViolationLimit {
  readonly min?: number;
  readonly max?: number;
}

export interface VentilatorCommandViolation {
  readonly field: string;
  readonly rule: VentilatorCommandViolationRule;
  readonly message: string;
  readonly limit?: VentilatorCommandViolationLimit;
}

export type VentilatorCommandValidation =
  | { readonly valid: true; readonly command: VentilatorCommandParams }
  | { readonly valid: false; readonly violations: readonly VentilatorCommandViolation[] };

export const IE_RATIO_CONSISTENCY_TOLERANCE: number = 0.05;

const SECONDS_PER_MINUTE: number = 60;
const IE_RATIO_PATTERN: RegExp = /^\s*(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*$/;

const SHARED_RANGES: Readonly<Record<VentilatorCommandNumericField, VentilatorParameterLimit | undefined>> = {
  tidalVolume: VENTILATOR_PARAMETER_LIMITS.tidalVolumeMl,
  respiratoryRate: VENTILATOR_PARAMETER_LIMITS.respiratoryRateBpm,
  peep: VENTILATOR_PARAMETER_LIMITS.peepCmH2O,
  fio2: VENTILATOR_PARAMETER_LIMITS.fio2,
  pressureLimit: VENTILATOR_PARAMETER_LIMITS.pressureLimitCmH2O,
  inspiratoryTime: VENTILATOR_PARAMETER_LIMITS.inspiratoryTimeS,
  ieRatio: undefined,
  flowRate: VENTILATOR_PARAMETER_LIMITS.flowRateLpm,
  sensitivity: VENTILATOR_PARAMETER_LIMITS.flowTriggerLpm,
};

type NumericValues = Partial<Record<VentilatorCommandNumericField, number>>;

export function parseIeRatio(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return Number.NaN;
  }

  const match: RegExpExecArray | null = IE_RATIO_PATTERN.exec(value);

  if (!match) {
    return Number.NaN;
  }

  const inspiratory: number = Number(match[1]);
  const expiratory: number = Number(match[2]);

  return expiratory > 0 ? inspiratory / expiratory : Number.NaN;
}

export function validateVentilatorCommand(input: unknown, safety: VentilatorCommandSafetyLimits): VentilatorCommandValidation {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { valid: false, violations: [{ field: "command", rule: "invalid_payload", message: "command must be an object" }] };
  }

  const raw: Record<string, unknown> = input as Record<string, unknown>;
  const violations: VentilatorCommandViolation[] = [];
  const mode: unknown = raw.mode;

  if (!isVentilatorCommandMode(mode)) {
    violations.push({ field: "mode", rule: "invalid_mode", message: `mode must be one of ${VENTILATOR_COMMAND_MODE_VALUES.join(", ")}` });
  }

  const values: NumericValues = readNumericValues(raw, violations);

  if (isVentilatorCommandMode(mode)) {
    checkRequired(mode, raw, violations);
  }

  const inRange: NumericValues = checkSharedRanges(values, violations);

  checkCoherence(inRange, safety, violations);
  checkSafetyLimits(inRange, safety, violations);

  if (violations.length > 0 || !isVentilatorCommandMode(mode)) {
    return { valid: false, violations };
  }

  return { valid: true, command: { mode, ...values } };
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === null;
}

function readNumericValues(raw: Record<string, unknown>, violations: VentilatorCommandViolation[]): NumericValues {
  const values: NumericValues = {};

  for (const field of VENTILATOR_COMMAND_NUMERIC_FIELDS) {
    const value: unknown = raw[field];

    if (isMissing(value)) {
      continue;
    }

    const parsed: number = field === "ieRatio" ? parseIeRatio(value) : typeof value === "number" ? value : Number.NaN;

    if (!Number.isFinite(parsed)) {
      violations.push({ field, rule: "not_a_number", message: `${field} must be a finite number` });

      continue;
    }

    values[field] = parsed;
  }

  return values;
}

function checkRequired(mode: VentilatorCommandModeValue, raw: Record<string, unknown>, violations: VentilatorCommandViolation[]): void {
  for (const field of REQUIRED_PARAMETERS_BY_MODE[mode]) {
    if (isMissing(raw[field])) {
      violations.push({ field, rule: "required", message: `${field} is required in ${mode} mode` });
    }
  }
}

function checkSharedRanges(values: NumericValues, violations: VentilatorCommandViolation[]): NumericValues {
  const inRange: NumericValues = {};

  for (const field of VENTILATOR_COMMAND_NUMERIC_FIELDS) {
    const value: number | undefined = values[field];

    if (value === undefined) {
      continue;
    }

    const limit: VentilatorParameterLimit | undefined = SHARED_RANGES[field];

    if (limit && (value < limit.min || value > limit.max)) {
      violations.push({ field, rule: "out_of_range", message: `${field} ${value} is outside [${limit.min}, ${limit.max}] ${limit.unit}`, limit: { min: limit.min, max: limit.max } });

      continue;
    }

    if (field === "ieRatio" && value <= 0) {
      violations.push({ field, rule: "out_of_range", message: "ieRatio must be greater than 0", limit: { min: 0 } });

      continue;
    }

    inRange[field] = value;
  }

  return inRange;
}

function checkCoherence(values: NumericValues, safety: VentilatorCommandSafetyLimits, violations: VentilatorCommandViolation[]): void {
  const { respiratoryRate, inspiratoryTime, ieRatio, pressureLimit, peep } = values;
  let derivedIeRatio: number | undefined;

  if (respiratoryRate !== undefined && inspiratoryTime !== undefined) {
    const expiratoryTime: number = SECONDS_PER_MINUTE / respiratoryRate - inspiratoryTime;

    if (expiratoryTime < MIN_EXPIRATORY_TIME_S) {
      violations.push({
        field: "inspiratoryTime",
        rule: "expiratory_time_too_short",
        message: `expiratory time ${expiratoryTime.toFixed(2)} s is below ${MIN_EXPIRATORY_TIME_S} s`,
        limit: { min: MIN_EXPIRATORY_TIME_S },
      });
    }

    derivedIeRatio = expiratoryTime > 0 ? inspiratoryTime / expiratoryTime : undefined;
  }

  if (ieRatio !== undefined && derivedIeRatio !== undefined && Math.abs(ieRatio - derivedIeRatio) / derivedIeRatio > IE_RATIO_CONSISTENCY_TOLERANCE) {
    violations.push({
      field: "ieRatio",
      rule: "ie_ratio_inconsistent",
      message: `ieRatio ${ieRatio.toFixed(2)} does not match the ratio ${derivedIeRatio.toFixed(2)} derived from respiratoryRate and inspiratoryTime`,
    });
  }

  const effectiveIeRatio: number | undefined = ieRatio ?? derivedIeRatio;

  if (effectiveIeRatio !== undefined && effectiveIeRatio > safety.maxIeRatio) {
    violations.push({
      field: "ieRatio",
      rule: "safety_limit",
      message: `I:E ratio ${effectiveIeRatio.toFixed(2)} exceeds the safety maximum ${safety.maxIeRatio}`,
      limit: { max: safety.maxIeRatio },
    });
  }

  if (pressureLimit !== undefined && peep !== undefined && pressureLimit <= peep) {
    violations.push({ field: "pressureLimit", rule: "pressure_limit_not_above_peep", message: `pressureLimit ${pressureLimit} must be greater than peep ${peep}`, limit: { min: peep } });
  }
}

function checkSafetyLimits(values: NumericValues, safety: VentilatorCommandSafetyLimits, violations: VentilatorCommandViolation[]): void {
  const maxima: Partial<Record<VentilatorCommandNumericField, number>> = {
    tidalVolume: safety.maxTidalVolume,
    respiratoryRate: safety.maxRespiratoryRate,
    peep: safety.maxPeep,
    pressureLimit: safety.maxPressureLimit,
  };

  for (const field of VENTILATOR_COMMAND_NUMERIC_FIELDS) {
    const value: number | undefined = values[field];
    const max: number | undefined = maxima[field];

    if (value !== undefined && max !== undefined && value > max) {
      violations.push({ field, rule: "safety_limit", message: `${field} ${value} exceeds the safety maximum ${max}`, limit: { max } });
    }
  }
}
