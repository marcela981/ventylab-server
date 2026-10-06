/*
 * Funcionalidad: Mapper de persistencia de conversaciones del tutor
 * Descripción: Convierte filas de ai_conversations y ai_messages de Prisma en la entidad AiConversation y el modelo de lectura de mensajes, y la entidad en datos de persistencia
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiConversation as AiConversationModel, type AiMessage as AiMessageModel, type Prisma } from "@prisma/client";

import { AiConversation } from "@/features/ai-tutor/domain/entities/ai-conversation.entity";
import { type AiConversationMessage } from "@/features/ai-tutor/domain/read-models/ai-conversation-message.read-model";

export class AiConversationsMapper {
  public static toDomain(row: AiConversationModel): AiConversation {
    return AiConversation.reconstitute({
      id: row.id,
      userId: row.userId,
      scope: row.scope,
      refId: row.refId ?? undefined,
      title: row.title,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  public static toPersistence(conversation: AiConversation): Prisma.AiConversationUncheckedCreateInput {
    return {
      id: conversation.id,
      userId: conversation.userId,
      scope: conversation.scope,
      refId: conversation.refId ?? null,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  public static toMessage(row: AiMessageModel): AiConversationMessage {
    return {
      id: row.id,
      conversationId: row.conversationId,
      role: row.role,
      content: row.content,
      aiCallId: row.aiCallId ?? undefined,
      isIncomplete: row.isIncomplete,
      createdAt: row.createdAt,
    };
  }
}
