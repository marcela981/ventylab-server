/*
 * Funcionalidad: Repositorio Prisma SimulationAnalyticsPrismaRepository
 * Descripción: Implementa ISimulationAnalyticsRepository con $queryRaw parametrizado sobre simulation_sessions: una sola consulta agrupada por usuario con IN para el conteo, el puntaje promedio (summary.score) y el tiempo promedio de estabilización (valor del criterio TIME_TO_STABILIZE del desglose persistido en summary.breakdown; las sesiones sin resumen o que nunca se estabilizaron no entran en el promedio), y las sesiones de un usuario iniciadas en un rango con su puntaje persistido
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type ISimulationAnalyticsRepository,
  type SimulationSessionActivityView,
  type SimulationUserSessionStats,
} from "@/features/simulation/domain/repositories/simulation-analytics.repository";
import { type SimulationModeValue, type SimulationSessionStatusValue } from "@/features/simulation/domain/value-objects/simulation-session-values";

interface UserStatsRow {
  readonly user_id: string;
  readonly session_count: number | bigint;
  readonly scored_count: number | bigint;
  readonly average_score: number | null;
  readonly stabilized_count: number | bigint;
  readonly average_time_to_stabilize_s: number | null;
}

interface ActivityRow {
  readonly id: string;
  readonly case_id: string;
  readonly mode: string;
  readonly status: string;
  readonly started_at: Date;
  readonly ended_at: Date | null;
  readonly score: number | null;
}

@Injectable()
export class SimulationAnalyticsPrismaRepository implements ISimulationAnalyticsRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getSessionStatsForUsers(userIds: readonly string[]): Promise<SimulationUserSessionStats[]> {
    if (userIds.length === 0) {
      return [];
    }

    const rows: UserStatsRow[] = await this._prisma.$queryRaw<UserStatsRow[]>(Prisma.sql`
      SELECT s.user_id,
             count(*)::int AS session_count,
             count(s.summary->>'score')::int AS scored_count,
             avg((s.summary->>'score')::float8) AS average_score,
             count(t.seconds)::int AS stabilized_count,
             avg(t.seconds) AS average_time_to_stabilize_s
      FROM simulation_sessions s
      LEFT JOIN LATERAL (
        SELECT (item->>'value')::float8 AS seconds
        FROM jsonb_array_elements(
          CASE WHEN jsonb_typeof(s.summary->'breakdown') = 'array' THEN s.summary->'breakdown' ELSE '[]'::jsonb END
        ) AS item
        WHERE item->>'criterion' = 'TIME_TO_STABILIZE' AND jsonb_typeof(item->'value') = 'number'
        LIMIT 1
      ) t ON true
      WHERE s.user_id IN (${Prisma.join([...new Set<string>(userIds)])})
      GROUP BY s.user_id
    `);

    return rows.map(
      (row: UserStatsRow): SimulationUserSessionStats => ({
        userId: row.user_id,
        sessionCount: Number(row.session_count),
        scoredCount: Number(row.scored_count),
        averageScore: row.average_score === null ? null : Number(row.average_score),
        stabilizedCount: Number(row.stabilized_count),
        averageTimeToStabilizeSeconds: row.average_time_to_stabilize_s === null ? null : Number(row.average_time_to_stabilize_s),
      }),
    );
  }

  public async getSessionActivityOfUser(userId: string, from: Date, to: Date, limit: number): Promise<SimulationSessionActivityView[]> {
    const rows: ActivityRow[] = await this._prisma.$queryRaw<ActivityRow[]>(Prisma.sql`
      SELECT id, case_id, mode::text AS mode, status::text AS status, started_at, ended_at, (summary->>'score')::float8 AS score
      FROM simulation_sessions
      WHERE user_id = ${userId} AND started_at >= ${from} AND started_at < ${to}
      ORDER BY started_at DESC, id ASC
      LIMIT ${limit}
    `);

    return rows.map(
      (row: ActivityRow): SimulationSessionActivityView => ({
        sessionId: row.id,
        caseId: row.case_id,
        mode: row.mode as SimulationModeValue,
        status: row.status as SimulationSessionStatusValue,
        startedAt: row.started_at,
        endedAt: row.ended_at ?? undefined,
        score: row.score === null ? undefined : Number(row.score),
      }),
    );
  }
}
