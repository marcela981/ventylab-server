/*
 * Funcionalidad: Modelo de lectura de mensajes del tutor
 * Descripción: Tipos de los mensajes de una conversación del tutor de IA (rol, contenido, id de la llamada de IA y marca de respuesta incompleta) y de un mensaje nuevo por persistir
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type AiConversationMessageRoleValue = "USER" | "ASSISTANT";

export const AI_CONVERSATION_MESSAGE_ROLE_VALUES: readonly AiConversationMessageRoleValue[] = ["USER", "ASSISTANT"] as const;

export interface AiConversationMessage {
  readonly id: string;
  readonly conversationId: string;
  readonly role: AiConversationMessageRoleValue;
  readonly content: string;
  readonly aiCallId?: string;
  readonly isIncomplete: boolean;
  readonly createdAt: Date;
}

export interface NewAiConversationMessage {
  readonly id: string;
  readonly conversationId: string;
  readonly role: AiConversationMessageRoleValue;
  readonly content: string;
  readonly aiCallId?: string;
  readonly isIncomplete: boolean;
}
