/*
 * Funcionalidad: Mapper de persistencia de sesiones de simulación
 * Descripción: Convierte filas de simulation_sessions y simulation_events en la entidad SimulationSession y en registros de evento, y viceversa; el resumen y los payloads se guardan como JSON
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type Prisma,
  type SimulationEvent as SimulationEventModel,
  type SimulationSession as SimulationSessionModel,
} from "@prisma/client";

import { type TimeMultiplier } from "@/features/simulation/domain/engine";
import { SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import {
  type SimulationEventRecord,
  type SimulationSessionSummary,
} from "@/features/simulation/domain/read-models/simulation-session.read-model";
import { isTimeMultiplier } from "@/features/simulation/domain/value-objects/simulation-session-values";

const DEFAULT_TIME_MULTIPLIER: TimeMultiplier = 1;

export class SimulationSessionsMapper {
  public static toDomain(row: SimulationSessionModel): SimulationSession {
    return SimulationSession.reconstitute({
      id: row.id,
      userId: row.userId,
      caseId: row.caseId,
      mode: row.mode,
      attemptId: row.attemptId ?? undefined,
      questionId: row.questionId ?? undefined,
      seed: row.seed,
      engineVersion: row.engineVersion,
      timeMultiplier: isTimeMultiplier(row.timeMultiplier) ? row.timeMultiplier : DEFAULT_TIME_MULTIPLIER,
      status: row.status,
      startedAt: row.startedAt,
      endedAt: row.endedAt ?? undefined,
      lastEventAt: row.lastEventAt,
      lastSimTimeMs: row.lastSimTimeMs,
      summary: SimulationSessionsMapper._isRecord(row.summary) ? (row.summary as unknown as SimulationSessionSummary) : undefined,
    });
  }

  public static toPersistence(session: SimulationSession): Prisma.SimulationSessionUncheckedCreateInput {
    return {
      id: session.id,
      userId: session.userId,
      caseId: session.caseId,
      mode: session.mode,
      attemptId: session.attemptId ?? null,
      questionId: session.questionId ?? null,
      seed: session.seed,
      engineVersion: session.engineVersion,
      timeMultiplier: session.timeMultiplier,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt ?? null,
      lastEventAt: session.lastEventAt,
      lastSimTimeMs: session.lastSimTimeMs,
      summary: session.summary ? (session.summary as unknown as Prisma.InputJsonValue) : undefined,
    };
  }

  public static eventToRecord(row: SimulationEventModel): SimulationEventRecord {
    return {
      id: row.id,
      sessionId: row.sessionId,
      simTimeMs: row.simTimeMs,
      type: row.type,
      payload: SimulationSessionsMapper._isRecord(row.payload) ? (row.payload as Record<string, unknown>) : {},
      receivedAt: row.receivedAt,
    };
  }

  public static eventToPersistence(record: SimulationEventRecord): Prisma.SimulationEventCreateManyInput {
    return {
      id: record.id,
      sessionId: record.sessionId,
      simTimeMs: record.simTimeMs,
      type: record.type,
      payload: record.payload as Prisma.InputJsonObject,
      receivedAt: record.receivedAt,
    };
  }

  private static _isRecord(value: Prisma.JsonValue | null): boolean {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
