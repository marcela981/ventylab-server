/*
 * Funcionalidad: Caso de uso GetAuditTargetHistoryUseCase
 * Descripción: Historial paginado de auditoría de un objetivo (tipo e identificador), del más reciente al más antiguo salvo que se pida lo contrario; depende de IAuditLogQueriesRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { type AuditLogEntryView, type AuditLogPage } from "@/features/audit-log/domain/read-models/audit-log-entry.read-model";
import { AUDIT_LOG_QUERIES_REPOSITORY_TOKEN, type IAuditLogQueriesRepository } from "@/features/audit-log/domain/repositories/audit-log-queries.repository";

@Injectable()
export class GetAuditTargetHistoryUseCase {
  public constructor(
    @Inject(AUDIT_LOG_QUERIES_REPOSITORY_TOKEN)
    private readonly _auditLogQueriesRepository: IAuditLogQueriesRepository,
  ) {}

  public async execute(targetType: string, targetId: string, page: AuditLogPage): Promise<Paginated<AuditLogEntryView>> {
    return await this._auditLogQueriesRepository.getTargetHistory(targetType, targetId, page);
  }
}
