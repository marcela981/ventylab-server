/*
 * Funcionalidad: Modelos de lectura de las sesiones de simulación
 * Descripción: Forma de un evento persistido de una sesión (id, tiempo simulado, tipo, payload saneado y recepción), del resumen calculado por el servidor al terminar, de la vista pública de una sesión y de las estadísticas agregadas de sesiones por estado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EngineMetrics, type TargetStatus, type TimeMultiplier } from "@/features/simulation/domain/engine";
import { type SimulationScoreBreakdownItem } from "@/features/simulation/domain/scoring";
import {
  type SimulationEventTypeValue,
  type SimulationModeValue,
  type SimulationSessionStatusValue,
} from "@/features/simulation/domain/value-objects/simulation-session-values";

export interface SimulationEventRecord {
  readonly id: string;
  readonly sessionId: string;
  readonly simTimeMs: number;
  readonly type: SimulationEventTypeValue;
  readonly payload: Record<string, unknown>;
  readonly receivedAt: Date;
}

export interface SimulationSessionSummary {
  readonly engineVersion: string;
  readonly simTimeMs: number;
  readonly durationMs: number;
  readonly finalMetrics: EngineMetrics;
  readonly targets: readonly TargetStatus[];
  readonly score: number;
  readonly breakdown: readonly SimulationScoreBreakdownItem[];
  readonly aiHelpCount: number;
}

export interface SimulationSessionStatusCount {
  readonly status: SimulationSessionStatusValue;
  readonly count: number;
  readonly scoredCount: number;
  readonly averageScore: number | null;
}

export interface SimulationSessionView {
  readonly id: string;
  readonly userId: string;
  readonly caseId: string;
  readonly mode: SimulationModeValue;
  readonly attemptId?: string;
  readonly questionId?: string;
  readonly engineVersion: string;
  readonly timeMultiplier: TimeMultiplier;
  readonly status: SimulationSessionStatusValue;
  readonly startedAt: Date;
  readonly endedAt?: Date;
  readonly lastEventAt: Date;
  readonly lastSimTimeMs: number;
  readonly score?: number;
}
