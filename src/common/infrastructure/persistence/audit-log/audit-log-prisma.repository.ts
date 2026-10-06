/*
 * Funcionalidad: Repositorio AuditLogPrismaRepository
 * Descripción: Implementa IAuditLogRepository con Prisma sobre la tabla audit_logs
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AuditLog } from "@/common/domain/entities/audit-log.entity";
import { IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import {
  RequestContext,
  RequestContextService,
} from "@/common/infrastructure/context/request-context.service";
import { resolveClient, type PrismaExecutor } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";

@Injectable()
export class AuditLogPrismaRepository implements IAuditLogRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    private readonly _requestContextService: RequestContextService,
  ) {}

  public async save(
    entityCollection: string,
    entityType: string,
    entityId: string,
    logs: ReadonlyArray<AuditLog>,
    transaction?: unknown,
  ): Promise<void> {
    if (logs.length === 0) return;

    const context: RequestContext | undefined = this._requestContextService.get();

    const rows: Prisma.AuditLogCreateManyInput[] = logs.map((log: AuditLog) => {
      const metadata: Record<string, unknown> | undefined = context
        ? { ...(log.metadata ?? {}), agent: context.agent }
        : log.metadata;

      return {
        id: log.id,
        entityType,
        entityCollection,
        entityId,
        action: log.action,
        description: log.description ?? null,
        performedByUserId: log.performedByUserId ?? null,
        performedAt: log.performedAt,
        metadata: metadata ? (metadata as Prisma.InputJsonObject) : Prisma.DbNull,
      };
    });

    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.auditLog.createMany({ data: rows });
  }
}
