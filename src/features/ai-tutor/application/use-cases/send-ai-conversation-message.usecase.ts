/*
 * Funcionalidad: Caso de uso SendAiConversationMessage
 * Descripción: Envía un nuevo mensaje a una conversación propia del tutor de IA (la de otro usuario responde 404) y transmite la respuesta con la ventana de historial configurada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type SendAiConversationMessageCommand } from "@/features/ai-tutor/application/commands/send-ai-conversation-message.command";
import { type TutorStreamResult } from "@/features/ai-tutor/application/results/tutor-stream.result";
import { TutorTurnService } from "@/features/ai-tutor/application/services/tutor-turn.service";
import { AiConversationNotFoundError } from "@/features/ai-tutor/domain/ai-tutor.errors";
import { type AiConversation } from "@/features/ai-tutor/domain/entities/ai-conversation.entity";
import { AI_CONVERSATIONS_REPOSITORY_TOKEN, type IAiConversationsRepository } from "@/features/ai-tutor/domain/repositories/ai-conversations.repository";

/**
 * @throws {AiConversationNotFoundError} If the conversation does not exist or belongs to another user
 * @throws {PageNotFoundError} If the page of a page conversation is no longer visible to the reader
 * @throws {LessonNotFoundError} If the lesson is no longer visible to the reader
 * @throws {ModuleNotFoundError} If the module is no longer visible to the reader
 * @throws {AiQuotaExceededError} If the caller's daily AI quota is exhausted
 */
@Injectable()
export class SendAiConversationMessageUseCase {
  public constructor(
    @Inject(AI_CONVERSATIONS_REPOSITORY_TOKEN)
    private readonly _conversationsRepository: IAiConversationsRepository,
    private readonly _turnService: TutorTurnService,
  ) {}

  public async execute(command: SendAiConversationMessageCommand): Promise<TutorStreamResult> {
    const conversation: AiConversation | undefined = await this._conversationsRepository.getById(command.conversationId, command.caller.userId);

    if (!conversation) {
      throw new AiConversationNotFoundError();
    }

    return await this._turnService.answerConversation({
      conversation,
      isNewConversation: false,
      message: command.message,
      currentPageId: command.currentPageId,
      caller: command.caller,
      signal: command.signal,
    });
  }
}
