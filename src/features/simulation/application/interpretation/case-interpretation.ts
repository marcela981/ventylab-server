/*
 * Funcionalidad: Interpretación del caso por IA (reglas puras)
 * Descripción: Parámetros del motor que la IA puede ajustar al iniciar una sesión (distensibilidad, resistencia, espacio muerto, VCO2, escala del shunt, PAM y frecuencia cardíaca basales), con su valor curado y la banda permitida (±30 % del valor curado dentro del rango fisiológico del caso clínico); historia clínica sin datos personales para el prompt; validación estricta de la respuesta JSON (valores fuera de banda o inválidos se rechazan y quedan los curados) y aplicación determinista de los valores aceptados sobre el caso del motor
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  CLINICAL_CASE_PHYSIOLOGICAL_RANGES,
  type PhysiologicalParameter,
} from "@/features/clinical-cases/domain/clinical-case-physiological-ranges";
import { type AssistCaseSummary } from "@/features/simulation/domain/assist/assist-snapshot";
import { type EngineCase, type ShuntCurvePoint } from "@/features/simulation/domain/engine";
import { type SimulatedPatient } from "@/features/simulation/domain/patient/simulated-patient";

/** The AI may only move a curated value by this fraction (and never outside the physiological range) */
export const INTERPRETATION_MAX_RELATIVE_CHANGE: number = 0.3;

const SHUNT_SCALE_RANGE: { readonly min: number; readonly max: number } = { min: 0.7, max: 1.3 };
const MAX_SHUNT_FRACTION: number = 0.9;

export type InterpretationParameter =
  | "complianceMlPerCmH2O"
  | "resistanceCmH2OPerLps"
  | "deadSpaceMl"
  | "vco2MlPerMin"
  | "shuntScale"
  | "baselineMapMmHg"
  | "baselineHeartRateBpm";

export const INTERPRETATION_PARAMETERS: readonly InterpretationParameter[] = [
  "complianceMlPerCmH2O",
  "resistanceCmH2OPerLps",
  "deadSpaceMl",
  "vco2MlPerMin",
  "shuntScale",
  "baselineMapMmHg",
  "baselineHeartRateBpm",
] as const;

export type InterpretationValues = Readonly<Record<InterpretationParameter, number>>;

export type InterpretationTrajectory = "STABLE" | "WORSENING" | "IMPROVING";

export type InterpretationSource = "LLM" | "CURATED";

/** Stored in the session patient profile so that replay and grading rebuild the same patient */
export interface CaseInterpretationRecord {
  readonly source: InterpretationSource;
  readonly promptVersion?: string;
  readonly aiCallId?: string;
  /** Values applied to the engine; equal to the curated ones when the source is CURATED */
  readonly applied: InterpretationValues;
  readonly curated: InterpretationValues;
  /** Parameters the AI proposed outside their band or with an invalid value (kept curated) */
  readonly rejected: readonly InterpretationParameter[];
  readonly trajectory?: InterpretationTrajectory;
  readonly rationale?: string;
  /** Why the curated values were kept (no provider, quota, invalid answer, exam) */
  readonly reason?: string;
}

export interface ParameterBand {
  readonly curated: number;
  readonly min: number;
  readonly max: number;
}

const RANGE_OF: Readonly<Partial<Record<InterpretationParameter, PhysiologicalParameter>>> = {
  complianceMlPerCmH2O: "complianceMlPerCmH2O",
  resistanceCmH2OPerLps: "resistanceCmH2OPerLps",
  deadSpaceMl: "deadSpaceMl",
  vco2MlPerMin: "vco2MlPerMin",
  baselineMapMmHg: "baselineMapMmHg",
  baselineHeartRateBpm: "baselineHeartRateBpm",
};

const TRAJECTORIES: readonly InterpretationTrajectory[] = ["STABLE", "WORSENING", "IMPROVING"] as const;

const RATIONALE_MAX_LENGTH: number = 600;

const DEFAULT_HEART_RATE_BPM: number = 80;

export function curatedValues(engineCase: EngineCase): InterpretationValues {
  return {
    complianceMlPerCmH2O: engineCase.mechanics.complianceMlPerCmH2O,
    resistanceCmH2OPerLps: engineCase.mechanics.resistanceCmH2OPerLps,
    deadSpaceMl: engineCase.gasExchange.deadSpaceMl,
    vco2MlPerMin: engineCase.gasExchange.vco2MlPerMin,
    shuntScale: 1,
    baselineMapMmHg: engineCase.hemodynamics.baselineMapMmHg,
    baselineHeartRateBpm: engineCase.evolution?.baselineHeartRateBpm ?? DEFAULT_HEART_RATE_BPM,
  };
}

export function parameterBands(curated: InterpretationValues): Readonly<Record<InterpretationParameter, ParameterBand>> {
  const bands: Partial<Record<InterpretationParameter, ParameterBand>> = {};

  for (const parameter of INTERPRETATION_PARAMETERS) {
    const value: number = curated[parameter];

    if (parameter === "shuntScale") {
      bands[parameter] = { curated: value, ...SHUNT_SCALE_RANGE };

      continue;
    }

    const rangeKey: PhysiologicalParameter | undefined = RANGE_OF[parameter];
    const range: { readonly min: number; readonly max: number } = rangeKey
      ? CLINICAL_CASE_PHYSIOLOGICAL_RANGES[rangeKey]
      : { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
    const spread: number = Math.abs(value) * INTERPRETATION_MAX_RELATIVE_CHANGE;

    bands[parameter] = { curated: value, min: Math.max(range.min, value - spread), max: Math.min(range.max, value + spread) };
  }

  return bands as Record<InterpretationParameter, ParameterBand>;
}

export function curatedParametersJson(curated: InterpretationValues): string {
  const bands: Readonly<Record<InterpretationParameter, ParameterBand>> = parameterBands(curated);
  const described: Record<string, { curated: number; min: number; max: number }> = {};

  for (const parameter of INTERPRETATION_PARAMETERS) {
    const band: ParameterBand = bands[parameter];

    described[parameter] = { curated: round(band.curated), min: round(band.min), max: round(band.max) };
  }

  return JSON.stringify(described);
}

/** Clinical history for the prompt: case summary and own-patient form, never the display name */
export function clinicalHistoryText(summary: AssistCaseSummary, patient?: SimulatedPatient): string {
  const lines: string[] = [`Caso: ${summary.title} (${summary.pathology}, dificultad ${summary.difficulty})`];

  if (summary.patient !== undefined) {
    const { sex, ageYears, heightCm, weightKg } = summary.patient;

    lines.push(`Paciente: ${sex === "FEMALE" ? "mujer" : "hombre"}, ${ageYears} años, ${heightCm} cm, ${weightKg} kg`);
  }

  if (summary.summary !== undefined && summary.summary.trim().length > 0) {
    lines.push(`Resumen: ${summary.summary}`);
  }

  if (patient !== undefined) {
    lines.push(`Condición: ${patient.condition}`);

    if (patient.diagnosis) {
      lines.push(`Diagnóstico: ${patient.diagnosis}`);
    }

    if (patient.history && patient.history.length > 0) {
      lines.push(`Antecedentes: ${patient.history.join("; ")}`);
    }

    const vitals: string[] = Object.entries(patient.vitals ?? {})
      .filter(([, value]: [string, unknown]): boolean => value !== undefined)
      .map(([key, value]: [string, unknown]): string => `${key}=${String(value)}`);

    if (vitals.length > 0) {
      lines.push(`Signos vitales: ${vitals.join(", ")}`);
    }
  }

  return lines.join("\n");
}

export interface ParsedInterpretation {
  readonly applied: InterpretationValues;
  readonly rejected: readonly InterpretationParameter[];
  readonly trajectory?: InterpretationTrajectory;
  readonly rationale?: string;
}

/** Strict parsing: returns undefined when the answer is not a JSON object; out-of-band values keep the curated value */
export function parseInterpretation(content: string, curated: InterpretationValues): ParsedInterpretation | undefined {
  const start: number = content.indexOf("{");
  const end: number = content.lastIndexOf("}");

  if (start < 0 || end <= start) {
    return undefined;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(content.slice(start, end + 1));
  } catch {
    return undefined;
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return undefined;
  }

  const record: Record<string, unknown> = parsed as Record<string, unknown>;
  const bands: Readonly<Record<InterpretationParameter, ParameterBand>> = parameterBands(curated);
  const applied: Record<InterpretationParameter, number> = { ...curated };
  const rejected: InterpretationParameter[] = [];

  for (const parameter of INTERPRETATION_PARAMETERS) {
    const value: unknown = record[parameter];

    if (value === undefined || value === null) {
      continue;
    }

    const band: ParameterBand = bands[parameter];

    if (typeof value !== "number" || !Number.isFinite(value) || value < band.min || value > band.max) {
      rejected.push(parameter);

      continue;
    }

    applied[parameter] = value;
  }

  const trajectory: unknown = record.trajectory;
  const rationale: unknown = record.rationale;

  return {
    applied,
    rejected,
    ...(typeof trajectory === "string" && (TRAJECTORIES as readonly string[]).includes(trajectory)
      ? { trajectory: trajectory as InterpretationTrajectory }
      : {}),
    ...(typeof rationale === "string" && rationale.trim().length > 0 ? { rationale: rationale.trim().slice(0, RATIONALE_MAX_LENGTH) } : {}),
  };
}

/** Deterministic application of accepted values on the engine case (also used on replay) */
export function applyInterpretation(engineCase: EngineCase, applied: InterpretationValues): EngineCase {
  return {
    ...engineCase,
    mechanics: {
      complianceMlPerCmH2O: applied.complianceMlPerCmH2O,
      resistanceCmH2OPerLps: applied.resistanceCmH2OPerLps,
    },
    gasExchange: {
      ...engineCase.gasExchange,
      deadSpaceMl: applied.deadSpaceMl,
      vco2MlPerMin: applied.vco2MlPerMin,
      shuntCurve: engineCase.gasExchange.shuntCurve.map(
        (point: ShuntCurvePoint): ShuntCurvePoint => ({
          peepCmH2O: point.peepCmH2O,
          shuntFraction: Math.min(MAX_SHUNT_FRACTION, point.shuntFraction * applied.shuntScale),
        }),
      ),
    },
    hemodynamics: { ...engineCase.hemodynamics, baselineMapMmHg: applied.baselineMapMmHg },
    ...(engineCase.evolution === undefined
      ? {}
      : { evolution: { ...engineCase.evolution, baselineHeartRateBpm: applied.baselineHeartRateBpm } }),
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
