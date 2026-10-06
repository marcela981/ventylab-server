/*
 * Funcionalidad: Caso de uso StartAiConversation
 * Descripción: Inicia una conversación del tutor de IA de chat libre, lección o módulo (la referencia es obligatoria para lección y módulo y se ignora en el chat libre) y transmite la primera respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type StartAiConversationCommand } from "@/features/ai-tutor/application/commands/start-ai-conversation.command";
import { type TutorStreamResult } from "@/features/ai-tutor/application/results/tutor-stream.result";
import { TutorTurnService } from "@/features/ai-tutor/application/services/tutor-turn.service";
import { AiConversationRefRequiredError } from "@/features/ai-tutor/domain/ai-tutor.errors";
import { AiConversation } from "@/features/ai-tutor/domain/entities/ai-conversation.entity";
import { FREE_CONVERSATION_SCOPE } from "@/features/ai-tutor/domain/value-objects/ai-conversation-scope";

/**
 * @throws {AiConversationRefRequiredError} If a lesson or module conversation has no reference
 * @throws {LessonNotFoundError} If the lesson does not exist or is not visible to the reader
 * @throws {ModuleNotFoundError} If the module does not exist or is not visible to the reader
 * @throws {AiQuotaExceededError} If the caller's daily AI quota is exhausted
 */
@Injectable()
export class StartAiConversationUseCase {
  public constructor(private readonly _turnService: TutorTurnService) {}

  public async execute(command: StartAiConversationCommand): Promise<TutorStreamResult> {
    const isFree: boolean = command.scope === FREE_CONVERSATION_SCOPE;

    if (!isFree && !command.refId) {
      throw new AiConversationRefRequiredError();
    }

    const conversation: AiConversation = AiConversation.start({
      userId: command.caller.userId,
      scope: command.scope,
      refId: isFree ? undefined : command.refId,
      firstMessage: command.message,
    });

    return await this._turnService.answerConversation({
      conversation,
      isNewConversation: true,
      message: command.message,
      currentPageId: command.currentPageId,
      caller: command.caller,
      signal: command.signal,
    });
  }
}
