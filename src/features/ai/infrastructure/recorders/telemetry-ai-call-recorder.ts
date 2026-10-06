/*
 * Funcionalidad: Registrador de llamadas de IA en la telemetría
 * Descripción: Implementa IAiCallRecorder sobre AiTelemetryFacade.record (sin texto del prompt ni de la respuesta): estima el costo con los precios por mil tokens de la configuración del gateway, que es la única fuente de precios, y suma al consumo diario en caché del usuario las llamadas que llegan a un proveedor (las bloqueadas por tema no cuentan, igual que en la telemetría)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type AiCallRecord, type IAiCallRecorder } from "@/features/ai/application/ports/ai-call-recorder.interface";
import {
  AI_SETTINGS_PROVIDER_TOKEN,
  type AiModelPrice,
  type IAiSettingsProvider,
} from "@/features/ai/application/ports/ai-settings-provider.interface";
import { estimateAiCostUsd } from "@/features/ai/domain/services/ai-cost-estimation";
import { AiUsageCache } from "@/features/ai/infrastructure/quota/ai-usage-cache";
import { AiTelemetryFacade } from "@/features/ai-telemetry/application/ai-telemetry.facade";
import { type AiCallLogEntry } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

@Injectable()
export class TelemetryAiCallRecorder implements IAiCallRecorder {
  public constructor(
    private readonly _telemetry: AiTelemetryFacade,
    @Inject(AI_SETTINGS_PROVIDER_TOKEN)
    private readonly _settings: IAiSettingsProvider,
    private readonly _usageCache: AiUsageCache,
  ) {}

  public async record(entry: AiCallRecord): Promise<string> {
    if (entry.userId !== undefined && entry.status !== "BLOCKED_OFFTOPIC") {
      this._usageCache.add(entry.userId, entry.useCase, { requests: 1, inputTokens: entry.inputTokens ?? 0, outputTokens: entry.outputTokens ?? 0 }, entry.createdAt);
    }

    await this._telemetry.record(this._toLogEntry(entry));

    return entry.id;
  }

  private _toLogEntry(entry: AiCallRecord): AiCallLogEntry {
    const price: AiModelPrice | undefined =
      entry.provider !== undefined && entry.model !== undefined ? this._settings.getPrice(entry.provider, entry.model) : undefined;

    return {
      id: entry.id,
      useCase: entry.useCase,
      userId: entry.userId,
      provider: entry.provider,
      model: entry.model,
      promptVersion: entry.promptVersion,
      promptHash: entry.promptHash,
      inputTokens: entry.inputTokens,
      outputTokens: entry.outputTokens,
      latencyMs: entry.latencyMs,
      ttftMs: entry.ttftMs,
      status: entry.status,
      errorCode: entry.errorCode,
      attempts: entry.attempts,
      costEstimateUsd: estimateAiCostUsd(price, entry.inputTokens, entry.outputTokens),
      refType: entry.refType,
      refId: entry.refId,
      createdAt: entry.createdAt,
    };
  }
}
