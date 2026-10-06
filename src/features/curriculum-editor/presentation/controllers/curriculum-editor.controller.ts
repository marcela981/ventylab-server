/*
 * Funcionalidad: Controlador del editor del currículo
 * Descripción: Expone bajo api/teaching las rutas del editor estilo Notion (árbol del currículo, CRUD de nodos y bloques de lecciones), restringidas a docentes y administradores con el permiso curriculum:manage
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
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { CreateCurriculumNodeCommand } from "@/features/curriculum-editor/application/commands/create-curriculum-node.command";
import { DeleteCurriculumNodeCommand } from "@/features/curriculum-editor/application/commands/delete-curriculum-node.command";
import { UpdateCurriculumNodeCommand } from "@/features/curriculum-editor/application/commands/update-curriculum-node.command";
import { CreateCurriculumNodeUseCase } from "@/features/curriculum-editor/application/use-cases/create-curriculum-node.usecase";
import { DeleteCurriculumNodeUseCase } from "@/features/curriculum-editor/application/use-cases/delete-curriculum-node.usecase";
import { GetCurriculumTreeUseCase } from "@/features/curriculum-editor/application/use-cases/get-curriculum-tree.usecase";
import { UpdateCurriculumNodeUseCase } from "@/features/curriculum-editor/application/use-cases/update-curriculum-node.usecase";
import { type CurriculumTreeLevel } from "@/features/curriculum-editor/domain/read-models/curriculum-tree.read-model";
import {
  CreateCurriculumNodeDTO,
  CurriculumNodeTypeQueryDTO,
  CurriculumTreeQueryDTO,
  SaveLessonBlocksDTO,
  UpdateCurriculumNodeDTO,
} from "@/features/curriculum-editor/presentation/dtos/curriculum-editor-request.dto";
import { CurriculumTreeLevelDTO } from "@/features/curriculum-editor/presentation/dtos/curriculum-tree.dto";
import { CurriculumEditorMapper } from "@/features/curriculum-editor/presentation/mappers/curriculum-editor.mapper";
import { SaveLessonBlocksCommand } from "@/features/lessons/application/commands/save-lesson-blocks.command";
import { GetLessonContentUseCase } from "@/features/lessons/application/use-cases/get-lesson-content.usecase";
import { SaveLessonBlocksUseCase } from "@/features/lessons/application/use-cases/save-lesson-blocks.usecase";
import { type LessonContentView } from "@/features/lessons/domain/read-models/lesson-views.read-model";
import { LessonContentDTO } from "@/features/lessons/presentation/dtos/lesson.dto";
import { LessonsMapper } from "@/features/lessons/presentation/mappers/lessons.mapper";

@ApiTags("Curriculum editor")
@ApiBearerAuth("JWT-auth")
@Controller("api/teaching")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CurriculumEditorController {
  public constructor(
    private readonly _getCurriculumTreeUseCase: GetCurriculumTreeUseCase,
    private readonly _createCurriculumNodeUseCase: CreateCurriculumNodeUseCase,
    private readonly _updateCurriculumNodeUseCase: UpdateCurriculumNodeUseCase,
    private readonly _deleteCurriculumNodeUseCase: DeleteCurriculumNodeUseCase,
    private readonly _getLessonContentUseCase: GetLessonContentUseCase,
    private readonly _saveLessonBlocksUseCase: SaveLessonBlocksUseCase,
  ) {}

  @Get("tree")
  @RequirePermissions("curriculum:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get curriculum tree", description: "Returns the recursive tree of levels, sublevels, modules and lessons, optionally filtered by track" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Curriculum tree retrieved successfully", type: [CurriculumTreeLevelDTO] })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getCurriculumTree(@Query() query: CurriculumTreeQueryDTO, @I18n() i18n: I18nContext): Promise<APIResponse<CurriculumTreeLevelDTO[]>> {
    const tree: CurriculumTreeLevel[] = await this._getCurriculumTreeUseCase.execute(query.track);

    return new APIResponseBuilder<CurriculumTreeLevelDTO[]>()
      .setData(tree.map((level: CurriculumTreeLevel) => CurriculumEditorMapper.toLevelDTO(level)))
      .setMessage(await i18n.t("curriculum-editor.tree_retrieved"))
      .build();
  }

  @Post("node")
  @RequirePermissions("curriculum:manage")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create curriculum node", description: "Creates a level, a sublevel (type=level with parentId) or a module (type=module with levelId)" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Node created successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or missing levelId for a module" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Parent level or level not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Duplicate level title" })
  public async createNode(
    @Body() dto: CreateCurriculumNodeDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._createCurriculumNodeUseCase.execute(
      new CreateCurriculumNodeCommand({
        type: dto.type,
        title: dto.title,
        parentId: dto.parentId,
        levelId: dto.levelId,
        track: dto.track,
        description: dto.description,
        color: dto.color,
        tags: dto.tags,
        order: dto.order,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t(`curriculum-editor.${dto.type}_created`))
      .build();
  }

  @Put("node/:id")
  @RequirePermissions("curriculum:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update curriculum node", description: "Updates the title, description, color, tags, order or active flag of a level or module" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Node updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Level or module not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Duplicate level title" })
  public async updateNode(
    @Param("id") id: string,
    @Query() query: CurriculumNodeTypeQueryDTO,
    @Body() dto: UpdateCurriculumNodeDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updateCurriculumNodeUseCase.execute(
      new UpdateCurriculumNodeCommand({
        id,
        type: query.type,
        title: dto.title,
        description: dto.description,
        color: dto.color,
        tags: dto.tags,
        order: dto.order,
        isActive: dto.isActive,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t(`curriculum-editor.${query.type}_updated`))
      .build();
  }

  @Delete("node/:id")
  @RequirePermissions("curriculum:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Delete curriculum node",
    description: "Permanently deletes a level with its sublevels, modules, lessons and pages, or a module with its content; answers 409 when any of them has student data",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Node deleted successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Level or module not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The node has student data; archive it instead" })
  public async deleteNode(
    @Param("id") id: string,
    @Query() query: CurriculumNodeTypeQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._deleteCurriculumNodeUseCase.execute(new DeleteCurriculumNodeCommand({ id, type: query.type, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t(`curriculum-editor.${query.type}_deleted`))
      .build();
  }

  @Get("lesson/:id/content")
  @RequirePermissions("curriculum:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get lesson content", description: "Returns a lesson with its full Notion-style blocks for the editor" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Lesson content retrieved successfully", type: LessonContentDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson not found" })
  public async getLessonContent(@Param("id") id: string, @I18n() i18n: I18nContext): Promise<APIResponse<LessonContentDTO>> {
    const content: LessonContentView = await this._getLessonContentUseCase.execute(id);

    return new APIResponseBuilder<LessonContentDTO>()
      .setData(LessonsMapper.toContentDTO(content))
      .setMessage(await i18n.t("curriculum-editor.lesson_content_retrieved"))
      .build();
  }

  @Put("lesson/:id/content")
  @RequirePermissions("curriculum:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Save lesson content", description: "Replaces the Notion-style blocks of a lesson" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Lesson content saved successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson not found" })
  public async saveLessonContent(
    @Param("id") id: string,
    @Body() dto: SaveLessonBlocksDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._saveLessonBlocksUseCase.execute(new SaveLessonBlocksCommand({ lessonId: id, blocks: dto.blocks, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("curriculum-editor.lesson_content_saved"))
      .build();
  }
}
