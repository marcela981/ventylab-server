/*
 * Funcionalidad: Servicio de turnos del tutor
 * Descripción: Ejecuta un turno de conversación con el tutor de IA: redacta correo y nombre del texto saliente, arma el historial y el contexto, verifica el tema del chat libre con TOPIC_CHECK (respaldo por lista de términos) y responde con el rechazo fijo registrando BLOCKED_OFFTOPIC, abre el stream del gateway (cuota verificada antes de persistir), guarda el mensaje del usuario antes de llamar al modelo y la respuesta completa con su aiCallId o la parcial como incompleta si el stream se corta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { generateId } from "@/common/domain/utils/generate-id";
import { type AiCallOptions, AiGateway } from "@/features/ai/application/services/ai-gateway";
import { redactPersonalData } from "@/features/ai/domain/prompts/personal-data-guard";
import { type AiPromptInputs, type ConversationPromptInput } from "@/features/ai/domain/prompts/prompt-registry";
import { type AiMessage } from "@/features/ai/domain/prompts/prompt-template";
import { type AiResult, type AiStreamChunk } from "@/features/ai/domain/results/ai-result";
import { type TutorCaller } from "@/features/ai-tutor/application/commands/tutor-caller";
import { type ITutorPersonalData, TUTOR_PERSONAL_DATA_TOKEN } from "@/features/ai-tutor/application/ports/tutor-personal-data.interface";
import { TutorStreamResult, type TutorStreamEvent } from "@/features/ai-tutor/application/results/tutor-stream.result";
import { type TutorConversationContext, TutorContextAssembler } from "@/features/ai-tutor/application/services/tutor-context-assembler";
import { type AiConversation } from "@/features/ai-tutor/domain/entities/ai-conversation.entity";
import { type AiConversationMessage } from "@/features/ai-tutor/domain/read-models/ai-conversation-message.read-model";
import { AI_CONVERSATIONS_REPOSITORY_TOKEN, type IAiConversationsRepository } from "@/features/ai-tutor/domain/repositories/ai-conversations.repository";
import { OFF_TOPIC_REPLY, parseTopicCheckResponse, termListCheck } from "@/features/ai-tutor/domain/services/topic-guard";
import { buildHistoryWindow } from "@/features/ai-tutor/domain/services/tutor-context";
import { FREE_CONVERSATION_SCOPE } from "@/features/ai-tutor/domain/value-objects/ai-conversation-scope";

export const AI_MESSAGE_REF_TYPE: string = "ai_message";

export type TutorStreamUseCase = "PAGE_DEEPEN" | "LESSON_QA" | "FREE_CHAT";

export type TextRedactor = (text: string) => string;

export interface TutorTurn<U extends TutorStreamUseCase> {
  readonly conversation: AiConversation;
  readonly isNewConversation: boolean;
  readonly userText: string;
  readonly caller: TutorCaller;
  readonly useCase: U;
  readonly input: AiPromptInputs[U];
  readonly signal?: AbortSignal;
}

export interface TutorConversationTurn {
  readonly conversation: AiConversation;
  readonly isNewConversation: boolean;
  readonly message: string;
  readonly currentPageId?: string;
  readonly caller: TutorCaller;
  readonly signal?: AbortSignal;
}

interface AssistantTarget {
  readonly conversationId: string;
  readonly messageId: string;
}

function emitAll(events: readonly TutorStreamEvent[]): AsyncIterable<TutorStreamEvent> {
  return {
    [Symbol.asyncIterator]: (): AsyncIterator<TutorStreamEvent> => {
      let index: number = 0;

      return {
        next: (): Promise<IteratorResult<TutorStreamEvent>> => {
          const event: TutorStreamEvent | undefined = events[index];

          index++;

          return Promise.resolve(event ? { done: false, value: event } : { done: true, value: undefined });
        },
      };
    },
  };
}

@Injectable()
export class TutorTurnService {
  private readonly _logger: Logger = new Logger(TutorTurnService.name);

  public constructor(
    private readonly _gateway: AiGateway,
    @Inject(AI_CONVERSATIONS_REPOSITORY_TOKEN)
    private readonly _conversationsRepository: IAiConversationsRepository,
    @Inject(TUTOR_PERSONAL_DATA_TOKEN)
    private readonly _personalData: ITutorPersonalData,
    private readonly _contextAssembler: TutorContextAssembler,
  ) {}

  public async redactorFor(caller: TutorCaller): Promise<TextRedactor> {
    const names: string[] = await this._personalData.getRedactableNames(caller.userId);
    const identifiers: string[] = [caller.email, ...names];

    return (text: string): string => redactPersonalData(text, identifiers);
  }

  public async answerConversation(turn: TutorConversationTurn): Promise<TutorStreamResult> {
    const { conversation, caller } = turn;
    const redact: TextRedactor = await this.redactorFor(caller);
    const history: AiMessage[] = await this._history(turn, redact);
    const question: string = redact(turn.message);

    if (conversation.scope === FREE_CONVERSATION_SCOPE) {
      const input: ConversationPromptInput = { history, question, language: caller.language };

      if (!(await this._isOnTopic(question, caller, turn.signal))) {
        return await this._refuseOffTopic(turn, input);
      }

      return await this.streamTurn({ ...this._turnBase(turn), useCase: "FREE_CHAT", input });
    }

    const context: TutorConversationContext = await this._contextAssembler.forConversation({
      scope: conversation.scope,
      refId: conversation.refId,
      currentPageId: turn.currentPageId,
      question,
      canManage: caller.canManage,
    });

    return await this.streamTurn({
      ...this._turnBase(turn),
      useCase: "LESSON_QA",
      input: { history, question, contextTitle: context.contextTitle, context: context.context, language: caller.language },
    });
  }

  public async streamTurn<U extends TutorStreamUseCase>(turn: TutorTurn<U>): Promise<TutorStreamResult> {
    const target: AssistantTarget = { conversationId: turn.conversation.id, messageId: generateId() };
    const chunks: AsyncIterable<AiStreamChunk> = await this._gateway.stream(turn.useCase, turn.input, this._callOptions(turn.caller, target, turn.signal));

    await this._persistUserMessage(turn.conversation, turn.isNewConversation, turn.userText);

    return new TutorStreamResult({ conversationId: target.conversationId, events: this._relay(chunks, target) });
  }

  private _turnBase(turn: TutorConversationTurn): Omit<TutorTurn<TutorStreamUseCase>, "useCase" | "input"> {
    return { conversation: turn.conversation, isNewConversation: turn.isNewConversation, userText: turn.message, caller: turn.caller, signal: turn.signal };
  }

  private async _history(turn: TutorConversationTurn, redact: TextRedactor): Promise<AiMessage[]> {
    if (turn.isNewConversation) {
      return [];
    }

    const window: number = this._gateway.getTutorSettings().historyWindow;
    const recent: AiConversationMessage[] = await this._conversationsRepository.getRecentMessages(turn.conversation.id, window);

    return buildHistoryWindow(recent, window, redact);
  }

  private async _isOnTopic(message: string, caller: TutorCaller, signal?: AbortSignal): Promise<boolean> {
    const result: AiResult = await this._gateway.complete(
      "TOPIC_CHECK",
      { message },
      {
        userId: caller.userId,
        userRole: caller.userRole,
        signal,
        fallback: () => JSON.stringify({ onTopic: termListCheck(message) }),
      },
    );

    return parseTopicCheckResponse(result.content) ?? termListCheck(message);
  }

  private async _refuseOffTopic(turn: TutorConversationTurn, input: ConversationPromptInput): Promise<TutorStreamResult> {
    const target: AssistantTarget = { conversationId: turn.conversation.id, messageId: generateId() };

    await this._persistUserMessage(turn.conversation, turn.isNewConversation, turn.message);

    const aiCallId: string = this._gateway.recordBlocked("FREE_CHAT", input, this._callOptions(turn.caller, target));

    await this._conversationsRepository.addMessage({
      id: target.messageId,
      conversationId: target.conversationId,
      role: "ASSISTANT",
      content: OFF_TOPIC_REPLY,
      aiCallId,
      isIncomplete: false,
    });

    const events: TutorStreamEvent[] = [
      { type: "delta", text: OFF_TOPIC_REPLY },
      { type: "done", aiCallId, messageId: target.messageId, conversationId: target.conversationId },
    ];

    return new TutorStreamResult({ conversationId: target.conversationId, events: emitAll(events) });
  }

  private async _persistUserMessage(conversation: AiConversation, isNewConversation: boolean, text: string): Promise<void> {
    if (isNewConversation) {
      await this._conversationsRepository.save(conversation);
    }

    await this._conversationsRepository.addMessage({ id: generateId(), conversationId: conversation.id, role: "USER", content: text, isIncomplete: false });
  }

  private async *_relay(chunks: AsyncIterable<AiStreamChunk>, target: AssistantTarget): AsyncGenerator<TutorStreamEvent> {
    let received: string = "";
    let persisted: boolean = false;

    try {
      for await (const chunk of chunks) {
        if (chunk.type === "delta") {
          received += chunk.text;

          yield { type: "delta", text: chunk.text };

          continue;
        }

        persisted = true;

        await this._conversationsRepository.addMessage({
          id: target.messageId,
          conversationId: target.conversationId,
          role: "ASSISTANT",
          content: chunk.result.content,
          aiCallId: chunk.result.aiCallId,
          isIncomplete: false,
        });

        yield { type: "done", aiCallId: chunk.result.aiCallId, messageId: target.messageId, conversationId: target.conversationId };
      }
    } finally {
      if (!persisted) {
        await this._persistIncomplete(target, received);
      }
    }
  }

  // Runs while the stream is being torn down (abort, provider failure), so a failed write is logged instead of masking the original outcome.
  private async _persistIncomplete(target: AssistantTarget, received: string): Promise<void> {
    if (received.trim().length === 0) {
      return;
    }

    try {
      await this._conversationsRepository.addMessage({
        id: target.messageId,
        conversationId: target.conversationId,
        role: "ASSISTANT",
        content: received,
        isIncomplete: true,
      });
    } catch (error: unknown) {
      this._logger.error(`Failed to persist the incomplete tutor answer ${target.messageId}: ${error instanceof Error ? error.name : "UnknownError"}`);
    }
  }

  private _callOptions(caller: TutorCaller, target: AssistantTarget, signal?: AbortSignal): AiCallOptions {
    return { userId: caller.userId, userRole: caller.userRole, signal, refType: AI_MESSAGE_REF_TYPE, refId: target.messageId };
  }
}
