/*
 * Funcionalidad: Debriefing de una sesión de simulación
 * Descripción: Construye a partir de la repetición del servidor el desenlace del paciente (estado final y momentos de inicio crítico, paro y fallecimiento) y la línea de tiempo del debriefing: decisiones del estudiante (cambios de parámetros con valor anterior y nuevo), aparición de alarmas y cambios de estado del paciente, ordenada por tiempo simulado y acotada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type Alarm,
  type EngineEvent,
  type EngineMetrics,
  type PatientStatus,
  type ReplayResult,
  type VentilatorSettings,
} from "@/features/simulation/domain/engine";

export const DEBRIEF_TIMELINE_MAX_ITEMS: number = 200;

export interface SimulationOutcome {
  /** Null for sessions without patient evolution (engine 1.0.0) */
  readonly status: PatientStatus | null;
  readonly firstCriticalAtMs: number | null;
  readonly arrestAtMs: number | null;
  readonly deceasedAtMs: number | null;
}

export interface SettingChange {
  readonly field: string;
  readonly from: number | string | null;
  readonly to: number | string;
}

export type DebriefItemKind = "DECISION" | "ALARM" | "PATIENT_STATUS";

export interface DebriefTimelineItem {
  readonly simTimeMs: number;
  readonly kind: DebriefItemKind;
  /** Alarm code or patient status; absent for decisions */
  readonly code?: string;
  /** Changed settings of a decision */
  readonly changes?: readonly SettingChange[];
}

export interface SessionDebrief {
  readonly outcome: SimulationOutcome;
  readonly timeline: readonly DebriefTimelineItem[];
}

const KIND_ORDER: Readonly<Record<DebriefItemKind, number>> = { DECISION: 0, PATIENT_STATUS: 1, ALARM: 2 };

export function buildSessionDebrief(
  result: ReplayResult,
  events: readonly EngineEvent[],
  initialSettings: Partial<VentilatorSettings>,
): SessionDebrief {
  const items: DebriefTimelineItem[] = [
    ...decisionItems(events, initialSettings),
    ...statusItems(result.metricsTimeline),
    ...alarmOnsetItems(result.metricsTimeline),
  ];

  items.sort(
    (a: DebriefTimelineItem, b: DebriefTimelineItem): number => a.simTimeMs - b.simTimeMs || KIND_ORDER[a.kind] - KIND_ORDER[b.kind],
  );

  return { outcome: outcomeOf(result.final), timeline: items.slice(0, DEBRIEF_TIMELINE_MAX_ITEMS) };
}

function outcomeOf(final: EngineMetrics): SimulationOutcome {
  const patient: EngineMetrics["patient"] = final.patient;

  return {
    status: patient?.status ?? null,
    firstCriticalAtMs: patient?.firstCriticalAtMs ?? null,
    arrestAtMs: patient?.arrestAtMs ?? null,
    deceasedAtMs: patient?.deceasedAtMs ?? null,
  };
}

function decisionItems(events: readonly EngineEvent[], initialSettings: Partial<VentilatorSettings>): DebriefTimelineItem[] {
  const current: Record<string, number | string> = { ...initialSettings };
  const ordered: EngineEvent[] = [...events].sort((a: EngineEvent, b: EngineEvent): number => a.simTimeMs - b.simTimeMs);
  const items: DebriefTimelineItem[] = [];

  for (const event of ordered) {
    if (event.type !== "PARAM_CHANGE") {
      continue;
    }

    const changes: SettingChange[] = [];

    for (const [field, value] of Object.entries(event.changes)) {
      if (value === undefined || current[field] === value) {
        continue;
      }

      changes.push({ field, from: current[field] ?? null, to: value });
      current[field] = value;
    }

    if (changes.length > 0) {
      items.push({ simTimeMs: event.simTimeMs, kind: "DECISION", changes });
    }
  }

  return items;
}

function statusItems(timeline: readonly EngineMetrics[]): DebriefTimelineItem[] {
  const items: DebriefTimelineItem[] = [];
  let previous: PatientStatus = "STABLE";

  for (const metrics of timeline) {
    const status: PatientStatus | undefined = metrics.patient?.status;

    if (status !== undefined && status !== previous) {
      items.push({ simTimeMs: metrics.simTimeMs, kind: "PATIENT_STATUS", code: status });
      previous = status;
    }
  }

  return items;
}

function alarmOnsetItems(timeline: readonly EngineMetrics[]): DebriefTimelineItem[] {
  const items: DebriefTimelineItem[] = [];
  let active: Set<string> = new Set<string>();

  for (const metrics of timeline) {
    const codes: Set<string> = new Set<string>(metrics.alarms.map((alarm: Alarm): string => alarm.code));

    for (const code of codes) {
      if (!active.has(code)) {
        items.push({ simTimeMs: metrics.simTimeMs, kind: "ALARM", code });
      }
    }

    active = codes;
  }

  return items;
}
