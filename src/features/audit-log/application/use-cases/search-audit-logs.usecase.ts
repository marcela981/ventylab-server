/*
 * Funcionalidad: Caso de uso SearchAuditLogsUseCase
 * Descripción: Búsqueda paginada de la bitácora de auditoría por actor, acción, tipo e identificador de objetivo y rango de fechas; depende de IAuditLogQueriesRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { type AuditLogEntryView, type AuditLogSearchQuery } from "@/features/audit-log/domain/read-models/audit-log-entry.read-model";
import { AUDIT_LOG_QUERIES_REPOSITORY_TOKEN, type IAuditLogQueriesRepository } from "@/features/audit-log/domain/repositories/audit-log-queries.repository";
import { assertValidAuditLogRange } from "@/features/audit-log/domain/services/audit-log-range";

/**
 * @throws {InvalidAuditLogRangeError} If the range does not start before it ends
 */
@Injectable()
export class SearchAuditLogsUseCase {
  public constructor(
    @Inject(AUDIT_LOG_QUERIES_REPOSITORY_TOKEN)
    private readonly _auditLogQueriesRepository: IAuditLogQueriesRepository,
  ) {}

  public async execute(query: AuditLogSearchQuery): Promise<Paginated<AuditLogEntryView>> {
    assertValidAuditLogRange(query);

    return await this._auditLogQueriesRepository.search(query);
  }
}
