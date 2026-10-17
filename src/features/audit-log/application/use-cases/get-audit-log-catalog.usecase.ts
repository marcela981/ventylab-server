/*
 * Funcionalidad: Caso de uso GetAuditLogCatalogUseCase
 * Descripción: Devuelve el catálogo para filtrar la bitácora de auditoría: las acciones de AUDIT_ACTIONS, los tipos de objetivo presentes en la bitácora y el tope de filas de la exportación CSV
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { AUDIT_ACTION_VALUES } from "@/common/domain/audit/audit-action";
import { AUDIT_LOG_EXPORT_ROW_LIMIT } from "@/features/audit-log/application/use-cases/export-audit-logs.usecase";
import { AUDIT_LOG_QUERIES_REPOSITORY_TOKEN, type IAuditLogQueriesRepository } from "@/features/audit-log/domain/repositories/audit-log-queries.repository";

export interface AuditLogCatalog {
  readonly actions: string[];
  readonly targetTypes: string[];
  readonly exportRowLimit: number;
}

@Injectable()
export class GetAuditLogCatalogUseCase {
  public constructor(
    @Inject(AUDIT_LOG_QUERIES_REPOSITORY_TOKEN)
    private readonly _auditLogQueriesRepository: IAuditLogQueriesRepository,
  ) {}

  public async execute(): Promise<AuditLogCatalog> {
    const targetTypes: string[] = await this._auditLogQueriesRepository.getTargetTypes();

    return { actions: [...AUDIT_ACTION_VALUES].sort(), targetTypes, exportRowLimit: AUDIT_LOG_EXPORT_ROW_LIMIT };
  }
}
