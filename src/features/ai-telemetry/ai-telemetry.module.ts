/*
 * Funcionalidad: Módulo AiTelemetryModule
 * Descripción: Registra la telemetría de IA (repositorios Prisma de ai_call_logs y de sus lecturas por lotes para analítica, casos de uso de estadísticas y exportación, controlador /api/admin/ai-telemetry; la tabla de precios AI_PRICE_TABLE_TOKEN la enlaza la raíz de composición) y exporta AiTelemetryFacade para la pasarela de IA y otras features
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AiTelemetryFacade } from "@/features/ai-telemetry/application/ai-telemetry.facade";
import { ExportAiCallLogsUseCase } from "@/features/ai-telemetry/application/use-cases/export-ai-call-logs.usecase";
import { GetAiTelemetryStatsUseCase } from "@/features/ai-telemetry/application/use-cases/get-ai-telemetry-stats.usecase";
import { AI_CALL_LOG_ANALYTICS_REPOSITORY_TOKEN } from "@/features/ai-telemetry/domain/repositories/ai-call-log-analytics.repository";
import { AI_CALL_LOGS_REPOSITORY_TOKEN } from "@/features/ai-telemetry/domain/repositories/ai-call-logs.repository";
import { AiCallLogAnalyticsPrismaRepository } from "@/features/ai-telemetry/infrastructure/persistence/prisma/repositories/ai-call-log-analytics-prisma.repository";
import { AiCallLogsPrismaRepository } from "@/features/ai-telemetry/infrastructure/persistence/prisma/repositories/ai-call-logs-prisma.repository";
import { AiTelemetryController } from "@/features/ai-telemetry/presentation/controllers/ai-telemetry.controller";
import { AuthModule } from "@/features/auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [AiTelemetryController],
  providers: [
    { provide: AI_CALL_LOGS_REPOSITORY_TOKEN, useClass: AiCallLogsPrismaRepository },
    { provide: AI_CALL_LOG_ANALYTICS_REPOSITORY_TOKEN, useClass: AiCallLogAnalyticsPrismaRepository },
    GetAiTelemetryStatsUseCase,
    ExportAiCallLogsUseCase,
    AiTelemetryFacade,
  ],
  exports: [AiTelemetryFacade],
})
export class AiTelemetryModule {}
