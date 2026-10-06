/*
 * Funcionalidad: DTOs de solicitud del tutor de IA
 * Descripción: Validación y documentación de las solicitudes del tutor: profundizar una página, iniciar una conversación, enviar un mensaje, renombrar una conversación y filtrar el listado de conversaciones por alcance
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { ListQueryDTO } from "@/common/presentation/dtos/list-query.dto";
import { AI_CONVERSATION_SCOPE_VALUES, STARTABLE_CONVERSATION_SCOPE_VALUES } from "@/features/ai-tutor/domain/value-objects/ai-conversation-scope";

export const MAX_TUTOR_MESSAGE_LENGTH: number = 4000;

export const MAX_TUTOR_QUESTION_LENGTH: number = 1000;

export const MAX_TUTOR_TITLE_LENGTH: number = 120;

export class DeepenPageDTO {
  @ApiPropertyOptional({ description: "Question about the page; without it the tutor deepens the whole page", example: "¿Cuándo conviene subir la PEEP?", maxLength: 1000 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("ai-tutor.validation.question_must_be_string") })
  @MaxLength(MAX_TUTOR_QUESTION_LENGTH, { message: i18nValidationMessage("ai-tutor.validation.question_too_long") })
  public question?: string;

  @ApiPropertyOptional({ description: "Existing page conversation of the caller to append to; without it a new conversation is created", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("ai-tutor.validation.conversation_id_must_be_string") })
  @IsNotEmpty({ message: i18nValidationMessage("ai-tutor.validation.conversation_id_must_be_string") })
  public conversationId?: string;
}

export class StartAiConversationDTO {
  @ApiProperty({ description: "Conversation scope", enum: STARTABLE_CONVERSATION_SCOPE_VALUES, example: "LESSON" })
  @IsIn([...STARTABLE_CONVERSATION_SCOPE_VALUES], { message: i18nValidationMessage("ai-tutor.validation.scope_invalid") })
  public scope: string;

  @ApiPropertyOptional({ description: "Lesson or module id (required for LESSON and MODULE, ignored for FREE)", example: "cm5x2k9a00000abcd1234efgh" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("ai-tutor.validation.ref_id_must_be_string") })
  @IsNotEmpty({ message: i18nValidationMessage("ai-tutor.validation.ref_id_must_be_string") })
  public refId?: string;

  @ApiProperty({ description: "First message of the student", example: "¿Qué diferencia hay entre volumen control y presión control?", maxLength: 4000 })
  @IsString({ message: i18nValidationMessage("ai-tutor.validation.message_required") })
  @IsNotEmpty({ message: i18nValidationMessage("ai-tutor.validation.message_required") })
  @MaxLength(MAX_TUTOR_MESSAGE_LENGTH, { message: i18nValidationMessage("ai-tutor.validation.message_too_long") })
  public message: string;

  @ApiPropertyOptional({ description: "Page the student is reading; it gets priority in the lesson or module context", example: "cm5x2k9a00000abcd1234wxyz" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("ai-tutor.validation.current_page_id_must_be_string") })
  @IsNotEmpty({ message: i18nValidationMessage("ai-tutor.validation.current_page_id_must_be_string") })
  public currentPageId?: string;
}

export class SendAiConversationMessageDTO {
  @ApiProperty({ description: "New message of the student", example: "¿Y en un paciente con SDRA?", maxLength: 4000 })
  @IsString({ message: i18nValidationMessage("ai-tutor.validation.message_required") })
  @IsNotEmpty({ message: i18nValidationMessage("ai-tutor.validation.message_required") })
  @MaxLength(MAX_TUTOR_MESSAGE_LENGTH, { message: i18nValidationMessage("ai-tutor.validation.message_too_long") })
  public message: string;

  @ApiPropertyOptional({ description: "Page the student is reading; it gets priority in the lesson or module context", example: "cm5x2k9a00000abcd1234wxyz" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("ai-tutor.validation.current_page_id_must_be_string") })
  @IsNotEmpty({ message: i18nValidationMessage("ai-tutor.validation.current_page_id_must_be_string") })
  public currentPageId?: string;
}

export class RenameAiConversationDTO {
  @ApiProperty({ description: "New title (whitespace collapsed, stored up to 60 characters)", example: "Ventilación protectora", maxLength: 120 })
  @IsString({ message: i18nValidationMessage("ai-tutor.validation.title_required") })
  @IsNotEmpty({ message: i18nValidationMessage("ai-tutor.validation.title_required") })
  @MaxLength(MAX_TUTOR_TITLE_LENGTH, { message: i18nValidationMessage("ai-tutor.validation.title_too_long") })
  public title: string;
}

export class GetAiConversationsQueryDTO extends ListQueryDTO {
  @ApiPropertyOptional({ description: "Filter by conversation scope", enum: AI_CONVERSATION_SCOPE_VALUES, example: "FREE" })
  @IsOptional()
  @IsIn([...AI_CONVERSATION_SCOPE_VALUES], { message: i18nValidationMessage("ai-tutor.validation.scope_filter_invalid") })
  public scope?: string;
}
