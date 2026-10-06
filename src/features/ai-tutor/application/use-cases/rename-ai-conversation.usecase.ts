/*
 * Funcionalidad: Caso de uso RenameAiConversation
 * Descripción: Renombra una conversación propia del tutor de IA (espacios colapsados, máximo 60 caracteres); la de otro usuario responde 404
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type RenameAiConversationCommand } from "@/features/ai-tutor/application/commands/rename-ai-conversation.command";
import { AiConversationNotFoundError } from "@/features/ai-tutor/domain/ai-tutor.errors";
import { type AiConversation } from "@/features/ai-tutor/domain/entities/ai-conversation.entity";
import { AI_CONVERSATIONS_REPOSITORY_TOKEN, type IAiConversationsRepository } from "@/features/ai-tutor/domain/repositories/ai-conversations.repository";

/**
 * @throws {AiConversationNotFoundError} If the conversation does not exist or belongs to another user
 */
@Injectable()
export class RenameAiConversationUseCase {
  public constructor(
    @Inject(AI_CONVERSATIONS_REPOSITORY_TOKEN)
    private readonly _conversationsRepository: IAiConversationsRepository,
  ) {}

  public async execute(command: RenameAiConversationCommand): Promise<void> {
    const conversation: AiConversation | undefined = await this._conversationsRepository.getById(command.conversationId, command.userId);

    if (!conversation) {
      throw new AiConversationNotFoundError();
    }

    conversation.rename(command.title);

    await this._conversationsRepository.save(conversation);
  }
}
