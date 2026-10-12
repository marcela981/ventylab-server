/*
 * Funcionalidad: Fachada AiTutorFacade
 * Descripción: API pública del tutor de IA para otras features: últimas conversaciones de un usuario (actualizadas más recientemente primero) con su alcance, referencia y título, sin mensajes
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { type AiConversation } from "@/features/ai-tutor/domain/entities/ai-conversation.entity";
import { AI_CONVERSATIONS_REPOSITORY_TOKEN, type IAiConversationsRepository } from "@/features/ai-tutor/domain/repositories/ai-conversations.repository";

export interface AiConversationSummary {
  readonly id: string;
  readonly scope: string;
  readonly refId?: string;
  readonly title: string;
  readonly updatedAt: Date;
}

@Injectable()
export class AiTutorFacade {
  public constructor(
    @Inject(AI_CONVERSATIONS_REPOSITORY_TOKEN)
    private readonly _conversationsRepository: IAiConversationsRepository,
  ) {}

  public async getLatestConversations(userId: string, limit: number): Promise<AiConversationSummary[]> {
    const conversations: Paginated<AiConversation> = await this._conversationsRepository.getAll({ userId, page: 1, limit, sortOrder: "desc" });

    return conversations.data.map(
      (conversation: AiConversation): AiConversationSummary => ({
        id: conversation.id,
        scope: conversation.scope,
        refId: conversation.refId,
        title: conversation.title,
        updatedAt: conversation.updatedAt,
      }),
    );
  }
}
