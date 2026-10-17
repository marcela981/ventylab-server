/*
 * Funcionalidad: Adaptadores de ajustes de IA
 * Descripción: Implementan los puertos de IA sobre la fachada de ajustes de la plataforma, leyendo el valor vigente en cada llamada: IAiSettingsProvider (cadena, modelos, tiempo límite, tokens y temperatura por caso de uso, cuotas, precios, modelos con precio (ajuste vigente más la tabla por defecto de la configuración) y verificación de tema; cortocircuito, reintento y ventana del tutor desde la configuración), la tabla de precios de la telemetría (USD por millón de tokens con clave proveedor:modelo, recalculada solo cuando cambian los precios) y la disponibilidad de proveedores según sus credenciales configuradas
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import {
  type AiBreakerSettings,
  type AiModelPrice,
  type AiQuotaLimit,
  type AiTutorSettings,
  type AiUseCaseSettings,
  type IAiSettingsProvider,
} from "@/features/ai/application/ports/ai-settings-provider.interface";
import { type AiProviderRegistry } from "@/features/ai/application/ports/llm-provider.interface";
import { type AiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";
import { readAiProvidersConfig } from "@/features/ai/infrastructure/config/ai-providers.config";
import { buildAiSettingsSnapshot, ConfigAiSettingsProvider, readAiSettingsSource, resolveAiQuota } from "@/features/ai/infrastructure/config/ai-settings.provider";
import { buildAiProviderRegistry } from "@/features/ai/infrastructure/providers/ai-providers.factory";
import { type AiPriceTable, type IAiPriceTableProvider } from "@/features/ai-telemetry/application/ports/ai-price-table.interface";
import { type AiModelPrice as TelemetryModelPrice } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";
import { type IAiProviderAvailability } from "@/features/platform-settings/application/ports/ai-provider-availability.interface";
import { PlatformSettingsFacade } from "@/features/platform-settings/application/services/platform-settings.facade";
import { type AiModelPriceValue, type AiPricesSettingValue } from "@/features/platform-settings/domain/registry/platform-setting-values";

const PER_1K_TO_PER_MILLION: number = 1000;

export class PlatformAiSettingsProvider implements IAiSettingsProvider {
  public constructor(
    private readonly _settings: PlatformSettingsFacade,
    private readonly _config: IAiSettingsProvider,
  ) {}

  public getUseCaseSettings(useCase: AiUseCaseValue): AiUseCaseSettings {
    return this._settings.get(`ai.useCase.${useCase}`);
  }

  public getBreakerSettings(): AiBreakerSettings {
    return this._config.getBreakerSettings();
  }

  public getRetryDelayMs(): number {
    return this._config.getRetryDelayMs();
  }

  public getQuota(role: string, useCase: AiUseCaseValue): AiQuotaLimit | undefined {
    return resolveAiQuota(this._settings.get("ai.quotas"), role, useCase);
  }

  public getTutorSettings(): AiTutorSettings {
    return { ...this._config.getTutorSettings(), topicCheckEnabled: this._settings.get("ai.tutor.topicCheck.enabled") };
  }

  public getPrice(provider: string, model: string): AiModelPrice | undefined {
    return this._settings.get("ai.prices")[provider]?.[model];
  }

  public getPricedModels(provider: string): readonly string[] {
    return [...new Set<string>([...Object.keys(this._settings.get("ai.prices")[provider] ?? {}), ...this._config.getPricedModels(provider)])];
  }
}

export class PlatformAiPriceTableProvider implements IAiPriceTableProvider {
  private _source: AiPricesSettingValue | undefined;
  private _table: AiPriceTable = {};

  public constructor(private readonly _settings: PlatformSettingsFacade) {}

  public getPriceTable(): AiPriceTable {
    const prices: AiPricesSettingValue = this._settings.get("ai.prices");

    if (prices !== this._source) {
      this._source = prices;
      this._table = toPerMillionPriceTable(prices);
    }

    return this._table;
  }
}

export function toPerMillionPriceTable(prices: AiPricesSettingValue): AiPriceTable {
  const table: Record<string, TelemetryModelPrice> = {};

  for (const [provider, models] of Object.entries(prices)) {
    for (const [model, price] of Object.entries<AiModelPriceValue>(models)) {
      table[`${provider}:${model}`] = {
        inputPerMillionUsd: price.inputPer1kUsd * PER_1K_TO_PER_MILLION,
        outputPerMillionUsd: price.outputPer1kUsd * PER_1K_TO_PER_MILLION,
      };
    }
  }

  return table;
}

export function createConfigAiSettingsProvider(configService: ConfigService<EnvironmentVariables, true>): IAiSettingsProvider {
  return new ConfigAiSettingsProvider(buildAiSettingsSnapshot(readAiSettingsSource(configService)));
}

export function createAiProviderAvailability(configService: ConfigService<EnvironmentVariables, true>): IAiProviderAvailability {
  const registry: AiProviderRegistry = buildAiProviderRegistry(readAiProvidersConfig(configService));

  return { isConfigured: (providerId: string): boolean => registry.has(providerId) };
}
