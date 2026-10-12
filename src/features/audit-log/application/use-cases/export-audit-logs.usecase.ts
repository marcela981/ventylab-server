/*
 * Funcionalidad: Caso de uso ExportAuditLogsUseCase
 * Descripción: Exporta los registros de auditoría que cumplen los filtros, del más antiguo al más reciente y con un tope de filas, indicando si se omitieron registros; depende de IAuditLogQueriesRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type AuditLogEntryView, type AuditLogFilters } from "@/features/audit-log/domain/read-models/audit-log-entry.read-model";
import { AUDIT_LOG_QUERIES_REPOSITORY_TOKEN, type IAuditLogQueriesRepository } from "@/features/audit-log/domain/repositories/audit-log-queries.repository";
import { assertValidAuditLogRange } from "@/features/audit-log/domain/services/audit-log-range";

export const AUDIT_LOG_EXPORT_ROW_LIMIT: number = 50_000;

export interface AuditLogExport {
  readonly rows: AuditLogEntryView[];
  readonly truncated: boolean;
}

/**
 * @throws {InvalidAuditLogRangeError} If the range does not start before it ends
 */
@Injectable()
export class ExportAuditLogsUseCase {
  public constructor(
    @Inject(AUDIT_LOG_QUERIES_REPOSITORY_TOKEN)
    private readonly _auditLogQueriesRepository: IAuditLogQueriesRepository,
  ) {}

  public async execute(filters: AuditLogFilters, rowLimit: number = AUDIT_LOG_EXPORT_ROW_LIMIT): Promise<AuditLogExport> {
    assertValidAuditLogRange(filters);

    const rows: AuditLogEntryView[] = await this._auditLogQueriesRepository.getExportRows(filters, rowLimit + 1);

    return { rows: rows.slice(0, rowLimit), truncated: rows.length > rowLimit };
  }
}
