/*
 * Funcionalidad: Resultado de detalle de conversación
 * Descripción: Conversación propia del tutor de IA junto con sus mensajes en orden cronológico
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiConversation } from "@/features/ai-tutor/domain/entities/ai-conversation.entity";
import { type AiConversationMessage } from "@/features/ai-tutor/domain/read-models/ai-conversation-message.read-model";

export class AiConversationDetailResult {
  public readonly conversation: AiConversation;
  public readonly messages: AiConversationMessage[];

  public constructor({ conversation, messages }: { conversation: AiConversation; messages: AiConversationMessage[] }) {
    this.conversation = conversation;
    this.messages = messages;
  }
}
