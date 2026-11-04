/*
 * Funcionalidad: Configuración de proveedores de IA
 * Descripción: Lee de ConfigService las credenciales y URL base de Gemini, OpenAI, Anthropic y el proveedor externo de terceros (AI_EXTERNAL_*: URL base, clave, cabecera, modelo, formato y tiempo máximo) y registra en AI_PROVIDERS_TOKEN el registro de proveedores disponibles
 * Versión: 1.1
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

export function readAiProvidersConfig(configService: ConfigService<EnvironmentVariables, true>): AiProvidersConfig {
  return {
    geminiApiKey: configService.get("GEMINI_API_KEY", { infer: true }),
    openaiApiKey: configService.get("OPENAI_API_KEY", { infer: true }),
    openaiBaseUrl: configService.get("OPENAI_BASE_URL", { infer: true }),
    anthropicApiKey: configService.get("ANTHROPIC_API_KEY", { infer: true }),
    anthropicBaseUrl: configService.get("ANTHROPIC_BASE_URL", { infer: true }),
    externalBaseUrl: configService.get("AI_EXTERNAL_BASE_URL", { infer: true }),
    externalApiKey: configService.get("AI_EXTERNAL_API_KEY", { infer: true }),
    externalAuthHeader: configService.get("AI_EXTERNAL_AUTH_HEADER", { infer: true }),
    externalModel: configService.get("AI_EXTERNAL_MODEL", { infer: true }),
    externalFormat: configService.get("AI_EXTERNAL_FORMAT", { infer: true }),
    externalTimeoutMs: configService.get("AI_EXTERNAL_TIMEOUT_MS", { infer: true }),
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
