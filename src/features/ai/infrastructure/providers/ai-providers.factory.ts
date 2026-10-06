/*
 * Funcionalidad: Registro de proveedores de IA
 * Descripción: Construye a partir de la configuración leída el registro de proveedores LLM disponibles: Gemini, OpenAI y Anthropic solo con su clave configurada, y el proveedor HTTP personalizado solo con endpoint, cabecera de autenticación y mapeo configurados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiProviderRegistry, type ILlmProvider } from "@/features/ai/application/ports/llm-provider.interface";
import { AnthropicProvider, DEFAULT_ANTHROPIC_BASE_URL } from "@/features/ai/infrastructure/providers/anthropic.provider";
import { CustomHttpProvider } from "@/features/ai/infrastructure/providers/custom-http.provider";
import { GeminiProvider } from "@/features/ai/infrastructure/providers/gemini.provider";
import { DEFAULT_OPENAI_BASE_URL, OpenAIProvider } from "@/features/ai/infrastructure/providers/openai.provider";

export interface AiProvidersConfig {
  readonly geminiApiKey?: string;
  readonly openaiApiKey?: string;
  readonly openaiBaseUrl?: string;
  readonly anthropicApiKey?: string;
  readonly anthropicBaseUrl?: string;
  readonly customEndpoint?: string;
  readonly customAuthHeader?: string;
  readonly customAuthValue?: string;
  readonly customMappingConfigured: boolean;
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

  if (config.customEndpoint && config.customAuthHeader && config.customAuthValue && config.customMappingConfigured) {
    providers.push(new CustomHttpProvider({ endpoint: config.customEndpoint, authHeader: config.customAuthHeader, authValue: config.customAuthValue }));
  }

  return new Map<string, ILlmProvider>(providers.map((provider: ILlmProvider) => [provider.id, provider]));
}
