/*
 * Funcionalidad: Caso de uso GetAiConversation
 * Descripción: Obtiene una conversación propia del tutor de IA con sus mensajes en orden cronológico; la de otro usuario responde 404
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { AiConversationDetailResult } from "@/features/ai-tutor/application/results/ai-conversation-detail.result";
import { AiConversationNotFoundError } from "@/features/ai-tutor/domain/ai-tutor.errors";
import { type AiConversation } from "@/features/ai-tutor/domain/entities/ai-conversation.entity";
import { type AiConversationMessage } from "@/features/ai-tutor/domain/read-models/ai-conversation-message.read-model";
import { AI_CONVERSATIONS_REPOSITORY_TOKEN, type IAiConversationsRepository } from "@/features/ai-tutor/domain/repositories/ai-conversations.repository";

/**
 * @throws {AiConversationNotFoundError} If the conversation does not exist or belongs to another user
 */
@Injectable()
export class GetAiConversationUseCase {
  public constructor(
    @Inject(AI_CONVERSATIONS_REPOSITORY_TOKEN)
    private readonly _conversationsRepository: IAiConversationsRepository,
  ) {}

  public async execute(conversationId: string, userId: string): Promise<AiConversationDetailResult> {
    const conversation: AiConversation | undefined = await this._conversationsRepository.getById(conversationId, userId);

    if (!conversation) {
      throw new AiConversationNotFoundError();
    }

    const messages: AiConversationMessage[] = await this._conversationsRepository.getMessages(conversation.id);

    return new AiConversationDetailResult({ conversation, messages });
  }
}
