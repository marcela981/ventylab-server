/*
 * Funcionalidad: Módulo SystemStatusModule
 * Descripción: Registra el estado del sistema (servicio con caché y detección de cambios, monitor reactivo, métricas del proceso, ajustes, manejadores de eventos y casos de uso) y su controlador; compone las fachadas de IA, telemetría de IA, telemetría del ventilador, reservas y simulación con los puertos comunes de base de datos, almacenamiento y tiempo real
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AiModule } from "@/features/ai/ai.module";
import { AiTelemetryModule } from "@/features/ai-telemetry/ai-telemetry.module";
import { AuthModule } from "@/features/auth/auth.module";
import { ReservationsModule } from "@/features/reservations/reservations.module";
import { SimulationModule } from "@/features/simulation/simulation.module";
import { PROCESS_METRICS_TOKEN } from "@/features/system-status/application/ports/process-metrics.interface";
import { SystemStatusMonitor } from "@/features/system-status/application/services/system-status-monitor.service";
import { SystemStatusService } from "@/features/system-status/application/services/system-status.service";
import { GetSystemStatusUseCase } from "@/features/system-status/application/use-cases/get-system-status.usecase";
import { ProbeAiProviderUseCase } from "@/features/system-status/application/use-cases/probe-ai-provider.usecase";
import { SYSTEM_STATUS_SETTINGS_PROVIDER } from "@/features/system-status/infrastructure/config/system-status-settings.config";
import { SystemStatusEventsHandlers } from "@/features/system-status/infrastructure/events/system-status-events.handlers";
import { NodeProcessMetrics } from "@/features/system-status/infrastructure/process/node-process-metrics";
import { SystemStatusController } from "@/features/system-status/presentation/controllers/system-status.controller";
import { VentilatorTelemetryModule } from "@/features/ventilator-telemetry/ventilator-telemetry.module";

@Module({
  imports: [AuthModule, AiModule, AiTelemetryModule, VentilatorTelemetryModule, ReservationsModule, SimulationModule],
  controllers: [SystemStatusController],
  providers: [
    SYSTEM_STATUS_SETTINGS_PROVIDER,
    NodeProcessMetrics,
    { provide: PROCESS_METRICS_TOKEN, useExisting: NodeProcessMetrics },
    SystemStatusService,
    SystemStatusMonitor,
    SystemStatusEventsHandlers,
    GetSystemStatusUseCase,
    ProbeAiProviderUseCase,
  ],
})
export class SystemStatusModule {}
