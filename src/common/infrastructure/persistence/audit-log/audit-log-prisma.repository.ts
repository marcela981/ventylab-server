/*
 * Funcionalidad: Repositorio AuditLogPrismaRepository
 * Descripción: Implementa IAuditLogRepository con Prisma sobre la tabla audit_logs (solo inserción): completa rol del actor, identificador de petición e IP desde RequestContextService cuando el registro no los trae, añade el agente HTTP a metadata (con el referer sin query string ni fragmento) y protege before, after y metadata ocultando secretos y resumiendo textos largos o enriquecidos con su sha256
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { type AuditPayload, protectAuditPayload } from "@/common/domain/audit/audit-payload";
import { AuditLog } from "@/common/domain/entities/audit-log.entity";
import { IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import {
  RequestAgentInfo,
  RequestContext,
  RequestContextService,
} from "@/common/infrastructure/context/request-context.service";
import { resolveClient, type PrismaExecutor } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";

function withoutRefererQuery(agent: RequestAgentInfo): RequestAgentInfo {
  return agent.referer === undefined ? agent : { ...agent, referer: agent.referer.split(/[?#]/)[0] };
}

function toJsonColumn(payload: AuditPayload | undefined): Prisma.InputJsonObject | typeof Prisma.DbNull {
  return payload ? (protectAuditPayload(payload) as Prisma.InputJsonObject) : Prisma.DbNull;
}

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
      const metadata: AuditPayload | undefined = context
        ? { ...(log.metadata ?? {}), agent: withoutRefererQuery(context.agent) }
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
        metadata: toJsonColumn(metadata),
        actorRole: log.actorRole ?? context?.actorRole ?? null,
        before: toJsonColumn(log.before),
        after: toJsonColumn(log.after),
        reason: log.reason ?? null,
        requestId: log.requestId ?? context?.traceId ?? null,
        ip: log.ip ?? context?.agent.ip ?? null,
      };
    });

    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.auditLog.createMany({ data: rows });
  }
}
