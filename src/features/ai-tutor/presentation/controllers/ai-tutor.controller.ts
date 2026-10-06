/*
 * Funcionalidad: Controlador del tutor de IA
 * Descripción: Rutas autenticadas del tutor de IA: profundizar una página, iniciar una conversación y enviar mensajes con respuesta en Server-Sent Events sobre POST (los errores previos al stream usan el sobre JSON normal y la desconexión del cliente cancela la llamada al modelo), y CRUD de las conversaciones propias
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { type Response } from "express";
import { I18n, I18nContext } from "nestjs-i18n";

import { DomainError } from "@/common/domain/errors/domain-error";
import { type Paginated } from "@/common/domain/utils/paginated";
import { Language } from "@/common/domain/value-objects/language";
import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { DeepenPageCommand } from "@/features/ai-tutor/application/commands/deepen-page.command";
import { RenameAiConversationCommand } from "@/features/ai-tutor/application/commands/rename-ai-conversation.command";
import { SendAiConversationMessageCommand } from "@/features/ai-tutor/application/commands/send-ai-conversation-message.command";
import { StartAiConversationCommand } from "@/features/ai-tutor/application/commands/start-ai-conversation.command";
import { type TutorCaller } from "@/features/ai-tutor/application/commands/tutor-caller";
import { type AiConversationDetailResult } from "@/features/ai-tutor/application/results/ai-conversation-detail.result";
import { type TutorStreamResult } from "@/features/ai-tutor/application/results/tutor-stream.result";
import { DeepenPageUseCase } from "@/features/ai-tutor/application/use-cases/deepen-page.usecase";
import { DeleteAiConversationUseCase } from "@/features/ai-tutor/application/use-cases/delete-ai-conversation.usecase";
import { GetAiConversationUseCase } from "@/features/ai-tutor/application/use-cases/get-ai-conversation.usecase";
import { GetAiConversationsUseCase } from "@/features/ai-tutor/application/use-cases/get-ai-conversations.usecase";
import { RenameAiConversationUseCase } from "@/features/ai-tutor/application/use-cases/rename-ai-conversation.usecase";
import { SendAiConversationMessageUseCase } from "@/features/ai-tutor/application/use-cases/send-ai-conversation-message.usecase";
import { StartAiConversationUseCase } from "@/features/ai-tutor/application/use-cases/start-ai-conversation.usecase";
import { type AiConversation } from "@/features/ai-tutor/domain/entities/ai-conversation.entity";
import { type AiConversationScopeValue } from "@/features/ai-tutor/domain/value-objects/ai-conversation-scope";
import { AiConversationDetailDTO, AiConversationDTO } from "@/features/ai-tutor/presentation/dtos/ai-conversation.dto";
import {
  DeepenPageDTO,
  GetAiConversationsQueryDTO,
  RenameAiConversationDTO,
  SendAiConversationMessageDTO,
  StartAiConversationDTO,
} from "@/features/ai-tutor/presentation/dtos/ai-tutor-request.dto";
import { AiTutorMapper } from "@/features/ai-tutor/presentation/mappers/ai-tutor.mapper";
import { abortOnClientDisconnect, pipeTutorStreamToSse, SSE_CONTENT_TYPE, type SseErrorPayload } from "@/features/ai-tutor/presentation/sse/tutor-sse";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { canManageContent } from "@/features/curriculum/domain/services/content-visibility";

const TUTOR_STREAM_RATE_LIMIT: number = 20;
const TUTOR_STREAM_RATE_WINDOW_MS: number = 60000;
const CONTENT_MANAGE_PERMISSION: string = "pages:update";
const STREAM_FAILED_CODE: string = "ai-tutor.stream_failed";

const SSE_DESCRIPTION: string =
  "Responds text/event-stream: `event: delta` with `{text}` per fragment, then `event: done` with `{aiCallId, messageId, conversationId}`, or `event: error` with `{code, message}` if the answer fails after it started. Errors before the stream starts (validation, 403, 404, 429 with Retry-After, 503) use the regular JSON error envelope. Closing the connection cancels the AI call and the received part is saved as incomplete.";

@ApiTags("AI tutor")
@ApiBearerAuth("JWT-auth")
@Controller("api/tutor")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("ai-tutor:use")
export class AiTutorController {
  private readonly _logger: Logger = new Logger(AiTutorController.name);

  public constructor(
    private readonly _deepenPageUseCase: DeepenPageUseCase,
    private readonly _startAiConversationUseCase: StartAiConversationUseCase,
    private readonly _sendAiConversationMessageUseCase: SendAiConversationMessageUseCase,
    private readonly _getAiConversationsUseCase: GetAiConversationsUseCase,
    private readonly _getAiConversationUseCase: GetAiConversationUseCase,
    private readonly _renameAiConversationUseCase: RenameAiConversationUseCase,
    private readonly _deleteAiConversationUseCase: DeleteAiConversationUseCase,
  ) {}

  @Post("pages/:pageId/deepen")
  @Throttle({ default: { limit: TUTOR_STREAM_RATE_LIMIT, ttl: TUTOR_STREAM_RATE_WINDOW_MS } })
  @ApiProduces(SSE_CONTENT_TYPE)
  @ApiOperation({
    summary: "Deepen a page with the AI tutor",
    description: `Explains the page in more depth (or answers a question about it) using its content, lesson and module. Students only reach published pages. Creates a new page conversation unless conversationId is given. ${SSE_DESCRIPTION}`,
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Server-sent event stream with the answer" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or conversation of another page" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Page or conversation not found" })
  @ApiResponseDoc({ status: HttpStatus.TOO_MANY_REQUESTS, description: "Too many requests or daily AI quota reached (Retry-After header)" })
  @ApiResponseDoc({ status: HttpStatus.SERVICE_UNAVAILABLE, description: "The AI service is not available" })
  public async deepenPage(
    @Param("pageId") pageId: string,
    @Body() dto: DeepenPageDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
    @Res() res: Response,
  ): Promise<void> {
    const controller: AbortController = abortOnClientDisconnect(res);
    const result: TutorStreamResult = await this._deepenPageUseCase.execute(
      new DeepenPageCommand({
        caller: this._caller(currentUser, i18n),
        pageId,
        question: dto.question,
        conversationId: dto.conversationId,
        signal: controller.signal,
      }),
    );

    await this._stream(res, result, i18n);
  }

  @Post("conversations")
  @Throttle({ default: { limit: TUTOR_STREAM_RATE_LIMIT, ttl: TUTOR_STREAM_RATE_WINDOW_MS } })
  @ApiProduces(SSE_CONTENT_TYPE)
  @ApiOperation({
    summary: "Start an AI tutor conversation",
    description: `Starts a LESSON, MODULE or FREE conversation and streams the first answer. Lesson and module answers use that content (current page first, then the other pages, then the module summary) within the configured token budget. Free chat is restricted to mechanical ventilation and related clinical topics; off-topic messages get a fixed refusal. ${SSE_DESCRIPTION}`,
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Server-sent event stream with the answer" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or missing lesson/module id" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson or module not found" })
  @ApiResponseDoc({ status: HttpStatus.TOO_MANY_REQUESTS, description: "Too many requests or daily AI quota reached (Retry-After header)" })
  @ApiResponseDoc({ status: HttpStatus.SERVICE_UNAVAILABLE, description: "The AI service is not available" })
  public async startConversation(
    @Body() dto: StartAiConversationDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
    @Res() res: Response,
  ): Promise<void> {
    const controller: AbortController = abortOnClientDisconnect(res);
    const result: TutorStreamResult = await this._startAiConversationUseCase.execute(
      new StartAiConversationCommand({
        caller: this._caller(currentUser, i18n),
        scope: dto.scope as AiConversationScopeValue,
        refId: dto.refId,
        message: dto.message,
        currentPageId: dto.currentPageId,
        signal: controller.signal,
      }),
    );

    await this._stream(res, result, i18n);
  }

  @Post("conversations/:conversationId/messages")
  @Throttle({ default: { limit: TUTOR_STREAM_RATE_LIMIT, ttl: TUTOR_STREAM_RATE_WINDOW_MS } })
  @ApiProduces(SSE_CONTENT_TYPE)
  @ApiOperation({
    summary: "Send a message to an AI tutor conversation",
    description: `Streams the answer to a new message in one of the caller's conversations, with the configured window of previous messages. Another user's conversation answers 404. ${SSE_DESCRIPTION}`,
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Server-sent event stream with the answer" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Conversation, page, lesson or module not found" })
  @ApiResponseDoc({ status: HttpStatus.TOO_MANY_REQUESTS, description: "Too many requests or daily AI quota reached (Retry-After header)" })
  @ApiResponseDoc({ status: HttpStatus.SERVICE_UNAVAILABLE, description: "The AI service is not available" })
  public async sendConversationMessage(
    @Param("conversationId") conversationId: string,
    @Body() dto: SendAiConversationMessageDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
    @Res() res: Response,
  ): Promise<void> {
    const controller: AbortController = abortOnClientDisconnect(res);
    const result: TutorStreamResult = await this._sendAiConversationMessageUseCase.execute(
      new SendAiConversationMessageCommand({
        caller: this._caller(currentUser, i18n),
        conversationId,
        message: dto.message,
        currentPageId: dto.currentPageId,
        signal: controller.signal,
      }),
    );

    await this._stream(res, result, i18n);
  }

  @Get("conversations")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get my AI tutor conversations", description: "Paginated list of the caller's conversations, most recently active first, optionally filtered by scope" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Conversations retrieved successfully", type: AiConversationDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission" })
  public async getConversations(
    @Query() query: GetAiConversationsQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<AiConversationDTO[]>> {
    const conversations: Paginated<AiConversation> = await this._getAiConversationsUseCase.execute({
      userId: currentUser.sub,
      scope: query.scope as AiConversationScopeValue | undefined,
      page: query.page,
      limit: query.limit,
      ids: query.ids,
      createdAtFrom: query.createdAtFrom,
      createdAtTo: query.createdAtTo,
      sortOrder: query.sortOrder,
    });

    return new APIResponseBuilder<AiConversationDTO[]>()
      .setData(conversations.data.map((conversation: AiConversation) => AiTutorMapper.toConversationDTO(conversation)))
      .setPagination(conversations.pagination)
      .setMessage(await i18n.t("ai-tutor.conversations_retrieved"))
      .build();
  }

  @Get("conversations/:conversationId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get my AI tutor conversation", description: "One of the caller's conversations with its messages; another user's conversation answers 404" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Conversation retrieved successfully", type: AiConversationDetailDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Conversation not found" })
  public async getConversation(
    @Param("conversationId") conversationId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<AiConversationDetailDTO>> {
    const detail: AiConversationDetailResult = await this._getAiConversationUseCase.execute(conversationId, currentUser.sub);

    return new APIResponseBuilder<AiConversationDetailDTO>()
      .setData(AiTutorMapper.toDetailDTO(detail))
      .setMessage(await i18n.t("ai-tutor.conversation_retrieved"))
      .build();
  }

  @Patch("conversations/:conversationId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rename my AI tutor conversation", description: "Changes the title of one of the caller's conversations; another user's conversation answers 404" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Conversation renamed successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Conversation not found" })
  public async renameConversation(
    @Param("conversationId") conversationId: string,
    @Body() dto: RenameAiConversationDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._renameAiConversationUseCase.execute(new RenameAiConversationCommand({ userId: currentUser.sub, conversationId, title: dto.title }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("ai-tutor.conversation_renamed"))
      .build();
  }

  @Delete("conversations/:conversationId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete my AI tutor conversation", description: "Deletes one of the caller's conversations with its messages; another user's conversation answers 404" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Conversation deleted successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Conversation not found" })
  public async deleteConversation(
    @Param("conversationId") conversationId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._deleteAiConversationUseCase.execute(conversationId, currentUser.sub);

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("ai-tutor.conversation_deleted"))
      .build();
  }

  private _caller(currentUser: JwtPayload, i18n: I18nContext): TutorCaller {
    return {
      userId: currentUser.sub,
      userRole: currentUser.role,
      email: currentUser.email,
      canManage: canManageContent(currentUser.permissions, CONTENT_MANAGE_PERMISSION),
      language: Language.createOrDefault(i18n.lang).value,
    };
  }

  private async _stream(res: Response, result: TutorStreamResult, i18n: I18nContext): Promise<void> {
    await pipeTutorStreamToSse(res, result.events, (error: unknown): Promise<SseErrorPayload> => {
      const code: string = error instanceof DomainError ? error.code : STREAM_FAILED_CODE;

      this._logger.warn(`AI tutor stream ${result.conversationId} failed after it started: ${error instanceof Error ? error.name : "UnknownError"}`);

      return Promise.resolve({ code, message: String(i18n.t(code)) });
    });
  }
}
