/*
 * Funcionalidad: DTOs de respuesta de conversaciones del tutor
 * Descripción: Serialización de las conversaciones del tutor de IA (alcance, referencia, título y fechas) y de sus mensajes (rol, contenido, id de la llamada de IA para calificarla y marca de respuesta incompleta)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { AI_CONVERSATION_MESSAGE_ROLE_VALUES } from "@/features/ai-tutor/domain/read-models/ai-conversation-message.read-model";
import { AI_CONVERSATION_SCOPE_VALUES } from "@/features/ai-tutor/domain/value-objects/ai-conversation-scope";

export class AiConversationDTO {
  @ApiProperty({ description: "Conversation id", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Conversation scope", enum: AI_CONVERSATION_SCOPE_VALUES, example: "LESSON" })
  public scope: string;

  @ApiProperty({ description: "Page, lesson or module id of the scope (null for free chat)", example: "cm5x2k9a00000abcd1234efgh", nullable: true, type: String })
  public refId: string | null;

  @ApiProperty({ description: "Conversation title", example: "¿Qué es la PEEP?" })
  public title: string;

  @ApiProperty({ description: "Creation date", example: "2026-10-05T14:00:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Last activity date", example: "2026-10-05T14:05:00.000Z" })
  public updatedAt: Date;

  public constructor({
    id,
    scope,
    refId,
    title,
    createdAt,
    updatedAt,
  }: {
    id: string;
    scope: string;
    refId: string | null;
    title: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = id;
    this.scope = scope;
    this.refId = refId;
    this.title = title;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export class AiConversationMessageDTO {
  @ApiProperty({ description: "Message id", example: "01932e9f-5678-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Author of the message", enum: AI_CONVERSATION_MESSAGE_ROLE_VALUES, example: "ASSISTANT" })
  public role: string;

  @ApiProperty({ description: "Message text", example: "La PEEP mantiene los alvéolos abiertos al final de la espiración." })
  public content: string;

  @ApiProperty({ description: "AI call that produced the answer, used to rate it (null for user messages)", example: "01932e9f-9abc-7abc-9def-1a2b3c4d5e6f", nullable: true, type: String })
  public aiCallId: string | null;

  @ApiProperty({ description: "True when the answer was interrupted and only the received part was saved", example: false })
  public isIncomplete: boolean;

  @ApiProperty({ description: "Creation date", example: "2026-10-05T14:00:05.000Z" })
  public createdAt: Date;

  public constructor({
    id,
    role,
    content,
    aiCallId,
    isIncomplete,
    createdAt,
  }: {
    id: string;
    role: string;
    content: string;
    aiCallId: string | null;
    isIncomplete: boolean;
    createdAt: Date;
  }) {
    this.id = id;
    this.role = role;
    this.content = content;
    this.aiCallId = aiCallId;
    this.isIncomplete = isIncomplete;
    this.createdAt = createdAt;
  }
}

export class AiConversationDetailDTO extends AiConversationDTO {
  @ApiProperty({ description: "Messages in chronological order", type: AiConversationMessageDTO, isArray: true })
  public messages: AiConversationMessageDTO[];

  public constructor({ conversation, messages }: { conversation: AiConversationDTO; messages: AiConversationMessageDTO[] }) {
    super(conversation);
    this.messages = messages;
  }
}
