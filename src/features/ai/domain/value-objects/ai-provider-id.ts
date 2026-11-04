/*
 * Funcionalidad: Identificadores de proveedores de IA
 * Descripción: Enumera los proveedores LLM que el gateway sabe construir (Gemini, OpenAI, Anthropic y el proveedor externo de terceros), estén o no configurados; v1.1: el identificador heredado custom (proveedor HTTP personalizado retirado) se sigue aceptando en cadenas y ajustes guardados y se resuelve como external
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const EXTERNAL_PROVIDER_ID: string = "external";

// Retired id of the old custom HTTP stub; platform settings saved before the external provider may still name it.
export const LEGACY_CUSTOM_PROVIDER_ID: string = "custom";

// Model placeholder meaning "the model the provider was configured with" (the external provider reads it from AI_EXTERNAL_MODEL).
export const PROVIDER_DEFAULT_MODEL: string = "default";

export const AI_PROVIDER_ID_VALUES: readonly string[] = ["gemini", "openai", "anthropic", EXTERNAL_PROVIDER_ID] as const;

export function normalizeAiProviderId(value: string): string {
  return value === LEGACY_CUSTOM_PROVIDER_ID ? EXTERNAL_PROVIDER_ID : value;
}

export function isKnownAiProviderId(value: string): boolean {
  return AI_PROVIDER_ID_VALUES.includes(normalizeAiProviderId(value));
}
