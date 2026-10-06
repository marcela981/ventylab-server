/*
 * Funcionalidad: Configuración de proveedores de IA
 * Descripción: Lee de ConfigService las credenciales y URL base de Gemini, OpenAI, Anthropic y el proveedor HTTP personalizado y registra en AI_PROVIDERS_TOKEN el registro de proveedores disponibles
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type FactoryProvider, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { AI_PROVIDERS_TOKEN, type AiProviderRegistry } from "@/features/ai/application/ports/llm-provider.interface";
import { type AiProvidersConfig, buildAiProviderRegistry } from "@/features/ai/infrastructure/providers/ai-providers.factory";
import { CUSTOM_HTTP_MAPPING_CONFIGURED } from "@/features/ai/infrastructure/providers/custom-http.mapping";

export function readAiProvidersConfig(configService: ConfigService<EnvironmentVariables, true>): AiProvidersConfig {
  return {
    geminiApiKey: configService.get("GEMINI_API_KEY", { infer: true }),
    openaiApiKey: configService.get("OPENAI_API_KEY", { infer: true }),
    openaiBaseUrl: configService.get("OPENAI_BASE_URL", { infer: true }),
    anthropicApiKey: configService.get("ANTHROPIC_API_KEY", { infer: true }),
    anthropicBaseUrl: configService.get("ANTHROPIC_BASE_URL", { infer: true }),
    customEndpoint: configService.get("AI_CUSTOM_HTTP_ENDPOINT", { infer: true }),
    customAuthHeader: configService.get("AI_CUSTOM_HTTP_AUTH_HEADER", { infer: true }),
    customAuthValue: configService.get("AI_CUSTOM_HTTP_AUTH_VALUE", { infer: true }),
    customMappingConfigured: CUSTOM_HTTP_MAPPING_CONFIGURED,
  };
}

export const AI_PROVIDERS_PROVIDER: FactoryProvider<AiProviderRegistry> = {
  provide: AI_PROVIDERS_TOKEN,
  inject: [ConfigService],
  useFactory: (configService: ConfigService<EnvironmentVariables, true>): AiProviderRegistry => {
    const registry: AiProviderRegistry = buildAiProviderRegistry(readAiProvidersConfig(configService));
    const logger: Logger = new Logger("AiProviders");

    if (registry.size === 0) {
      logger.warn("No AI provider is configured; AI features will use their deterministic fallbacks or return 503");
    } else {
      logger.log(`AI providers registered: ${[...registry.keys()].join(", ")}`);
    }

    return registry;
  },
};
