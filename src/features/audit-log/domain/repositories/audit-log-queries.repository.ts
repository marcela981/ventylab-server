/*
 * Funcionalidad: Repositorio de consultas IAuditLogQueriesRepository
 * Descripción: Contrato de solo lectura sobre la bitácora de auditoría: búsqueda paginada con filtros, historial paginado de un objetivo filas para exportación con límite, una entrada por identificador y los tipos de objetivo presentes
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Paginated } from "@/common/domain/utils/paginated";
import {
  type AuditLogEntryView,
  type AuditLogFilters,
  type AuditLogPage,
  type AuditLogSearchQuery,
} from "@/features/audit-log/domain/read-models/audit-log-entry.read-model";

export const AUDIT_LOG_QUERIES_REPOSITORY_TOKEN: unique symbol = Symbol("AUDIT_LOG_QUERIES_REPOSITORY_TOKEN");

export interface IAuditLogQueriesRepository {
  search(query: AuditLogSearchQuery): Promise<Paginated<AuditLogEntryView>>;
  getTargetHistory(targetType: string, targetId: string, page: AuditLogPage): Promise<Paginated<AuditLogEntryView>>;
  getExportRows(filters: AuditLogFilters, limit: number): Promise<AuditLogEntryView[]>;
  getById(id: string): Promise<AuditLogEntryView | undefined>;
  getTargetTypes(): Promise<string[]>;
}
