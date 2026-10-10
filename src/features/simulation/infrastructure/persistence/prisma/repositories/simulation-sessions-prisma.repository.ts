/*
 * Funcionalidad: Repositorio Prisma de sesiones de simulación
 * Descripción: Implementa ISimulationSessionsRepository sobre simulation_sessions y simulation_events con PrismaService: lectura con bloqueo FOR UPDATE de la fila de la sesión, upsert de la sesión, eventos ordenados por tiempo simulado y recepción, dueños de ids de evento, inserción de eventos, listado paginado filtrado y conteo por estado con promedio de la calificación guardada en el resumen
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import {
  Prisma,
  type SimulationEvent as SimulationEventModel,
  type SimulationSession as SimulationSessionModel,
} from "@prisma/client";

import { Paginated } from "@/common/domain/utils/paginated";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import {
  type SimulationEventRecord,
  type SimulationSessionStatusCount,
} from "@/features/simulation/domain/read-models/simulation-session.read-model";
import {
  type GetSimulationSessionsQuery,
  type ISimulationSessionsRepository,
} from "@/features/simulation/domain/repositories/simulation-sessions.repository";
import { type SimulationSessionStatusValue } from "@/features/simulation/domain/value-objects/simulation-session-values";
import { SimulationSessionsMapper } from "@/features/simulation/infrastructure/persistence/prisma/mappers/simulation-sessions.mapper";

interface StatusCountRow {
  readonly status: string;
  readonly count: number;
  readonly scored_count: number;
  readonly average_score: number | null;
}

@Injectable()
export class SimulationSessionsPrismaRepository implements ISimulationSessionsRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getById(id: string, transaction?: unknown): Promise<SimulationSession | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: SimulationSessionModel | null = await client.simulationSession.findUnique({ where: { id } });

    return row ? SimulationSessionsMapper.toDomain(row) : undefined;
  }

  public async getByIdForUpdate(id: string, transaction: unknown): Promise<SimulationSession | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.$executeRaw`SELECT id FROM simulation_sessions WHERE id = ${id} FOR UPDATE`;

    return await this.getById(id, transaction);
  }

  public async save(session: SimulationSession, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.SimulationSessionUncheckedCreateInput = SimulationSessionsMapper.toPersistence(session);

    await client.simulationSession.upsert({ where: { id: session.id }, create: data, update: data });
  }

  public async getEvents(sessionId: string, transaction?: unknown): Promise<SimulationEventRecord[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const rows: SimulationEventModel[] = await client.simulationEvent.findMany({
      where: { sessionId },
      orderBy: [{ simTimeMs: "asc" }, { receivedAt: "asc" }, { id: "asc" }],
    });

    return rows.map((row: SimulationEventModel): SimulationEventRecord => SimulationSessionsMapper.eventToRecord(row));
  }

  public async getEventSessionIds(eventIds: readonly string[], transaction?: unknown): Promise<Map<string, string>> {
    if (eventIds.length === 0) {
      return new Map<string, string>();
    }

    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const rows: { id: string; sessionId: string }[] = await client.simulationEvent.findMany({
      where: { id: { in: [...eventIds] } },
      select: { id: true, sessionId: true },
    });

    return new Map<string, string>(rows.map((row: { id: string; sessionId: string }): [string, string] => [row.id, row.sessionId]));
  }

  public async insertEvents(events: readonly SimulationEventRecord[], transaction?: unknown): Promise<void> {
    if (events.length === 0) {
      return;
    }

    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.simulationEvent.createMany({
      data: events.map((event: SimulationEventRecord): Prisma.SimulationEventCreateManyInput => SimulationSessionsMapper.eventToPersistence(event)),
    });
  }

  public async getAll(query: GetSimulationSessionsQuery): Promise<Paginated<SimulationSession>> {
    const { page, limit, userId, caseId, mode, status, sortOrder, createdAtFrom, createdAtTo, ids } = query;

    const where: Prisma.SimulationSessionWhereInput = { userId };

    if (caseId) where.caseId = caseId;
    if (mode) where.mode = mode;
    if (status) where.status = status;
    if (ids && ids.length > 0) where.id = { in: ids };

    if (createdAtFrom || createdAtTo) {
      where.startedAt = { gte: createdAtFrom, lte: createdAtTo };
    }

    const [rows, total]: [SimulationSessionModel[], number] = await Promise.all([
      this._prisma.simulationSession.findMany({
        where,
        orderBy: { startedAt: sortOrder === "asc" ? "asc" : "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this._prisma.simulationSession.count({ where }),
    ]);

    return new Paginated<SimulationSession>({
      items: rows.map((row: SimulationSessionModel): SimulationSession => SimulationSessionsMapper.toDomain(row)),
      total,
      page,
      limit,
    });
  }

  public async countByStatusForUsers(userIds: readonly string[]): Promise<SimulationSessionStatusCount[]> {
    if (userIds.length === 0) {
      return [];
    }

    const rows: StatusCountRow[] = await this._prisma.$queryRaw<StatusCountRow[]>`
      SELECT status::text AS status,
             count(*)::int AS count,
             count(summary->>'score')::int AS scored_count,
             avg((summary->>'score')::float8) AS average_score
      FROM simulation_sessions
      WHERE user_id IN (${Prisma.join([...userIds])})
      GROUP BY status
    `;

    return rows.map(
      (row: StatusCountRow): SimulationSessionStatusCount => ({
        status: row.status as SimulationSessionStatusValue,
        count: Number(row.count),
        scoredCount: Number(row.scored_count),
        averageScore: row.average_score === null ? null : Number(row.average_score),
      }),
    );
  }
}
