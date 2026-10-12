/*
 * Funcionalidad: Repositorio AuditLogQueriesPrismaRepository
 * Descripción: Implementa IAuditLogQueriesRepository con Prisma sobre audit_logs en modo solo lectura: búsqueda e historial paginados en base de datos (página y conteo en paralelo con el mismo filtro, orden por performed_at e id) y filas de exportación en orden cronológico con límite
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type AuditLog as AuditLogModel, type Prisma } from "@prisma/client";

import { Paginated } from "@/common/domain/utils/paginated";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type AuditLogEntryView,
  type AuditLogFilters,
  type AuditLogPage,
  type AuditLogSearchQuery,
} from "@/features/audit-log/domain/read-models/audit-log-entry.read-model";
import { type IAuditLogQueriesRepository } from "@/features/audit-log/domain/repositories/audit-log-queries.repository";
import { AuditLogQueriesMapper } from "@/features/audit-log/infrastructure/persistence/prisma/mappers/audit-log-queries.mapper";

@Injectable()
export class AuditLogQueriesPrismaRepository implements IAuditLogQueriesRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async search(query: AuditLogSearchQuery): Promise<Paginated<AuditLogEntryView>> {
    return await this._paginate(AuditLogQueriesMapper.toWhere(query), query);
  }

  public async getTargetHistory(targetType: string, targetId: string, page: AuditLogPage): Promise<Paginated<AuditLogEntryView>> {
    return await this._paginate(AuditLogQueriesMapper.toWhere({ targetType, targetId }), page);
  }

  public async getExportRows(filters: AuditLogFilters, limit: number): Promise<AuditLogEntryView[]> {
    const rows: AuditLogModel[] = await this._prisma.auditLog.findMany({
      where: AuditLogQueriesMapper.toWhere(filters),
      orderBy: [{ performedAt: "asc" }, { id: "asc" }],
      take: limit,
    });

    return rows.map((row: AuditLogModel) => AuditLogQueriesMapper.toView(row));
  }

  private async _paginate(where: Prisma.AuditLogWhereInput, page: AuditLogPage): Promise<Paginated<AuditLogEntryView>> {
    const direction: Prisma.SortOrder = page.sortOrder === "asc" ? "asc" : "desc";

    const [rows, total] = await Promise.all([
      this._prisma.auditLog.findMany({
        where,
        orderBy: [{ performedAt: direction }, { id: direction }],
        skip: (page.page - 1) * page.limit,
        take: page.limit,
      }),
      this._prisma.auditLog.count({ where }),
    ]);

    return new Paginated({
      items: rows.map((row: AuditLogModel) => AuditLogQueriesMapper.toView(row)),
      total,
      page: page.page,
      limit: page.limit,
    });
  }
}
