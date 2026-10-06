/*
 * Funcionalidad: Caso de uso GetAiConversations
 * Descripción: Lista paginada de las conversaciones propias del tutor de IA, filtrable por alcance, ordenadas por última actividad
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
import {
  AI_CONVERSATIONS_REPOSITORY_TOKEN,
  type GetAiConversationsQuery,
  type IAiConversationsRepository,
} from "@/features/ai-tutor/domain/repositories/ai-conversations.repository";

@Injectable()
export class GetAiConversationsUseCase {
  public constructor(
    @Inject(AI_CONVERSATIONS_REPOSITORY_TOKEN)
    private readonly _conversationsRepository: IAiConversationsRepository,
  ) {}

  public async execute(query: GetAiConversationsQuery): Promise<Paginated<AiConversation>> {
    return await this._conversationsRepository.getAll(query);
  }
}
