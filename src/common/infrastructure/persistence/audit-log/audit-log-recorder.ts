/*
 * Funcionalidad: Adaptador AuditLogRecorder
 * Descripción: Implementa IAuditRecorder sobre la tabla audit_logs mediante IAuditLogRepository; el tipo de objetivo se usa como colección y tipo de entidad, el estado anterior y posterior se reduce a los campos que cambiaron y las opciones aportan motivo, descripción, metadatos y datos explícitos del actor y de la petición; omite la escritura (con un log de depuración) cuando no cambió ningún campo y no hay motivo
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { type AuditRecordOptions, type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { type AuditStateDiff, diffAuditStates } from "@/common/domain/audit/audit-payload";
import { AuditLog } from "@/common/domain/entities/audit-log.entity";
import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";

@Injectable()
export class AuditLogRecorder implements IAuditRecorder {
  private readonly _logger: Logger = new Logger(AuditLogRecorder.name);

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
    options: AuditRecordOptions = {},
  ): Promise<void> {
    const diff: AuditStateDiff = diffAuditStates(before, after);

    if (Object.keys(diff.before).length === 0 && Object.keys(diff.after).length === 0 && !options.reason?.trim()) {
      this._logger.debug(`Skipped audit "${action}" on ${targetType}/${targetId}: no changed fields and no reason`);

      return;
    }

    const log: AuditLog = AuditLog.create({
      action,
      performedByUserId: actorId,
      before: diff.before,
      after: diff.after,
      reason: options.reason,
      description: options.description,
      metadata: options.metadata,
      actorRole: options.actorRole,
      requestId: options.requestId,
      ip: options.ip,
    });

    await this._auditLogRepository.save(targetType, targetType, targetId, [log], transaction);
  }
}
