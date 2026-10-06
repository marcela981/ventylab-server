/*
 * Funcionalidad: Mapper de presentación del tutor de IA
 * Descripción: Convierte las conversaciones del tutor y sus mensajes en los DTOs de respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiConversationDetailResult } from "@/features/ai-tutor/application/results/ai-conversation-detail.result";
import { type AiConversation } from "@/features/ai-tutor/domain/entities/ai-conversation.entity";
import { type AiConversationMessage } from "@/features/ai-tutor/domain/read-models/ai-conversation-message.read-model";
import { AiConversationDetailDTO, AiConversationDTO, AiConversationMessageDTO } from "@/features/ai-tutor/presentation/dtos/ai-conversation.dto";

export class AiTutorMapper {
  public static toConversationDTO(conversation: AiConversation): AiConversationDTO {
    return new AiConversationDTO({
      id: conversation.id,
      scope: conversation.scope,
      refId: conversation.refId ?? null,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  }

  public static toMessageDTO(message: AiConversationMessage): AiConversationMessageDTO {
    return new AiConversationMessageDTO({
      id: message.id,
      role: message.role,
      content: message.content,
      aiCallId: message.aiCallId ?? null,
      isIncomplete: message.isIncomplete,
      createdAt: message.createdAt,
    });
  }

  public static toDetailDTO(detail: AiConversationDetailResult): AiConversationDetailDTO {
    return new AiConversationDetailDTO({
      conversation: AiTutorMapper.toConversationDTO(detail.conversation),
      messages: detail.messages.map((message: AiConversationMessage) => AiTutorMapper.toMessageDTO(message)),
    });
  }
}
