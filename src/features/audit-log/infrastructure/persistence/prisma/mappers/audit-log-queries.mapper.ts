/*
 * Funcionalidad: Mapper AuditLogQueriesMapper
 * Descripción: Convierte filas Prisma de audit_logs en vistas de solo lectura y traduce los filtros de auditoría a condiciones Prisma (el tipo de objetivo coincide con el tipo o con la colección de entidad)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AuditLog as AuditLogModel, type Prisma } from "@prisma/client";

import { type AuditLogEntryView, type AuditLogFilters } from "@/features/audit-log/domain/read-models/audit-log-entry.read-model";

function toRecord(value: Prisma.JsonValue): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : undefined;
}

export class AuditLogQueriesMapper {
  public static toView(row: AuditLogModel): AuditLogEntryView {
    return {
      id: row.id,
      action: row.action,
      entityCollection: row.entityCollection,
      entityType: row.entityType,
      entityId: row.entityId,
      actorId: row.performedByUserId ?? undefined,
      actorRole: row.actorRole ?? undefined,
      description: row.description ?? undefined,
      reason: row.reason ?? undefined,
      before: toRecord(row.before),
      after: toRecord(row.after),
      metadata: toRecord(row.metadata),
      requestId: row.requestId ?? undefined,
      ip: row.ip ?? undefined,
      performedAt: row.performedAt,
    };
  }

  public static toWhere(filters: AuditLogFilters): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};

    if (filters.actorId) where.performedByUserId = filters.actorId;
    if (filters.action) where.action = filters.action;
    if (filters.targetId) where.entityId = filters.targetId;
    if (filters.targetType) where.OR = [{ entityType: filters.targetType }, { entityCollection: filters.targetType }];

    if (filters.from || filters.to) {
      where.performedAt = { gte: filters.from, lt: filters.to };
    }

    return where;
  }
}
