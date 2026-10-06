/*
 * Funcionalidad: Controlador LessonsController
 * Descripción: Expone las rutas HTTP api/lessons de la feature de lecciones, aplica guardias y permisos y responde con APIResponseBuilder; depende de CompleteLessonUseCase, CreateLessonUseCase, DeleteLessonUseCase, GetAdjacentLessonUseCase, GetLessonByIdUseCase, GetLessonStepsUseCase y otros
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "@/features/auth/presentation/guards/optional-jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { canManageContent } from "@/features/curriculum/domain/services/content-visibility";
import { CompleteLessonCommand } from "@/features/lessons/application/commands/complete-lesson.command";
import { CreateLessonCommand } from "@/features/lessons/application/commands/create-lesson.command";
import { DeleteLessonCommand } from "@/features/lessons/application/commands/delete-lesson.command";
import { RecordLessonAccessCommand } from "@/features/lessons/application/commands/record-lesson-access.command";
import { UpdateLessonCommand } from "@/features/lessons/application/commands/update-lesson.command";
import { CompleteLessonUseCase } from "@/features/lessons/application/use-cases/complete-lesson.usecase";
import { CreateLessonUseCase } from "@/features/lessons/application/use-cases/create-lesson.usecase";
import { DeleteLessonUseCase } from "@/features/lessons/application/use-cases/delete-lesson.usecase";
import { GetAdjacentLessonUseCase } from "@/features/lessons/application/use-cases/get-adjacent-lesson.usecase";
import { GetLessonByIdUseCase } from "@/features/lessons/application/use-cases/get-lesson-by-id.usecase";
import { GetLessonStepsUseCase } from "@/features/lessons/application/use-cases/get-lesson-steps.usecase";
import { RecordLessonAccessUseCase } from "@/features/lessons/application/use-cases/record-lesson-access.usecase";
import { ReorderLessonsUseCase } from "@/features/lessons/application/use-cases/reorder-lessons.usecase";
import { UpdateLessonUseCase } from "@/features/lessons/application/use-cases/update-lesson.usecase";
import { type LessonDetail, type LessonNeighbor, type LessonStepItem } from "@/features/lessons/domain/read-models/lesson-views.read-model";
import {
  CompleteLessonDTO,
  CreateLessonDTO,
  LessonStepsQueryDTO,
  ReorderLessonsDTO,
  UpdateLessonDTO,
} from "@/features/lessons/presentation/dtos/lesson-request.dto";
import { LessonDetailDTO, LessonNeighborDTO, LessonStepDTO } from "@/features/lessons/presentation/dtos/lesson.dto";
import { LessonsMapper } from "@/features/lessons/presentation/mappers/lessons.mapper";

const LESSONS_MANAGE_PERMISSION: string = "lessons:update";

@ApiTags("Lessons")
@Controller("api/lessons")
export class LessonsController {
  public constructor(
    private readonly _getLessonByIdUseCase: GetLessonByIdUseCase,
    private readonly _getAdjacentLessonUseCase: GetAdjacentLessonUseCase,
    private readonly _getLessonStepsUseCase: GetLessonStepsUseCase,
    private readonly _completeLessonUseCase: CompleteLessonUseCase,
    private readonly _recordLessonAccessUseCase: RecordLessonAccessUseCase,
    private readonly _createLessonUseCase: CreateLessonUseCase,
    private readonly _updateLessonUseCase: UpdateLessonUseCase,
    private readonly _deleteLessonUseCase: DeleteLessonUseCase,
    private readonly _reorderLessonsUseCase: ReorderLessonsUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("lessons:create")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create lesson", description: "Creates a lesson in an active module" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Lesson created successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error, invalid content or inactive module" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Module not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Duplicate order in the module" })
  public async createLesson(
    @Body() dto: CreateLessonDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._createLessonUseCase.execute(
      new CreateLessonCommand({
        moduleId: dto.moduleId,
        title: dto.title,
        content: dto.content,
        order: dto.order,
        estimatedTime: dto.estimatedTime,
        aiGenerated: dto.aiGenerated,
        sourcePrompt: dto.sourcePrompt,
        status: dto.status,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("lessons.lesson_created"))
      .build();
  }

  @Put("reorder")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("lessons:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reorder lessons of a module", description: "Sets the order of every lesson of the module in one transaction" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Lessons reordered successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or the list is not exactly the lessons of the module" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Module not found" })
  public async reorderLessons(@Body() dto: ReorderLessonsDTO, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._reorderLessonsUseCase.execute(dto.moduleId, dto.ids);

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("lessons.lessons_reordered"))
      .build();
  }

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get lesson by ID", description: "Retrieves a lesson with its module and quizzes; unpublished content answers 404 for students" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Lesson retrieved successfully", type: LessonDetailDTO })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson not found" })
  public async getLessonById(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<LessonDetailDTO>> {
    const lesson: LessonDetail = await this._getLessonByIdUseCase.execute(id, canManageContent(currentUser?.permissions, LESSONS_MANAGE_PERMISSION));

    return new APIResponseBuilder<LessonDetailDTO>()
      .setData(LessonsMapper.toDetailDTO(lesson))
      .setMessage(await i18n.t("lessons.lesson_retrieved"))
      .build();
  }

  @Get(":id/next")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get next lesson", description: "Retrieves the next lesson of the same module, or null" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Next lesson retrieved", type: LessonNeighborDTO })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson not found" })
  public async getNextLesson(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<LessonNeighborDTO | null>> {
    const lesson: LessonNeighbor | undefined = await this._getAdjacentLessonUseCase.execute(
      id,
      "next",
      canManageContent(currentUser?.permissions, LESSONS_MANAGE_PERMISSION),
    );

    return new APIResponseBuilder<LessonNeighborDTO | null>()
      .setData(lesson ? LessonsMapper.toNeighborDTO(lesson) : null)
      .setMessage(await i18n.t(lesson ? "lessons.next_lesson_retrieved" : "lessons.no_next_lesson"))
      .build();
  }

  @Get(":id/previous")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get previous lesson", description: "Retrieves the previous lesson of the same module, or null" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Previous lesson retrieved", type: LessonNeighborDTO })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson not found" })
  public async getPreviousLesson(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<LessonNeighborDTO | null>> {
    const lesson: LessonNeighbor | undefined = await this._getAdjacentLessonUseCase.execute(
      id,
      "previous",
      canManageContent(currentUser?.permissions, LESSONS_MANAGE_PERMISSION),
    );

    return new APIResponseBuilder<LessonNeighborDTO | null>()
      .setData(lesson ? LessonsMapper.toNeighborDTO(lesson) : null)
      .setMessage(await i18n.t(lesson ? "lessons.previous_lesson_retrieved" : "lessons.no_previous_lesson"))
      .build();
  }

  @Get(":id/steps")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get lesson steps", description: "Retrieves the steps of a lesson ordered by position" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Lesson steps retrieved successfully", type: LessonStepDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson not found" })
  public async getLessonSteps(
    @Param("id") id: string,
    @Query() query: LessonStepsQueryDTO,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<LessonStepDTO[]>> {
    const canManage: boolean = canManageContent(currentUser?.permissions, LESSONS_MANAGE_PERMISSION);
    const steps: LessonStepItem[] = await this._getLessonStepsUseCase.execute(id, canManage && (query.includeInactive ?? false), canManage);

    return new APIResponseBuilder<LessonStepDTO[]>()
      .setData(steps.map((step: LessonStepItem) => LessonsMapper.toStepDTO(step)))
      .setMessage(await i18n.t("lessons.steps_retrieved"))
      .build();
  }

  @Post(":id/complete")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("progress:update_own")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Complete lesson", description: "Marks the lesson as completed for the current user and recalculates module progress" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Lesson completed successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User or lesson not found" })
  public async completeLesson(
    @Param("id") id: string,
    @Body() dto: CompleteLessonDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._completeLessonUseCase.execute(new CompleteLessonCommand({ userId: currentUser.sub, lessonId: id, timeSpent: dto.timeSpent ?? 0 }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("lessons.lesson_completed"))
      .build();
  }

  @Post(":id/access")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("progress:update_own")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Record lesson access", description: "Records that the current user opened the lesson" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Access recorded successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson not found" })
  public async recordLessonAccess(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._recordLessonAccessUseCase.execute(new RecordLessonAccessCommand({ userId: currentUser.sub, lessonId: id }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("lessons.access_recorded"))
      .build();
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("lessons:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update lesson", description: "Updates a lesson's title, content, order, estimated time, AI metadata or status; isActive stays in sync with status" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Lesson updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or invalid content" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Duplicate order in the module" })
  public async updateLesson(
    @Param("id") id: string,
    @Body() dto: UpdateLessonDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updateLessonUseCase.execute(
      new UpdateLessonCommand({
        lessonId: id,
        title: dto.title,
        content: dto.content,
        order: dto.order,
        estimatedTime: dto.estimatedTime,
        aiGenerated: dto.aiGenerated,
        sourcePrompt: dto.sourcePrompt,
        status: dto.status,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("lessons.lesson_updated"))
      .build();
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("lessons:delete")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Delete lesson",
    description: "Permanently deletes a lesson with its pages, blocks, steps and quizzes; answers 409 when any of them has student data (archive it instead)",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Lesson deleted successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The lesson has student data; archive it instead" })
  public async deleteLesson(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._deleteLessonUseCase.execute(new DeleteLessonCommand({ lessonId: id, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("lessons.lesson_deleted"))
      .build();
  }
}
