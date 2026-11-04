/*
 * Funcionalidad: Registro de proveedores de IA
 * Descripción: Construye a partir de la configuración leída el registro de proveedores LLM disponibles: Gemini, OpenAI y Anthropic solo con su clave configurada; v1.1: el proveedor externo de terceros (formato openai o simple) solo con URL base y modelo configurados, en reemplazo del proveedor HTTP personalizado retirado
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiProviderRegistry, type ILlmProvider } from "@/features/ai/application/ports/llm-provider.interface";
import { AnthropicProvider, DEFAULT_ANTHROPIC_BASE_URL } from "@/features/ai/infrastructure/providers/anthropic.provider";
import { ExternalProvider, type ExternalProviderFormat } from "@/features/ai/infrastructure/providers/external.provider";
import { GeminiProvider } from "@/features/ai/infrastructure/providers/gemini.provider";
import { DEFAULT_OPENAI_BASE_URL, OpenAIProvider } from "@/features/ai/infrastructure/providers/openai.provider";

export interface AiProvidersConfig {
  readonly geminiApiKey?: string;
  readonly openaiApiKey?: string;
  readonly openaiBaseUrl?: string;
  readonly anthropicApiKey?: string;
  readonly anthropicBaseUrl?: string;
  readonly externalBaseUrl?: string;
  readonly externalApiKey?: string;
  readonly externalAuthHeader?: string;
  readonly externalModel?: string;
  readonly externalFormat?: ExternalProviderFormat;
  readonly externalTimeoutMs?: number;
}

export function buildAiProviderRegistry(config: AiProvidersConfig): AiProviderRegistry {
  const providers: ILlmProvider[] = [];

  if (config.geminiApiKey) {
    providers.push(new GeminiProvider(config.geminiApiKey));
  }

  if (config.openaiApiKey) {
    providers.push(new OpenAIProvider(config.openaiApiKey, config.openaiBaseUrl ?? DEFAULT_OPENAI_BASE_URL));
  }

  if (config.anthropicApiKey) {
    providers.push(new AnthropicProvider(config.anthropicApiKey, config.anthropicBaseUrl ?? DEFAULT_ANTHROPIC_BASE_URL));
  }

  if (config.externalBaseUrl && config.externalModel) {
    providers.push(
      new ExternalProvider({
        baseUrl: config.externalBaseUrl,
        model: config.externalModel,
        format: config.externalFormat ?? "openai",
        apiKey: config.externalApiKey,
        authHeader: config.externalAuthHeader,
        timeoutMs: config.externalTimeoutMs,
      }),
    );
  }

  return new Map<string, ILlmProvider>(providers.map((provider: ILlmProvider) => [provider.id, provider]));
}
