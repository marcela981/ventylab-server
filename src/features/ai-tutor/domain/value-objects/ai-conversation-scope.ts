/*
 * Funcionalidad: Alcance de conversación del tutor
 * Descripción: Valores del alcance de una conversación del tutor de IA (chat libre, lección, módulo o página) y los alcances que el estudiante puede iniciar directamente
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type AiConversationScopeValue = "FREE" | "LESSON" | "MODULE" | "PAGE";

export const FREE_CONVERSATION_SCOPE: AiConversationScopeValue = "FREE";

export const LESSON_CONVERSATION_SCOPE: AiConversationScopeValue = "LESSON";

export const MODULE_CONVERSATION_SCOPE: AiConversationScopeValue = "MODULE";

export const PAGE_CONVERSATION_SCOPE: AiConversationScopeValue = "PAGE";

export const AI_CONVERSATION_SCOPE_VALUES: readonly AiConversationScopeValue[] = [
  FREE_CONVERSATION_SCOPE,
  LESSON_CONVERSATION_SCOPE,
  MODULE_CONVERSATION_SCOPE,
  PAGE_CONVERSATION_SCOPE,
] as const;

// Page conversations are opened through the page deepen route, never through the generic conversation route.
export const STARTABLE_CONVERSATION_SCOPE_VALUES: readonly AiConversationScopeValue[] = [
  FREE_CONVERSATION_SCOPE,
  LESSON_CONVERSATION_SCOPE,
  MODULE_CONVERSATION_SCOPE,
] as const;
