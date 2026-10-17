/*
 * Funcionalidad: Dobles de prueba de la bitácora de auditoría
 * Descripción: Repositorio de consultas de auditoría en memoria (búsqueda, historial, exportación, detalle y tipos de objetivo) y fábrica de vistas de auditoría para las pruebas de los casos de uso y del serializador CSV
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Paginated } from "@/common/domain/utils/paginated";
import {
  type AuditLogEntryView,
  type AuditLogFilters,
  type AuditLogPage,
  type AuditLogSearchQuery,
} from "@/features/audit-log/domain/read-models/audit-log-entry.read-model";
import { type IAuditLogQueriesRepository } from "@/features/audit-log/domain/repositories/audit-log-queries.repository";

export function buildAuditEntry(overrides: Partial<AuditLogEntryView> = {}): AuditLogEntryView {
  return {
    id: "audit-1",
    action: "user_role_changed",
    entityCollection: "users",
    entityType: "user",
    entityId: "u-2",
    actorId: "admin-1",
    actorRole: "ADMIN",
    before: { role: "STUDENT" },
    after: { role: "TEACHER" },
    performedAt: new Date("2026-10-01T10:00:00.000Z"),
    ...overrides,
  };
}

function matches(entry: AuditLogEntryView, filters: AuditLogFilters): boolean {
  return (
    (!filters.actorId || entry.actorId === filters.actorId) &&
    (!filters.action || entry.action === filters.action) &&
    (!filters.targetId || entry.entityId === filters.targetId) &&
    (!filters.targetType || entry.entityType === filters.targetType || entry.entityCollection === filters.targetType) &&
    (!filters.from || entry.performedAt >= filters.from) &&
    (!filters.to || entry.performedAt < filters.to)
  );
}

export class InMemoryAuditLogQueriesRepository implements IAuditLogQueriesRepository {
  public constructor(public readonly entries: AuditLogEntryView[] = []) {}

  public search(query: AuditLogSearchQuery): Promise<Paginated<AuditLogEntryView>> {
    return Promise.resolve(this._paginate(this.entries.filter((entry: AuditLogEntryView) => matches(entry, query)), query));
  }

  public getTargetHistory(targetType: string, targetId: string, page: AuditLogPage): Promise<Paginated<AuditLogEntryView>> {
    return Promise.resolve(this._paginate(this.entries.filter((entry: AuditLogEntryView) => matches(entry, { targetType, targetId })), page));
  }

  public getExportRows(filters: AuditLogFilters, limit: number): Promise<AuditLogEntryView[]> {
    return Promise.resolve(this.entries.filter((entry: AuditLogEntryView) => matches(entry, filters)).slice(0, limit));
  }

  public getById(id: string): Promise<AuditLogEntryView | undefined> {
    return Promise.resolve(this.entries.find((entry: AuditLogEntryView) => entry.id === id));
  }

  public getTargetTypes(): Promise<string[]> {
    return Promise.resolve([...new Set<string>(this.entries.map((entry: AuditLogEntryView) => entry.entityType))].sort());
  }

  private _paginate(items: AuditLogEntryView[], page: AuditLogPage): Paginated<AuditLogEntryView> {
    const start: number = (page.page - 1) * page.limit;

    return new Paginated({ items: items.slice(start, start + page.limit), total: items.length, page: page.page, limit: page.limit });
  }
}
