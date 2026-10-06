/*
 * Funcionalidad: Repositorio Prisma de sesiones del simulador
 * Descripción: Implementa ISimulatorSessionsRepository sobre simulator_sessions con PrismaService: listado por usuario ordenado por inicio descendente con límite opcional y upsert con auditoría
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type Prisma, type SimulatorSession as SimulatorSessionModel } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  SIMULATOR_SESSION_COLLECTION,
  SIMULATOR_SESSION_TYPE,
  type SimulatorSession,
} from "@/features/simulation/domain/entities/simulator-session.entity";
import { type ISimulatorSessionsRepository } from "@/features/simulation/domain/repositories/simulator-sessions.repository";
import { SimulatorSessionsMapper } from "@/features/simulation/infrastructure/persistence/prisma/mappers/simulator-sessions.mapper";

@Injectable()
export class SimulatorSessionsPrismaRepository implements ISimulatorSessionsRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getByUser(userId: string, limit?: number): Promise<SimulatorSession[]> {
    const rows: SimulatorSessionModel[] = await this._prisma.simulatorSession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      ...(limit !== undefined ? { take: limit } : {}),
    });

    return rows.map((row: SimulatorSessionModel) => SimulatorSessionsMapper.toDomain(row));
  }

  public async save(session: SimulatorSession, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.SimulatorSessionUncheckedCreateInput = SimulatorSessionsMapper.toPersistence(session);

    await client.simulatorSession.upsert({
      where: { id: session.id },
      create: data,
      update: data,
    });

    if (session.auditLogs.length > 0) {
      await this._auditLogRepository.save(SIMULATOR_SESSION_COLLECTION, SIMULATOR_SESSION_TYPE, session.id, session.auditLogs, transaction);
    }
  }
}
