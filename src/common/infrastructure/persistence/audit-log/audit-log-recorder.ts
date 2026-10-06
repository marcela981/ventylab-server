/*
 * Funcionalidad: Adaptador AuditLogRecorder
 * Descripción: Implementa IAuditRecorder sobre la tabla audit_logs mediante IAuditLogRepository; el tipo de objetivo se usa como colección y tipo de entidad y el estado anterior y posterior se guardan en metadata
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { AuditLog } from "@/common/domain/entities/audit-log.entity";
import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";

@Injectable()
export class AuditLogRecorder implements IAuditRecorder {
  public constructor(
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async record(
    actorId: string | undefined,
    action: string,
    targetType: string,
    targetId: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    transaction?: unknown,
  ): Promise<void> {
    const log: AuditLog = AuditLog.create({
      action,
      performedByUserId: actorId,
      metadata: { before, after },
    });

    await this._auditLogRepository.save(targetType, targetType, targetId, [log], transaction);
  }
}
