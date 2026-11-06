/*
 * Funcionalidad: Validador de coherencia de la respuesta de la IA del simulador
 * Descripción: Revisa de forma determinista una respuesta completa de SIM_ASSIST o SIM_ALARM_HELP contra el estado actual que recibió: con el paciente crítico (estado CRITICAL o más grave, gravedad desde CRITICAL_SEVERITY o alguna alarma de prioridad alta) rechaza una respuesta que afirme estabilidad (patrones en español e inglés, sin contar las negaciones ni "inestable"), y en cualquier estado rechaza una respuesta que cite SpO2, PaO2, PaCO2, pH, PAM o FC con un valor lejos del actual, salvo que coincida con un punto de la tendencia o un límite de los objetivos (la IA puede decir "bajó de 89 % a 72 %")
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EngineMetrics, type TargetStatus } from "../engine";

import { type AssistTrendPoint } from "./assist-snapshot";
import { isCriticalState } from "./assist-state-snapshot";

/** Telemetry reason of an answer the validator discarded */
export const INCONSISTENCY_REJECTION_REASON: string = "inconsistency";

export type AssistIncoherence = "CLAIMS_STABLE" | "WRONG_VITAL";

export interface AssistCoherenceIssue {
  readonly kind: AssistIncoherence;
  readonly detail: string;
}

export interface AssistCoherenceState {
  readonly metrics: EngineMetrics;
  readonly trends?: readonly AssistTrendPoint[];
  readonly targets?: readonly TargetStatus[];
}

interface VitalRule {
  readonly id: string;
  /** Captures the number that follows the vital name (up to a few connector words) */
  readonly pattern: RegExp;
  readonly tolerance: number;
  readonly current: (metrics: EngineMetrics) => number | null;
  readonly trend: (point: AssistTrendPoint) => number | null;
  readonly targetId?: TargetStatus["id"];
}

const NUMBER: string = "(\\d{1,3}(?:[.,]\\d{1,2})?)";
// "SpO2 en 89 %", "SpO₂: 89%", "SpO2 de 89", "SpO2 of 89 %", "SpO2 at 89", "SpO2 ≈ 89"; no match across a sentence end.
const CONNECTOR: string = "(?:\\s*(?:\\(|:|=|≈|~|de|del|en|es|está|esta|of|at|is|around|cerca de|alrededor de|actual|current|ahora|now)\\s*){0,3}";

const VITAL_RULES: readonly VitalRule[] = [
  {
    id: "SpO2",
    pattern: new RegExp(`\\bspo(?:2|₂)${CONNECTOR}${NUMBER}\\s*%?`, "giu"),
    tolerance: 4,
    current: (metrics: EngineMetrics) => metrics.gasExchange.spo2Percent,
    trend: (point: AssistTrendPoint) => point.spo2Percent,
    targetId: "SPO2",
  },
  {
    id: "PaO2",
    pattern: new RegExp(`\\bpao(?:2|₂)${CONNECTOR}${NUMBER}`, "giu"),
    tolerance: 12,
    current: (metrics: EngineMetrics) => metrics.gasExchange.pao2MmHg,
    trend: () => null,
  },
  {
    id: "PaCO2",
    pattern: new RegExp(`\\bpaco(?:2|₂)${CONNECTOR}${NUMBER}`, "giu"),
    tolerance: 6,
    current: (metrics: EngineMetrics) => metrics.gasExchange.paco2MmHg,
    trend: (point: AssistTrendPoint) => point.paco2MmHg,
    targetId: "PACO2",
  },
  {
    id: "pH",
    pattern: new RegExp(`\\bph${CONNECTOR}(\\d[.,]\\d{1,2})`, "giu"),
    tolerance: 0.06,
    current: (metrics: EngineMetrics) => metrics.gasExchange.ph,
    trend: (point: AssistTrendPoint) => point.ph,
    targetId: "PH",
  },
  {
    id: "MAP",
    pattern: new RegExp(`\\b(?:pam|map|presión arterial media|mean arterial pressure)${CONNECTOR}${NUMBER}`, "giu"),
    tolerance: 8,
    current: (metrics: EngineMetrics) => metrics.hemodynamics.meanArterialPressureMmHg,
    trend: (point: AssistTrendPoint) => point.mapMmHg,
  },
  {
    id: "HR",
    pattern: new RegExp(`\\b(?:fc|hr|frecuencia cardíaca|frecuencia cardiaca|heart rate)${CONNECTOR}${NUMBER}`, "giu"),
    tolerance: 12,
    current: (metrics: EngineMetrics) => metrics.hemodynamics.heartRateBpm,
    trend: (point: AssistTrendPoint) => point.heartRateBpm,
  },
];

// Stability claims; "inestable"/"unstable" never match (no word boundary inside the word).
const STABILITY_PATTERNS: readonly RegExp[] = [
  /\b(?:est[aá]|se encuentra|se mantiene|permanece|contin[uú]a|sigue|luce|parece)\s+(?:\p{L}+\s+){0,2}?estable\b/iu,
  /\bpaciente\s+(?:\p{L}+\s+){0,2}?estable\b/iu,
  /\b(?:hemodin[aá]micamente|cl[ií]nicamente|respiratoriamente)\s+estable\b/iu,
  /\b(?:estado|situaci[oó]n|condici[oó]n)\s+(?:\p{L}+\s+){0,2}?estable\b/iu,
  /\bestabilidad\s+(?:cl[ií]nica|hemodin[aá]mica|del paciente)\b/iu,
  /\b(?:is|remains|appears|looks|stays|seems)\s+(?:\p{L}+\s+){0,2}?stable\b/iu,
  /\b(?:hemodynamically|clinically)\s+stable\b/iu,
  /\bstable\s+(?:patient|condition|state)\b/iu,
  /\bdentro de (?:los )?(?:rangos?|valores?|l[ií]mites?) normales\b/iu,
  /\bwithin normal (?:range|limits)\b/iu,
];

const NEGATION: RegExp = /\b(?:no|nada|ni|not|never|isn['’]t|is not|no está|no se encuentra|lejos de)\b[^.!?\n]{0,25}$/iu;

function parseNumber(raw: string): number {
  return Number(raw.replace(",", "."));
}

function claimsStability(answer: string): string | undefined {
  for (const pattern of STABILITY_PATTERNS) {
    for (const match of answer.matchAll(new RegExp(pattern.source, `${pattern.flags}g`))) {
      const index: number = match.index ?? 0;
      // The words before the claim (and the claim without its last word): "no está estable", "is not stable".
      const lead: string = `${answer.slice(Math.max(0, index - 30), index)}${match[0].replace(/\S+$/u, "")}`;

      if (!NEGATION.test(lead)) {
        return match[0];
      }
    }
  }

  return undefined;
}

/** A target bound counts only when cited exactly (the answer names the objective, not a reading) */
const TARGET_BOUND_TOLERANCE_FRACTION: number = 0.125;

interface PlausibleValue {
  readonly value: number;
  readonly tolerance: number;
}

function plausibleValues(rule: VitalRule, state: AssistCoherenceState): PlausibleValue[] {
  const values: PlausibleValue[] = [];
  const current: number | null = rule.current(state.metrics);

  if (current !== null) {
    values.push({ value: current, tolerance: rule.tolerance });
  }

  for (const point of state.trends ?? []) {
    const value: number | null = rule.trend(point);

    if (value !== null) {
      values.push({ value, tolerance: rule.tolerance });
    }
  }

  const target: TargetStatus | undefined = rule.targetId === undefined ? undefined : state.targets?.find((entry: TargetStatus) => entry.id === rule.targetId);

  for (const bound of [target?.min, target?.max]) {
    if (bound !== null && bound !== undefined) {
      values.push({ value: bound, tolerance: rule.tolerance * TARGET_BOUND_TOLERANCE_FRACTION });
    }
  }

  return values;
}

function wrongVital(answer: string, state: AssistCoherenceState): string | undefined {
  for (const rule of VITAL_RULES) {
    const values: PlausibleValue[] = plausibleValues(rule, state);

    if (values.length === 0) {
      continue;
    }

    for (const match of answer.matchAll(rule.pattern)) {
      const cited: number = parseNumber(match[1]);
      // "SpO2 88-95 %" or "88–95" cites a range (a target), not a reading.
      const following: string = answer.slice((match.index ?? 0) + match[0].length, (match.index ?? 0) + match[0].length + 2);

      if (!Number.isFinite(cited) || /^\s?[-–]/u.test(following)) {
        continue;
      }

      if (!values.some((plausible: PlausibleValue): boolean => Math.abs(plausible.value - cited) <= plausible.tolerance)) {
        return `${rule.id} ${match[1]} (current ${Math.round((rule.current(state.metrics) ?? 0) * 100) / 100})`;
      }
    }
  }

  return undefined;
}

/** The first incoherence of an answer with the current state, or undefined when it is coherent */
export function checkAssistCoherence(answer: string, state: AssistCoherenceState): AssistCoherenceIssue | undefined {
  if (isCriticalState(state.metrics)) {
    const claim: string | undefined = claimsStability(answer);

    if (claim !== undefined) {
      return { kind: "CLAIMS_STABLE", detail: claim };
    }
  }

  const vital: string | undefined = wrongVital(answer, state);

  return vital === undefined ? undefined : { kind: "WRONG_VITAL", detail: vital };
}
