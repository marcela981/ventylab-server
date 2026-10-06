/*
 * Funcionalidad: Guardia de cuota de IA desde la telemetría
 * Descripción: Implementa IAiQuotaGuard con los límites diarios por rol y caso de uso de la configuración del gateway y el consumo del usuario desde el inicio del día UTC leído de AiTelemetryFacade (con caché de 15 segundos); al superarla registra QUOTA_EXCEEDED sin llamar a ningún proveedor y lanza AiQuotaExceededError con la medianoche UTC siguiente. Las llamadas de sistema (sin usuario) y los roles sin cuota no se limitan
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { generateId } from "@/common/domain/utils/generate-id";
import { type AiQuotaCallContext, type IAiQuotaGuard } from "@/features/ai/application/ports/ai-quota-guard.interface";
import {
  AI_SETTINGS_PROVIDER_TOKEN,
  type AiQuotaLimit,
  type IAiSettingsProvider,
} from "@/features/ai/application/ports/ai-settings-provider.interface";
import { AiQuotaExceededError } from "@/features/ai/domain/ai.errors";
import { nextUtcMidnight, startOfUtcDay } from "@/features/ai/domain/services/ai-quota-window";
import { type AiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";
import { type AiDailyUsage, AiUsageCache } from "@/features/ai/infrastructure/quota/ai-usage-cache";
import { AiTelemetryFacade } from "@/features/ai-telemetry/application/ai-telemetry.facade";

const QUOTA_EXCEEDED_CODE: string = "QUOTA_EXCEEDED";

@Injectable()
export class TelemetryAiQuotaGuard implements IAiQuotaGuard {
  public constructor(
    private readonly _telemetry: AiTelemetryFacade,
    @Inject(AI_SETTINGS_PROVIDER_TOKEN)
    private readonly _settings: IAiSettingsProvider,
    private readonly _usageCache: AiUsageCache,
  ) {}

  public async assertWithinQuota(userId: string | undefined, role: string | undefined, useCase: AiUseCaseValue, call: AiQuotaCallContext): Promise<void> {
    if (userId === undefined || role === undefined) {
      return;
    }

    const limit: AiQuotaLimit | undefined = this._settings.getQuota(role, useCase);

    if (!limit || (limit.requestsPerDay === undefined && limit.tokensPerDay === undefined)) {
      return;
    }

    const now: Date = new Date();
    const usage: AiDailyUsage = await this._usage(userId, useCase, now);

    if (!this._isExceeded(limit, usage)) {
      return;
    }

    void this._telemetry.record({
      id: generateId(),
      useCase,
      userId,
      promptVersion: call.promptVersion,
      promptHash: call.promptHash,
      latencyMs: 0,
      status: "QUOTA_EXCEEDED",
      errorCode: QUOTA_EXCEEDED_CODE,
      attempts: 0,
      refType: call.refType,
      refId: call.refId,
      createdAt: now,
    });

    throw new AiQuotaExceededError(nextUtcMidnight(now));
  }

  private async _usage(userId: string, useCase: AiUseCaseValue, now: Date): Promise<AiDailyUsage> {
    const cached: AiDailyUsage | undefined = this._usageCache.get(userId, useCase, now);

    if (cached) {
      return cached;
    }

    const usage: AiDailyUsage = await this._telemetry.getUsage(userId, useCase, startOfUtcDay(now));

    this._usageCache.set(userId, useCase, usage, now);

    return usage;
  }

  // Token usage is only known after a call, so a call is admitted while the tokens spent so far are below the limit.
  private _isExceeded(limit: AiQuotaLimit, usage: AiDailyUsage): boolean {
    const requestsExceeded: boolean = limit.requestsPerDay !== undefined && usage.requests >= limit.requestsPerDay;
    const tokensExceeded: boolean = limit.tokensPerDay !== undefined && usage.inputTokens + usage.outputTokens >= limit.tokensPerDay;

    return requestsExceeded || tokensExceeded;
  }
}
