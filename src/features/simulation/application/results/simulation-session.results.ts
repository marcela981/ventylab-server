/*
 * Funcionalidad: Resultados de las sesiones de simulación
 * Descripción: Salidas de los casos de uso de sesiones con eventos: sesión iniciada con el caso del motor, eventos aceptados y duplicados, estado actual repetido en el servidor, repetición completa, resumen calificado, prueba de caso y estadísticas de grupo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type Alarm,
  type EngineCase,
  type EngineMetrics,
  type TargetStatus,
  type VentilatorSettings,
} from "@/features/simulation/domain/engine";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import {
  type SimulationEventRecord,
  type SimulationSessionSummary,
} from "@/features/simulation/domain/read-models/simulation-session.read-model";
import { type SimulationScoreBreakdownItem } from "@/features/simulation/domain/scoring";

export interface StartSimulationSessionResult {
  readonly session: SimulationSession;
  readonly expiresAt?: Date;
  readonly engineCase: EngineCase;
}

export interface AppendSimulationEventsResult {
  readonly accepted: number;
  readonly duplicates: number;
  readonly lastSimTimeMs: number;
}

export interface SimulationSessionStateResult {
  readonly session: SimulationSession;
  readonly expiresAt?: Date;
  readonly simTimeMs: number;
  readonly settings: VentilatorSettings;
  readonly metrics: EngineMetrics;
  readonly alarms: readonly Alarm[];
  readonly targets: readonly TargetStatus[];
}

export interface SimulationSessionReplayResult {
  readonly session: SimulationSession;
  readonly engineCase: EngineCase;
  readonly events: readonly SimulationEventRecord[];
  readonly currentEngineVersion: string;
  readonly engineVersionMismatch: boolean;
}

export interface SimulationSessionSummaryResult {
  readonly session: SimulationSession;
  readonly summary: SimulationSessionSummary;
}

export interface ClinicalCaseTestRunResult {
  readonly engineVersion: string;
  readonly seconds: number;
  readonly seed: number;
  readonly metricsTimeline: readonly EngineMetrics[];
}

export type SimulationSessionScoreResult =
  | { readonly available: true; readonly score: number; readonly breakdown: readonly SimulationScoreBreakdownItem[] }
  | { readonly available: false; readonly reason: string };

export interface SimulationGroupSessionStats {
  readonly groupId: string;
  readonly memberCount: number;
  readonly totalSessions: number;
  readonly activeSessions: number;
  readonly endedSessions: number;
  readonly abandonedSessions: number;
  readonly averageScore: number | null;
}
