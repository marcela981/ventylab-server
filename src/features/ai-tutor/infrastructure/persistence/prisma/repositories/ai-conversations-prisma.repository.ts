/*
 * Funcionalidad: Repositorio Prisma de conversaciones del tutor
 * Descripción: Implementa IAiConversationsRepository sobre ai_conversations y ai_messages filtrando siempre por el dueño; al agregar un mensaje actualiza la última actividad de la conversación y, si el registro de telemetría de su aiCallId aún no existe (se escribe sin bloquear), reintenta una vez y luego guarda el mensaje sin el enlace
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger } from "@nestjs/common";
import { type AiConversation as AiConversationModel, type AiMessage as AiMessageModel, Prisma } from "@prisma/client";

import { Paginated } from "@/common/domain/utils/paginated";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type AiConversation } from "@/features/ai-tutor/domain/entities/ai-conversation.entity";
import {
  type AiConversationMessage,
  type NewAiConversationMessage,
} from "@/features/ai-tutor/domain/read-models/ai-conversation-message.read-model";
import { type GetAiConversationsQuery, type IAiConversationsRepository } from "@/features/ai-tutor/domain/repositories/ai-conversations.repository";
import { AiConversationsMapper } from "@/features/ai-tutor/infrastructure/persistence/prisma/mappers/ai-conversations.mapper";

const FOREIGN_KEY_VIOLATION_CODE: string = "P2003";

const AI_CALL_LOG_WAIT_MS: number = 300;

function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve: () => void) => {
    setTimeout(resolve, ms);
  });
}

@Injectable()
export class AiConversationsPrismaRepository implements IAiConversationsRepository {
  private readonly _logger: Logger = new Logger(AiConversationsPrismaRepository.name);

  public constructor(private readonly _prisma: PrismaService) {}

  public async getById(id: string, ownerId: string): Promise<AiConversation | undefined> {
    const row: AiConversationModel | null = await this._prisma.aiConversation.findFirst({ where: { id, userId: ownerId } });

    return row ? AiConversationsMapper.toDomain(row) : undefined;
  }

  public async getAll(query: GetAiConversationsQuery): Promise<Paginated<AiConversation>> {
    const { page, limit, userId, scope, ids, createdAtFrom, createdAtTo, sortOrder } = query;

    const where: Prisma.AiConversationWhereInput = { userId };

    if (scope) {
      where.scope = scope;
    }

    if (ids && ids.length > 0) {
      where.id = { in: ids };
    }

    if (createdAtFrom || createdAtTo) {
      where.createdAt = { gte: createdAtFrom, lte: createdAtTo };
    }

    const [rows, total] = await Promise.all([
      this._prisma.aiConversation.findMany({
        where,
        orderBy: { updatedAt: sortOrder === "asc" ? "asc" : "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this._prisma.aiConversation.count({ where }),
    ]);

    return new Paginated({ items: rows.map((row: AiConversationModel) => AiConversationsMapper.toDomain(row)), total, page, limit });
  }

  public async save(conversation: AiConversation): Promise<void> {
    const data: Prisma.AiConversationUncheckedCreateInput = AiConversationsMapper.toPersistence(conversation);

    await this._prisma.aiConversation.upsert({
      where: { id: conversation.id, userId: conversation.userId },
      create: data,
      update: { title: data.title, updatedAt: data.updatedAt },
    });
  }

  public async delete(id: string, ownerId: string): Promise<boolean> {
    const result: Prisma.BatchPayload = await this._prisma.aiConversation.deleteMany({ where: { id, userId: ownerId } });

    return result.count > 0;
  }

  public async getMessages(conversationId: string): Promise<AiConversationMessage[]> {
    const rows: AiMessageModel[] = await this._prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    return rows.map((row: AiMessageModel) => AiConversationsMapper.toMessage(row));
  }

  public async getRecentMessages(conversationId: string, limit: number): Promise<AiConversationMessage[]> {
    if (limit <= 0) {
      return [];
    }

    const rows: AiMessageModel[] = await this._prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
    });

    return rows.reverse().map((row: AiMessageModel) => AiConversationsMapper.toMessage(row));
  }

  public async addMessage(message: NewAiConversationMessage): Promise<void> {
    try {
      await this._insertMessage(message);
    } catch (error: unknown) {
      if (!message.aiCallId || !this._isForeignKeyViolation(error)) {
        throw error;
      }

      await sleep(AI_CALL_LOG_WAIT_MS);

      try {
        await this._insertMessage(message);
      } catch (retryError: unknown) {
        if (!this._isForeignKeyViolation(retryError)) {
          throw retryError;
        }

        this._logger.warn(`AI call log ${message.aiCallId} not found; saving tutor message ${message.id} without the link`);

        await this._insertMessage({ ...message, aiCallId: undefined });
      }
    }
  }

  private async _insertMessage(message: NewAiConversationMessage): Promise<void> {
    const now: Date = new Date();

    await this._prisma.$transaction([
      this._prisma.aiMessage.create({
        data: {
          id: message.id,
          conversationId: message.conversationId,
          role: message.role,
          content: message.content,
          aiCallId: message.aiCallId ?? null,
          isIncomplete: message.isIncomplete,
          createdAt: now,
        },
      }),
      this._prisma.aiConversation.updateMany({ where: { id: message.conversationId }, data: { updatedAt: now } }),
    ]);
  }

  private _isForeignKeyViolation(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === FOREIGN_KEY_VIOLATION_CODE;
  }
}
