/*
 * Funcionalidad: Serializador CSV de la bitácora de auditoría
 * Descripción: Convierte registros de auditoría en CSV RFC 4180 con toCsv (comillas, saltos de línea y prefijo contra inyección de fórmulas); los estados y metadatos se serializan como JSON
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { toCsv } from "@/common/presentation/utils/csv.util";
import { type AuditLogEntryView } from "@/features/audit-log/domain/read-models/audit-log-entry.read-model";

export interface AuditLogCsvRow {
  readonly performedAt: Date;
  readonly action: string;
  readonly actorId?: string;
  readonly actorRole?: string;
  readonly targetCollection: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly description?: string;
  readonly reason?: string;
  readonly before?: string;
  readonly after?: string;
  readonly metadata?: string;
  readonly requestId?: string;
  readonly ip?: string;
}

export const AUDIT_LOG_CSV_COLUMNS: readonly (keyof AuditLogCsvRow)[] = [
  "performedAt",
  "action",
  "actorId",
  "actorRole",
  "targetCollection",
  "targetType",
  "targetId",
  "description",
  "reason",
  "before",
  "after",
  "metadata",
  "requestId",
  "ip",
] as const;

function toJsonCell(value: Record<string, unknown> | undefined): string | undefined {
  return value === undefined ? undefined : JSON.stringify(value);
}

function toCsvRow(entry: AuditLogEntryView): AuditLogCsvRow {
  return {
    performedAt: entry.performedAt,
    action: entry.action,
    actorId: entry.actorId,
    actorRole: entry.actorRole,
    targetCollection: entry.entityCollection,
    targetType: entry.entityType,
    targetId: entry.entityId,
    description: entry.description,
    reason: entry.reason,
    before: toJsonCell(entry.before),
    after: toJsonCell(entry.after),
    metadata: toJsonCell(entry.metadata),
    requestId: entry.requestId,
    ip: entry.ip,
  };
}

export function toAuditLogCsv(entries: readonly AuditLogEntryView[]): string {
  return toCsv(
    entries.map((entry: AuditLogEntryView) => toCsvRow(entry)),
    AUDIT_LOG_CSV_COLUMNS,
  );
}
