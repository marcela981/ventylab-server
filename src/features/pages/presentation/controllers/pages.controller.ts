/*
 * Funcionalidad: Controlador PagesController
 * Descripción: Expone las rutas HTTP api/pages: lecturas públicas con visibilidad por estado (los lectores sin pages:update se tratan como estudiantes), CRUD de páginas, CRUD de bloques y reordenamiento por lotes con permisos pages:*; responde con APIResponseBuilder
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
import { CreatedContentIdDTO, ReorderItemsDTO } from "@/features/curriculum/presentation/dtos/curriculum-write.dto";
import { CreatePageBlockCommand } from "@/features/pages/application/commands/create-page-block.command";
import { CreatePageCommand } from "@/features/pages/application/commands/create-page.command";
import { UpdatePageBlockCommand } from "@/features/pages/application/commands/update-page-block.command";
import { UpdatePageCommand } from "@/features/pages/application/commands/update-page.command";
import { type LessonContentSourceResult } from "@/features/pages/application/results/lesson-content-source.result";
import { CreatePageBlockUseCase } from "@/features/pages/application/use-cases/create-page-block.usecase";
import { CreatePageUseCase } from "@/features/pages/application/use-cases/create-page.usecase";
import { DeletePageBlockUseCase } from "@/features/pages/application/use-cases/delete-page-block.usecase";
import { DeletePageUseCase } from "@/features/pages/application/use-cases/delete-page.usecase";
import { GetLessonContentSourceUseCase } from "@/features/pages/application/use-cases/get-lesson-content-source.usecase";
import { GetLessonPagesUseCase } from "@/features/pages/application/use-cases/get-lesson-pages.usecase";
import { GetModulePagesUseCase } from "@/features/pages/application/use-cases/get-module-pages.usecase";
import { GetPageByIdUseCase } from "@/features/pages/application/use-cases/get-page-by-id.usecase";
import { GetPageByLegacyJsonIdUseCase } from "@/features/pages/application/use-cases/get-page-by-legacy-json-id.usecase";
import { ReorderPageBlocksUseCase } from "@/features/pages/application/use-cases/reorder-page-blocks.usecase";
import { ReorderPagesUseCase } from "@/features/pages/application/use-cases/reorder-pages.usecase";
import { UpdatePageBlockUseCase } from "@/features/pages/application/use-cases/update-page-block.usecase";
import { UpdatePageUseCase } from "@/features/pages/application/use-cases/update-page.usecase";
import { type PageContentFields } from "@/features/pages/domain/entities/page.entity";
import { type PageSummary, type PageView } from "@/features/pages/domain/read-models/page-views.read-model";
import {
  CreatePageBlockDTO,
  CreatePageDTO,
  GetPagesQueryDTO,
  ReorderPagesDTO,
  UpdatePageBlockDTO,
  UpdatePageDTO,
} from "@/features/pages/presentation/dtos/page-request.dto";
import { LessonContentSourceDTO, PageDTO, PageLookupDTO, PageSummaryDTO } from "@/features/pages/presentation/dtos/page.dto";
import { PagesMapper } from "@/features/pages/presentation/mappers/pages.mapper";

const PAGES_MANAGE_PERMISSION: string = "pages:update";

@ApiTags("Pages")
@Controller("api/pages")
export class PagesController {
  public constructor(
    private readonly _getPageByLegacyJsonIdUseCase: GetPageByLegacyJsonIdUseCase,
    private readonly _getLessonContentSourceUseCase: GetLessonContentSourceUseCase,
    private readonly _getModulePagesUseCase: GetModulePagesUseCase,
    private readonly _getLessonPagesUseCase: GetLessonPagesUseCase,
    private readonly _getPageByIdUseCase: GetPageByIdUseCase,
    private readonly _createPageUseCase: CreatePageUseCase,
    private readonly _updatePageUseCase: UpdatePageUseCase,
    private readonly _deletePageUseCase: DeletePageUseCase,
    private readonly _reorderPagesUseCase: ReorderPagesUseCase,
    private readonly _createPageBlockUseCase: CreatePageBlockUseCase,
    private readonly _updatePageBlockUseCase: UpdatePageBlockUseCase,
    private readonly _deletePageBlockUseCase: DeletePageBlockUseCase,
    private readonly _reorderPageBlocksUseCase: ReorderPageBlocksUseCase,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get lesson pages", description: "Retrieves the pages of a lesson ordered by position; students only see published pages" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Lesson pages retrieved successfully", type: PageSummaryDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson not found" })
  public async getLessonPages(
    @Query() query: GetPagesQueryDTO,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<PageSummaryDTO[]>> {
    const pages: PageSummary[] = await this._getLessonPagesUseCase.execute(query.lessonId, this._canManage(currentUser));

    return new APIResponseBuilder<PageSummaryDTO[]>()
      .setData(pages.map((page: PageSummary) => PagesMapper.toSummaryDTO(page)))
      .setMessage(await i18n.t("pages.lesson_pages_retrieved"))
      .build();
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("pages:create")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create page", description: "Creates a page in a lesson; the module is derived from the lesson and the page starts as DRAFT unless another status is given" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Page created successfully", type: CreatedContentIdDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Duplicate slug in the module" })
  public async createPage(
    @Body() dto: CreatePageDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<CreatedContentIdDTO>> {
    const id: string = await this._createPageUseCase.execute(
      new CreatePageCommand({ lessonId: dto.lessonId, title: dto.title, slug: dto.slug, fields: this._toFields(dto), performedBy: currentUser.sub }),
    );

    return new APIResponseBuilder<CreatedContentIdDTO>()
      .setData(new CreatedContentIdDTO({ id }))
      .setMessage(await i18n.t("pages.page_created"))
      .build();
  }

  @Put("reorder")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("pages:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reorder pages of a lesson", description: "Sets the order of every page of the lesson in one transaction" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Pages reordered successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or the list is not exactly the pages of the lesson" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson not found" })
  public async reorderPages(@Body() dto: ReorderPagesDTO, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._reorderPagesUseCase.execute(dto.lessonId, dto.ids);

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("pages.pages_reordered"))
      .build();
  }

  @Get("by-legacy-json/:legacyJsonId")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get page by legacy JSON ID", description: "Finds the page migrated from a legacy JSON lesson; students only find published pages" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Lookup completed", type: PageLookupDTO })
  public async getPageByLegacyJsonId(
    @Param("legacyJsonId") legacyJsonId: string,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<PageLookupDTO>> {
    const page: PageView | undefined = await this._getPageByLegacyJsonIdUseCase.execute(legacyJsonId, this._canManage(currentUser));

    return new APIResponseBuilder<PageLookupDTO>()
      .setData(PagesMapper.toLookupDTO(legacyJsonId, page))
      .setMessage(await i18n.t(page ? "pages.page_retrieved" : "pages.page_not_migrated"))
      .build();
  }

  @Get("by-lesson/:lessonId")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Resolve lesson content source",
    description: "Returns the first visible page linked to the lesson (by lesson ID, legacy lesson ID or legacy JSON ID), or tells the client to use the lesson",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Content source resolved", type: LessonContentSourceDTO })
  public async getLessonContentSource(
    @Param("lessonId") lessonId: string,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<LessonContentSourceDTO>> {
    const result: LessonContentSourceResult = await this._getLessonContentSourceUseCase.execute(lessonId, this._canManage(currentUser));

    return new APIResponseBuilder<LessonContentSourceDTO>()
      .setData(PagesMapper.toContentSourceDTO(result))
      .setMessage(await i18n.t("pages.content_source_resolved"))
      .build();
  }

  @Get("by-module/:moduleId")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get module pages", description: "Retrieves the pages of a module ordered by position; students only see published pages" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Module pages retrieved successfully", type: PageSummaryDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Module not found" })
  public async getModulePages(
    @Param("moduleId") moduleId: string,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<PageSummaryDTO[]>> {
    const pages: PageSummary[] = await this._getModulePagesUseCase.execute(moduleId, this._canManage(currentUser));

    return new APIResponseBuilder<PageSummaryDTO[]>()
      .setData(pages.map((page: PageSummary) => PagesMapper.toSummaryDTO(page)))
      .setMessage(await i18n.t("pages.module_pages_retrieved"))
      .build();
  }

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get page by ID", description: "Retrieves a page with its active blocks and resolved media URLs; unpublished content answers 404 for students" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Page retrieved successfully", type: PageDTO })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Page not found" })
  public async getPageById(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload | undefined, @I18n() i18n: I18nContext): Promise<APIResponse<PageDTO>> {
    const page: PageView = await this._getPageByIdUseCase.execute(id, this._canManage(currentUser));

    return new APIResponseBuilder<PageDTO>()
      .setData(PagesMapper.toDTO(page))
      .setMessage(await i18n.t("pages.page_retrieved"))
      .build();
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("pages:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update page", description: "Updates a page's metadata or status; the previous version is stored as a revision snapshot" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Page updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Page not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Duplicate slug in the module" })
  public async updatePage(
    @Param("id") id: string,
    @Body() dto: UpdatePageDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updatePageUseCase.execute(
      new UpdatePageCommand({
        pageId: id,
        fields: { ...this._toFields(dto), title: dto.title, slug: dto.slug },
        changeLog: dto.changeLog,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("pages.page_updated"))
      .build();
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("pages:delete")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete page", description: "Permanently deletes a page with its blocks; answers 409 when it has student progress or notes (archive it instead)" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Page deleted successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Page not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The page has student data; archive it instead" })
  public async deletePage(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._deletePageUseCase.execute(id, currentUser.sub);

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("pages.page_deleted"))
      .build();
  }

  @Post(":id/blocks")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("pages:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create page block", description: "Appends a block to the page after validating and sanitizing its content for its type" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Block created successfully", type: CreatedContentIdDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error, invalid content for the type or unknown media" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Page not found" })
  public async createPageBlock(
    @Param("id") id: string,
    @Body() dto: CreatePageBlockDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<CreatedContentIdDTO>> {
    const blockId: string = await this._createPageBlockUseCase.execute(
      new CreatePageBlockCommand({
        pageId: id,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        mediaId: dto.mediaId,
        estimatedTime: dto.estimatedTime,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<CreatedContentIdDTO>()
      .setData(new CreatedContentIdDTO({ id: blockId }))
      .setMessage(await i18n.t("pages.block_created"))
      .build();
  }

  @Put(":id/blocks/reorder")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("pages:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reorder page blocks", description: "Sets the order of every block of the page in one transaction" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Blocks reordered successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or the list is not exactly the blocks of the page" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Page not found" })
  public async reorderPageBlocks(@Param("id") id: string, @Body() dto: ReorderItemsDTO, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._reorderPageBlocksUseCase.execute(id, dto.ids);

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("pages.blocks_reordered"))
      .build();
  }

  @Put(":id/blocks/:blockId")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("pages:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update page block", description: "Replaces a block's type, title, content or media; the result is validated and sanitized again" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Block updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error, invalid content for the type or unknown media" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Block not found" })
  public async updatePageBlock(
    @Param("id") id: string,
    @Param("blockId") blockId: string,
    @Body() dto: UpdatePageBlockDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updatePageBlockUseCase.execute(
      new UpdatePageBlockCommand({
        pageId: id,
        blockId,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        mediaId: dto.mediaId,
        estimatedTime: dto.estimatedTime,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("pages.block_updated"))
      .build();
  }

  @Delete(":id/blocks/:blockId")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("pages:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete page block", description: "Deletes a block of the page" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Block deleted successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Block not found" })
  public async deletePageBlock(@Param("id") id: string, @Param("blockId") blockId: string, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._deletePageBlockUseCase.execute(id, blockId);

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("pages.block_deleted"))
      .build();
  }

  private _canManage(currentUser: JwtPayload | undefined): boolean {
    return canManageContent(currentUser?.permissions, PAGES_MANAGE_PERMISSION);
  }

  private _toFields(dto: CreatePageDTO | UpdatePageDTO): PageContentFields {
    return {
      type: dto.type,
      description: dto.description,
      difficulty: dto.difficulty,
      estimatedMinutes: dto.estimatedMinutes,
      learningObjectives: dto.learningObjectives,
      keyTakeaways: dto.keyTakeaways,
      tags: dto.tags,
      status: dto.status,
    };
  }
}
