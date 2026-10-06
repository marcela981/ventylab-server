/*
 * Funcionalidad: Caso de uso DeleteAiConversation
 * Descripción: Elimina una conversación propia del tutor de IA con sus mensajes; la de otro usuario responde 404
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { AiConversationNotFoundError } from "@/features/ai-tutor/domain/ai-tutor.errors";
import { AI_CONVERSATIONS_REPOSITORY_TOKEN, type IAiConversationsRepository } from "@/features/ai-tutor/domain/repositories/ai-conversations.repository";

/**
 * @throws {AiConversationNotFoundError} If the conversation does not exist or belongs to another user
 */
@Injectable()
export class DeleteAiConversationUseCase {
  public constructor(
    @Inject(AI_CONVERSATIONS_REPOSITORY_TOKEN)
    private readonly _conversationsRepository: IAiConversationsRepository,
  ) {}

  public async execute(conversationId: string, userId: string): Promise<void> {
    const deleted: boolean = await this._conversationsRepository.delete(conversationId, userId);

    if (!deleted) {
      throw new AiConversationNotFoundError();
    }
  }
}
