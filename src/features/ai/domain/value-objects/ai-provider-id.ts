/*
 * Funcionalidad: Identificadores de proveedores de IA
 * Descripción: Enumera los proveedores LLM que el gateway sabe construir (Gemini, OpenAI, Anthropic y el proveedor HTTP personalizado), estén o no configurados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const AI_PROVIDER_ID_VALUES: readonly string[] = ["gemini", "openai", "anthropic", "custom"] as const;

export function isKnownAiProviderId(value: string): boolean {
  return AI_PROVIDER_ID_VALUES.includes(value);
}
