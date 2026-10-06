/*
 * Funcionalidad: Repositorio de conversaciones del tutor
 * Descripción: Contrato de persistencia de las conversaciones del tutor de IA y sus mensajes, siempre filtrado por el dueño: consulta paginada por alcance, detalle, guardado, borrado, mensajes recientes y alta de mensajes
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ListQuery } from "@/common/domain/utils/list-query";
import { type Paginated } from "@/common/domain/utils/paginated";
import { type AiConversation } from "@/features/ai-tutor/domain/entities/ai-conversation.entity";
import {
  type AiConversationMessage,
  type NewAiConversationMessage,
} from "@/features/ai-tutor/domain/read-models/ai-conversation-message.read-model";
import { type AiConversationScopeValue } from "@/features/ai-tutor/domain/value-objects/ai-conversation-scope";

export const AI_CONVERSATIONS_REPOSITORY_TOKEN: unique symbol = Symbol("AI_CONVERSATIONS_REPOSITORY_TOKEN");

export interface GetAiConversationsQuery extends ListQuery {
  userId: string;
  scope?: AiConversationScopeValue;
}

export interface IAiConversationsRepository {
  getById(id: string, ownerId: string): Promise<AiConversation | undefined>;
  getAll(query: GetAiConversationsQuery): Promise<Paginated<AiConversation>>;
  save(conversation: AiConversation): Promise<void>;
  delete(id: string, ownerId: string): Promise<boolean>;
  getMessages(conversationId: string): Promise<AiConversationMessage[]>;
  getRecentMessages(conversationId: string, limit: number): Promise<AiConversationMessage[]>;
  addMessage(message: NewAiConversationMessage): Promise<void>;
}
