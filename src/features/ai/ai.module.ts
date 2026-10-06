/*
 * Funcionalidad: Módulo AiModule
 * Descripción: Registra el gateway de IA (AiGateway y AiOrchestrator), el registro de proveedores LLM, la configuración del gateway, el registrador de llamadas y la guardia de cuota diaria sobre la telemetría (AiTelemetryModule) con su caché de consumo; exporta AiGateway como fachada
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AI_CALL_RECORDER_TOKEN } from "@/features/ai/application/ports/ai-call-recorder.interface";
import { AI_QUOTA_GUARD_TOKEN } from "@/features/ai/application/ports/ai-quota-guard.interface";
import { AiGateway } from "@/features/ai/application/services/ai-gateway";
import { AiOrchestrator } from "@/features/ai/application/services/ai-orchestrator";
import { AI_PROVIDERS_PROVIDER } from "@/features/ai/infrastructure/config/ai-providers.config";
import { AI_SETTINGS_PROVIDER } from "@/features/ai/infrastructure/config/ai-settings.provider";
import { AiUsageCache } from "@/features/ai/infrastructure/quota/ai-usage-cache";
import { TelemetryAiQuotaGuard } from "@/features/ai/infrastructure/quota/telemetry-ai-quota-guard";
import { TelemetryAiCallRecorder } from "@/features/ai/infrastructure/recorders/telemetry-ai-call-recorder";
import { AiTelemetryModule } from "@/features/ai-telemetry/ai-telemetry.module";

@Module({
  imports: [AiTelemetryModule],
  providers: [
    AI_PROVIDERS_PROVIDER,
    AI_SETTINGS_PROVIDER,
    AiUsageCache,
    { provide: AI_CALL_RECORDER_TOKEN, useClass: TelemetryAiCallRecorder },
    { provide: AI_QUOTA_GUARD_TOKEN, useClass: TelemetryAiQuotaGuard },
    AiOrchestrator,
    AiGateway,
  ],
  exports: [AiGateway],
})
export class AiModule {}
