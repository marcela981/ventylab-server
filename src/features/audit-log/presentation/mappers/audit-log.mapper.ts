/*
 * Funcionalidad: Mapper AuditLogMapper
 * Descripción: Convierte las vistas de auditoría y el catálogo en DTOs de respuesta y los DTOs de consulta en filtros y paginación del dominio
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AuditLogCatalog } from "@/features/audit-log/application/use-cases/get-audit-log-catalog.usecase";
import { type AuditLogEntryView, type AuditLogFilters, type AuditLogPage } from "@/features/audit-log/domain/read-models/audit-log-entry.read-model";
import { type AuditLogFiltersQueryDTO, type AuditLogPageQueryDTO } from "@/features/audit-log/presentation/dtos/audit-log-request.dto";
import { AuditLogCatalogDTO, AuditLogEntryDTO } from "@/features/audit-log/presentation/dtos/audit-log-response.dto";

export class AuditLogMapper {
  public static toDTO(entry: AuditLogEntryView): AuditLogEntryDTO {
    return new AuditLogEntryDTO({
      id: entry.id,
      action: entry.action,
      targetCollection: entry.entityCollection,
      targetType: entry.entityType,
      targetId: entry.entityId,
      actorId: entry.actorId ?? null,
      actorRole: entry.actorRole ?? null,
      description: entry.description ?? null,
      reason: entry.reason ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
      metadata: entry.metadata ?? null,
      requestId: entry.requestId ?? null,
      ip: entry.ip ?? null,
      performedAt: entry.performedAt,
    });
  }

  public static toDTOList(entries: AuditLogEntryView[]): AuditLogEntryDTO[] {
    return entries.map((entry: AuditLogEntryView) => AuditLogMapper.toDTO(entry));
  }

  public static toCatalogDTO(catalog: AuditLogCatalog): AuditLogCatalogDTO {
    return new AuditLogCatalogDTO({ actions: catalog.actions, targetTypes: catalog.targetTypes, exportRowLimit: catalog.exportRowLimit });
  }

  public static toFilters(query: AuditLogFiltersQueryDTO): AuditLogFilters {
    return {
      actorId: query.actorId,
      action: query.action,
      targetType: query.targetType,
      targetId: query.targetId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    };
  }

  public static toPage(query: AuditLogPageQueryDTO): AuditLogPage {
    return { page: query.page, limit: query.limit, sortOrder: query.sortOrder };
  }
}
