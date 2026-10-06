/*
 * Funcionalidad: Módulo LoggingModule
 * Descripción: Módulo global que provee el repositorio de auditoría, el registrador de auditoría IAuditRecorder, el servicio y la purga de registros de error y el logger estructurado AppLogger
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Global, Module } from "@nestjs/common";

import { AUDIT_RECORDER_TOKEN } from "@/common/application/ports/audit-recorder.interface";
import { AUDIT_LOG_REPOSITORY_TOKEN } from "@/common/domain/repositories/audit-log.repository";
import { AppLogger } from "@/common/infrastructure/logging/app-logger.service";
import { ErrorLogPrismaRepository } from "@/common/infrastructure/logging/error-log/error-log-prisma.repository";
import { ErrorLogPurgeService } from "@/common/infrastructure/logging/error-log/error-log-purge.service";
import { ErrorLogService } from "@/common/infrastructure/logging/error-log/error-log.service";
import { AuditLogPrismaRepository } from "@/common/infrastructure/persistence/audit-log/audit-log-prisma.repository";
import { AuditLogRecorder } from "@/common/infrastructure/persistence/audit-log/audit-log-recorder";

@Global()
@Module({
  providers: [
    {
      provide: AUDIT_LOG_REPOSITORY_TOKEN,
      useClass: AuditLogPrismaRepository,
    },
    {
      provide: AUDIT_RECORDER_TOKEN,
      useClass: AuditLogRecorder,
    },
    ErrorLogPrismaRepository,
    ErrorLogService,
    ErrorLogPurgeService,
    AppLogger,
  ],
  exports: [AUDIT_LOG_REPOSITORY_TOKEN, AUDIT_RECORDER_TOKEN, ErrorLogService, AppLogger],
})
export class LoggingModule {}
