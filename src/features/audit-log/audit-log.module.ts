/*
 * Funcionalidad: Módulo AuditLogModule
 * Descripción: Registra el lado de consulta de la bitácora de auditoría (casos de uso de búsqueda, historial, exportación, detalle y catálogo, repositorio Prisma de solo lectura y controlador api/audit); la escritura vive en el puerto común IAuditRecorder
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { ExportAuditLogsUseCase } from "@/features/audit-log/application/use-cases/export-audit-logs.usecase";
import { GetAuditLogCatalogUseCase } from "@/features/audit-log/application/use-cases/get-audit-log-catalog.usecase";
import { GetAuditLogEntryUseCase } from "@/features/audit-log/application/use-cases/get-audit-log-entry.usecase";
import { GetAuditTargetHistoryUseCase } from "@/features/audit-log/application/use-cases/get-audit-target-history.usecase";
import { SearchAuditLogsUseCase } from "@/features/audit-log/application/use-cases/search-audit-logs.usecase";
import { AUDIT_LOG_QUERIES_REPOSITORY_TOKEN } from "@/features/audit-log/domain/repositories/audit-log-queries.repository";
import { AuditLogQueriesPrismaRepository } from "@/features/audit-log/infrastructure/persistence/prisma/repositories/audit-log-queries-prisma.repository";
import { AuditLogController } from "@/features/audit-log/presentation/controllers/audit-log.controller";
import { AuthModule } from "@/features/auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [AuditLogController],
  providers: [
    { provide: AUDIT_LOG_QUERIES_REPOSITORY_TOKEN, useClass: AuditLogQueriesPrismaRepository },
    SearchAuditLogsUseCase,
    GetAuditTargetHistoryUseCase,
    ExportAuditLogsUseCase,
    GetAuditLogEntryUseCase,
    GetAuditLogCatalogUseCase,
  ],
})
export class AuditLogModule {}
