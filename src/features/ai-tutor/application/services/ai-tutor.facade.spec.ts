/*
 * Funcionalidad: Pruebas de AiTutorFacade
 * Descripción: Verifica que las últimas conversaciones de un usuario se piden en una sola página ordenada de la más reciente a la más antigua y se exponen sin mensajes
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Paginated } from "@/common/domain/utils/paginated";
import { type AiConversationSummary, AiTutorFacade } from "@/features/ai-tutor/application/services/ai-tutor.facade";
import { AiConversation } from "@/features/ai-tutor/domain/entities/ai-conversation.entity";
import { type IAiConversationsRepository } from "@/features/ai-tutor/domain/repositories/ai-conversations.repository";

const UPDATED_AT: Date = new Date("2026-10-10T10:00:00.000Z");

describe("AiTutorFacade", () => {
  it("returns the latest conversations of a user without messages", async () => {
    const conversation: AiConversation = AiConversation.reconstitute({
      id: "conversation-1",
      userId: "student-1",
      scope: "LESSON",
      refId: "lesson-1",
      title: "PEEP basics",
      createdAt: UPDATED_AT,
      updatedAt: UPDATED_AT,
    });
    const getAll: jest.Mock = jest.fn().mockResolvedValue(new Paginated<AiConversation>({ items: [conversation], total: 1, page: 1, limit: 5 }));
    const facade: AiTutorFacade = new AiTutorFacade({ getAll } as unknown as IAiConversationsRepository);

    const conversations: AiConversationSummary[] = await facade.getLatestConversations("student-1", 5);

    expect(getAll).toHaveBeenCalledWith({ userId: "student-1", page: 1, limit: 5, sortOrder: "desc" });
    expect(conversations).toEqual([{ id: "conversation-1", scope: "LESSON", refId: "lesson-1", title: "PEEP basics", updatedAt: UPDATED_AT }]);
  });
});
