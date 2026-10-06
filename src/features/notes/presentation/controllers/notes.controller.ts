/*
 * Funcionalidad: Controlador de notas
 * Descripción: Endpoints autenticados de /api/notes para las notas privadas del usuario: CRUD solo del autor (sin excepción por rol; una nota ajena responde 404), listados paginados de todas, por lección y por módulo, y análisis con IA limitado a 10 solicitudes por minuto y a la cuota diaria de IA del rol
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { I18n, I18nContext } from "nestjs-i18n";

import { Paginated } from "@/common/domain/utils/paginated";
import { Language } from "@/common/domain/value-objects/language";
import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { ListQueryDTO } from "@/common/presentation/dtos/list-query.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { AnalyzeNotesCommand } from "@/features/notes/application/commands/analyze-notes.command";
import { CreateNoteCommand } from "@/features/notes/application/commands/create-note.command";
import { DeleteNoteCommand } from "@/features/notes/application/commands/delete-note.command";
import { UpdateNoteCommand } from "@/features/notes/application/commands/update-note.command";
import { NotesAnalysisResult } from "@/features/notes/application/results/notes-analysis.result";
import { AnalyzeNotesUseCase } from "@/features/notes/application/use-cases/analyze-notes.usecase";
import { CreateNoteUseCase } from "@/features/notes/application/use-cases/create-note.usecase";
import { DeleteNoteUseCase } from "@/features/notes/application/use-cases/delete-note.usecase";
import { GetNoteUseCase } from "@/features/notes/application/use-cases/get-note.usecase";
import { GetNotesUseCase } from "@/features/notes/application/use-cases/get-notes.usecase";
import { UpdateNoteUseCase } from "@/features/notes/application/use-cases/update-note.usecase";
import { type Note } from "@/features/notes/domain/entities/note.entity";
import { type GetNotesQuery } from "@/features/notes/domain/repositories/notes.repository";
import { AnalyzeNotesDTO, CreateNoteDTO, UpdateNoteDTO } from "@/features/notes/presentation/dtos/note-request.dto";
import { NoteDTO, NotesAnalysisDTO } from "@/features/notes/presentation/dtos/note.dto";
import { NotesMapper } from "@/features/notes/presentation/mappers/notes.mapper";

const ANALYSIS_RATE_LIMIT: number = 10;
const ANALYSIS_RATE_WINDOW_MS: number = 60000;

@ApiTags("Notes")
@ApiBearerAuth("JWT-auth")
@Controller("api/notes")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotesController {
  public constructor(
    private readonly _getNotesUseCase: GetNotesUseCase,
    private readonly _getNoteUseCase: GetNoteUseCase,
    private readonly _createNoteUseCase: CreateNoteUseCase,
    private readonly _updateNoteUseCase: UpdateNoteUseCase,
    private readonly _deleteNoteUseCase: DeleteNoteUseCase,
    private readonly _analyzeNotesUseCase: AnalyzeNotesUseCase,
  ) {}

  @Get()
  @RequirePermissions("notes:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get my notes", description: "Paginated list of the caller's own notes, newest first" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Notes retrieved successfully", type: NoteDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async getNotes(
    @Query() query: ListQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<NoteDTO[]>> {
    const notes: Paginated<Note> = await this._getNotesUseCase.execute(this._toNotesQuery(query, currentUser.sub, {}));

    return this._buildListResponse(notes, i18n);
  }

  @Get("lessons/:lessonId")
  @RequirePermissions("notes:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get my notes of a lesson", description: "Paginated list of the caller's own notes of a lesson, newest first" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Notes retrieved successfully", type: NoteDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson not found" })
  public async getLessonNotes(
    @Param("lessonId") lessonId: string,
    @Query() query: ListQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<NoteDTO[]>> {
    const notes: Paginated<Note> = await this._getNotesUseCase.execute(this._toNotesQuery(query, currentUser.sub, { lessonId }));

    return this._buildListResponse(notes, i18n);
  }

  @Get("modules/:moduleId")
  @RequirePermissions("notes:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get my notes of a module",
    description: "Paginated list of the caller's own notes of the lessons of a module, newest first",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Notes retrieved successfully", type: NoteDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Module not found" })
  public async getModuleNotes(
    @Param("moduleId") moduleId: string,
    @Query() query: ListQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<NoteDTO[]>> {
    const notes: Paginated<Note> = await this._getNotesUseCase.execute(this._toNotesQuery(query, currentUser.sub, { moduleId }));

    return this._buildListResponse(notes, i18n);
  }

  @Post("analyze")
  @RequirePermissions("notes:read_own")
  @Throttle({ default: { limit: ANALYSIS_RATE_LIMIT, ttl: ANALYSIS_RATE_WINDOW_MS } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Analyze my notes with AI",
    description:
      "Analyzes the caller's 50 most recent notes of a lesson, a module or all lessons with the language model and returns a summary, key concepts, gaps and suggestions. Send at most one of lessonId and moduleId.",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Notes analyzed successfully", type: NotesAnalysisDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or both lessonId and moduleId given" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson or module not found" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "No notes to analyze in the scope" })
  @ApiResponseDoc({ status: HttpStatus.TOO_MANY_REQUESTS, description: "Too many analysis requests or daily AI quota reached (Retry-After header)" })
  @ApiResponseDoc({ status: HttpStatus.BAD_GATEWAY, description: "The AI service failed or returned an invalid analysis" })
  @ApiResponseDoc({ status: HttpStatus.SERVICE_UNAVAILABLE, description: "The AI service is not available" })
  public async analyzeNotes(
    @Body() dto: AnalyzeNotesDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<NotesAnalysisDTO>> {
    const result: NotesAnalysisResult = await this._analyzeNotesUseCase.execute(
      new AnalyzeNotesCommand({
        userId: currentUser.sub,
        lessonId: dto.lessonId,
        moduleId: dto.moduleId,
        language: Language.createOrDefault(i18n.lang).value,
        userRole: currentUser.role,
      }),
    );

    return new APIResponseBuilder<NotesAnalysisDTO>()
      .setData(NotesMapper.toAnalysisDTO(result))
      .setMessage(await i18n.t("notes.notes_analyzed"))
      .build();
  }

  @Get(":noteId")
  @RequirePermissions("notes:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get my note by ID", description: "Retrieves one of the caller's own notes; another user's note answers 404" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Note retrieved successfully", type: NoteDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Note not found" })
  public async getNote(
    @Param("noteId") noteId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<NoteDTO>> {
    const note: Note = await this._getNoteUseCase.execute(noteId, currentUser.sub);

    return new APIResponseBuilder<NoteDTO>()
      .setData(NotesMapper.toDTO(note))
      .setMessage(await i18n.t("notes.note_retrieved"))
      .build();
  }

  @Post()
  @RequirePermissions("notes:create_own")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create note", description: "Creates a private note of the caller on a lesson, optionally on one of its pages" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Note created successfully", type: NoteDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error, invalid content or page outside the lesson" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson not found" })
  public async createNote(
    @Body() dto: CreateNoteDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<NoteDTO>> {
    const note: Note = await this._createNoteUseCase.execute(
      new CreateNoteCommand({ userId: currentUser.sub, lessonId: dto.lessonId, pageId: dto.pageId, content: dto.content }),
    );

    return new APIResponseBuilder<NoteDTO>()
      .setData(NotesMapper.toDTO(note))
      .setMessage(await i18n.t("notes.note_created"))
      .build();
  }

  @Patch(":noteId")
  @RequirePermissions("notes:update_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update note", description: "Updates the content or page of one of the caller's own notes; another user's note answers 404" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Note updated successfully", type: NoteDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error, invalid content or page outside the lesson" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Note not found" })
  public async updateNote(
    @Param("noteId") noteId: string,
    @Body() dto: UpdateNoteDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<NoteDTO>> {
    const note: Note = await this._updateNoteUseCase.execute(
      new UpdateNoteCommand({ noteId, userId: currentUser.sub, content: dto.content, pageId: dto.pageId }),
    );

    return new APIResponseBuilder<NoteDTO>()
      .setData(NotesMapper.toDTO(note))
      .setMessage(await i18n.t("notes.note_updated"))
      .build();
  }

  @Delete(":noteId")
  @RequirePermissions("notes:delete_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete note", description: "Deletes one of the caller's own notes; another user's note answers 404" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Note deleted successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Note not found" })
  public async deleteNote(@Param("noteId") noteId: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._deleteNoteUseCase.execute(new DeleteNoteCommand({ noteId, userId: currentUser.sub }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("notes.note_deleted"))
      .build();
  }

  private _toNotesQuery(query: ListQueryDTO, userId: string, scope: { lessonId?: string; moduleId?: string }): GetNotesQuery {
    return {
      page: query.page,
      limit: query.limit,
      ids: query.ids,
      createdAtFrom: query.createdAtFrom,
      createdAtTo: query.createdAtTo,
      sortOrder: query.sortOrder,
      userId,
      lessonId: scope.lessonId,
      moduleId: scope.moduleId,
    };
  }

  private async _buildListResponse(notes: Paginated<Note>, i18n: I18nContext): Promise<APIResponse<NoteDTO[]>> {
    return new APIResponseBuilder<NoteDTO[]>()
      .setData(notes.data.map((note: Note) => NotesMapper.toDTO(note)))
      .setPagination(notes.pagination)
      .setMessage(await i18n.t("notes.notes_retrieved"))
      .build();
  }
}
