/*
 * Funcionalidad: Caso de uso DeepenPage
 * Descripción: Profundiza una página con el tutor de IA: carga la página solo si es visible para el lector (borrador para estudiante responde 404), valida la conversación de página indicada o crea una nueva por solicitud, arma el contexto con lección, módulo y fuente de conocimiento y abre el stream de PAGE_DEEPEN
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type DeepenPageCommand } from "@/features/ai-tutor/application/commands/deepen-page.command";
import {
  type ITutorContentReader,
  TUTOR_CONTENT_READER_TOKEN,
  type TutorPageContent,
} from "@/features/ai-tutor/application/ports/tutor-content-reader.interface";
import { type TutorStreamResult } from "@/features/ai-tutor/application/results/tutor-stream.result";
import { TutorContextAssembler } from "@/features/ai-tutor/application/services/tutor-context-assembler";
import { type TextRedactor, TutorTurnService } from "@/features/ai-tutor/application/services/tutor-turn.service";
import { AiConversationNotFoundError, AiConversationPageMismatchError } from "@/features/ai-tutor/domain/ai-tutor.errors";
import { AiConversation } from "@/features/ai-tutor/domain/entities/ai-conversation.entity";
import { AI_CONVERSATIONS_REPOSITORY_TOKEN, type IAiConversationsRepository } from "@/features/ai-tutor/domain/repositories/ai-conversations.repository";
import { PAGE_CONVERSATION_SCOPE } from "@/features/ai-tutor/domain/value-objects/ai-conversation-scope";

/**
 * @throws {PageNotFoundError} If the page does not exist or is not visible to the reader
 * @throws {AiConversationNotFoundError} If the given conversation does not exist or belongs to another user
 * @throws {AiConversationPageMismatchError} If the given conversation is not a conversation of this page
 * @throws {AiQuotaExceededError} If the caller's daily AI quota is exhausted
 */
@Injectable()
export class DeepenPageUseCase {
  public constructor(
    @Inject(TUTOR_CONTENT_READER_TOKEN)
    private readonly _contentReader: ITutorContentReader,
    @Inject(AI_CONVERSATIONS_REPOSITORY_TOKEN)
    private readonly _conversationsRepository: IAiConversationsRepository,
    private readonly _contextAssembler: TutorContextAssembler,
    private readonly _turnService: TutorTurnService,
  ) {}

  public async execute(command: DeepenPageCommand): Promise<TutorStreamResult> {
    const { caller } = command;
    const page: TutorPageContent = await this._contentReader.getPage(command.pageId, caller.canManage);
    const trimmed: string = command.question?.trim() ?? "";
    const question: string | undefined = trimmed.length > 0 ? trimmed : undefined;
    const userText: string = question ?? `Profundiza el contenido de la página «${page.title}».`;
    const existing: AiConversation | undefined = command.conversationId
      ? await this._ownPageConversation(command.conversationId, caller.userId, page.id)
      : undefined;
    const conversation: AiConversation =
      existing ?? AiConversation.start({ userId: caller.userId, scope: PAGE_CONVERSATION_SCOPE, refId: page.id, firstMessage: userText });
    const redact: TextRedactor = await this._turnService.redactorFor(caller);
    const pageContent: string = await this._contextAssembler.forPageDeepen(page, question ?? page.title);

    return await this._turnService.streamTurn({
      conversation,
      isNewConversation: existing === undefined,
      userText,
      caller,
      useCase: "PAGE_DEEPEN",
      input: { pageTitle: page.title, pageContent, question: question ? redact(question) : undefined, language: caller.language },
      signal: command.signal,
    });
  }

  private async _ownPageConversation(conversationId: string, userId: string, pageId: string): Promise<AiConversation> {
    const conversation: AiConversation | undefined = await this._conversationsRepository.getById(conversationId, userId);

    if (!conversation) {
      throw new AiConversationNotFoundError();
    }

    if (conversation.scope !== PAGE_CONVERSATION_SCOPE || conversation.refId !== pageId) {
      throw new AiConversationPageMismatchError();
    }

    return conversation;
  }
}
