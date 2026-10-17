/*
 * Funcionalidad: Caso de uso GetAuditLogEntryUseCase
 * Descripción: Devuelve una entrada de auditoría por su identificador o lanza AuditLogEntryNotFoundError (404) si no existe
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { AuditLogEntryNotFoundError } from "@/features/audit-log/domain/audit-log.errors";
import { type AuditLogEntryView } from "@/features/audit-log/domain/read-models/audit-log-entry.read-model";
import { AUDIT_LOG_QUERIES_REPOSITORY_TOKEN, type IAuditLogQueriesRepository } from "@/features/audit-log/domain/repositories/audit-log-queries.repository";

/**
 * @throws {AuditLogEntryNotFoundError} If no audit entry has that ID
 */
@Injectable()
export class GetAuditLogEntryUseCase {
  public constructor(
    @Inject(AUDIT_LOG_QUERIES_REPOSITORY_TOKEN)
    private readonly _auditLogQueriesRepository: IAuditLogQueriesRepository,
  ) {}

  public async execute(id: string): Promise<AuditLogEntryView> {
    const entry: AuditLogEntryView | undefined = await this._auditLogQueriesRepository.getById(id);

    if (!entry) {
      throw new AuditLogEntryNotFoundError();
    }

    return entry;
  }
}
