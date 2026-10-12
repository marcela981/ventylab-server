/*
 * Funcionalidad: Mapper del estado del sistema
 * Descripción: Convierte el informe de estado del sistema y el resultado de la sonda de IA en sus DTOs (fechas ISO y null para valores ausentes)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiProbeResult } from "@/features/ai/domain/results/ai-provider-health";
import { type AiProviderComponentStatus, type SystemStatusReport } from "@/features/system-status/domain/system-status";
import { type AiProbeDTO, type AiProviderStatusDTO, type SystemStatusDTO } from "@/features/system-status/presentation/dtos/system-status-response.dto";

function isoOrNull(value: Date | undefined): string | null {
  return value ? value.toISOString() : null;
}

export class SystemStatusMapper {
  public static toDTO(report: SystemStatusReport): SystemStatusDTO {
    const { database, mqttBroker, ventilator, aiProviders, storage, process } = report.components;

    return {
      state: report.state,
      checkedAt: report.checkedAt.toISOString(),
      components: {
        database: { state: database.state, reachable: database.reachable, latencyMs: database.latencyMs ?? null },
        mqttBroker: {
          state: mqttBroker.state,
          enabled: mqttBroker.enabled,
          connected: mqttBroker.connected,
          lastMessageAt: isoOrNull(mqttBroker.lastMessageAt),
          messagesPerSecond: mqttBroker.messagesPerSecond,
        },
        ventilator: { state: ventilator.state, online: ventilator.online, activeReservation: ventilator.activeReservation ?? null },
        aiProviders: {
          state: aiProviders.state,
          windowMinutes: aiProviders.windowMinutes,
          providers: aiProviders.providers.map((provider: AiProviderComponentStatus) => SystemStatusMapper.toProviderDTO(provider)),
        },
        storage: { state: storage.state },
        process: { ...process, appCommit: process.appCommit ?? null },
      },
    };
  }

  public static toProviderDTO(provider: AiProviderComponentStatus): AiProviderStatusDTO {
    return {
      provider: provider.provider,
      configured: provider.configured,
      breaker: provider.breaker,
      available: provider.available,
      lastSuccessAt: isoOrNull(provider.lastSuccessAt),
      lastErrorAt: isoOrNull(provider.lastErrorAt),
      lastErrorCode: provider.lastErrorCode ?? null,
      latencyP95Ms: provider.latencyP95Ms ?? null,
      errorRate: provider.errorRate ?? null,
      calls: provider.calls ?? null,
    };
  }

  public static toProbeDTO(result: AiProbeResult): AiProbeDTO {
    return {
      provider: result.provider,
      model: result.model,
      ok: result.ok,
      latencyMs: result.latencyMs,
      errorCode: result.errorCode ?? null,
      aiCallId: result.aiCallId,
    };
  }
}
