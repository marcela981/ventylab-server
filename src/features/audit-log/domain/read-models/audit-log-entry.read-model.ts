/*
 * Funcionalidad: Modelo de lectura de la bitácora de auditoría
 * Descripción: Vista de solo lectura de un registro de audit_logs y los filtros de búsqueda y exportación (actor, acción, tipo e identificador de objetivo, rango de fechas)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface AuditLogEntryView {
  readonly id: string;
  readonly action: string;
  readonly entityCollection: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly actorId?: string;
  readonly actorRole?: string;
  readonly description?: string;
  readonly reason?: string;
  readonly before?: Record<string, unknown>;
  readonly after?: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
  readonly requestId?: string;
  readonly ip?: string;
  readonly performedAt: Date;
}

export interface AuditLogFilters {
  readonly actorId?: string;
  readonly action?: string;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly from?: Date;
  readonly to?: Date;
}

export interface AuditLogPage {
  readonly page: number;
  readonly limit: number;
  readonly sortOrder?: "asc" | "desc";
}

export interface AuditLogSearchQuery extends AuditLogFilters, AuditLogPage {}
