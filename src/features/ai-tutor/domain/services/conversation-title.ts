/*
 * Funcionalidad: Título automático de conversación
 * Descripción: Deriva el título de una conversación del tutor a partir del primer mensaje del usuario (espacios colapsados, truncado a 60 caracteres) sin llamar a ningún modelo de lenguaje
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const MAX_CONVERSATION_TITLE_LENGTH: number = 60;

export const DEFAULT_CONVERSATION_TITLE: string = "Nueva conversación";

export function buildConversationTitle(firstMessage: string): string {
  const collapsed: string = firstMessage.replace(/\s+/g, " ").trim();

  if (collapsed.length === 0) {
    return DEFAULT_CONVERSATION_TITLE;
  }

  if (collapsed.length <= MAX_CONVERSATION_TITLE_LENGTH) {
    return collapsed;
  }

  return `${collapsed.slice(0, MAX_CONVERSATION_TITLE_LENGTH - 1).trimEnd()}…`;
}
