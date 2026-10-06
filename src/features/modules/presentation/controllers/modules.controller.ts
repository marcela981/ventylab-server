/*
 * Funcionalidad: Controlador ModulesController
 * Descripción: Expone las rutas HTTP api/modules de la feature de módulos, aplica guardias y permisos y responde con APIResponseBuilder; depende de AddModulePrerequisiteUseCase, CreateModuleUseCase, DeleteModuleUseCase, GetModuleByIdUseCase, GetModuleLessonsCountUseCase, GetModuleLessonsUseCase y otros
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

import { type Paginated } from "@/common/domain/utils/paginated";
import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "@/features/auth/presentation/guards/optional-jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { canManageContent } from "@/features/curriculum/domain/services/content-visibility";
import { CreateModuleCommand } from "@/features/modules/application/commands/create-module.command";
import { DeleteModuleCommand } from "@/features/modules/application/commands/delete-module.command";
import { ModulePrerequisiteCommand } from "@/features/modules/application/commands/module-prerequisite.command";
import { SetModulePrerequisitesCommand } from "@/features/modules/application/commands/set-module-prerequisites.command";
import { UpdateModuleCommand } from "@/features/modules/application/commands/update-module.command";
import { AddModulePrerequisiteUseCase } from "@/features/modules/application/use-cases/add-module-prerequisite.usecase";
import { CreateModuleUseCase } from "@/features/modules/application/use-cases/create-module.usecase";
import { DeleteModuleUseCase } from "@/features/modules/application/use-cases/delete-module.usecase";
import { GetModuleByIdUseCase } from "@/features/modules/application/use-cases/get-module-by-id.usecase";
import { GetModuleFullUseCase } from "@/features/modules/application/use-cases/get-module-full.usecase";
import { GetModuleLessonsCountUseCase } from "@/features/modules/application/use-cases/get-module-lessons-count.usecase";
import { GetModuleLessonsUseCase } from "@/features/modules/application/use-cases/get-module-lessons.usecase";
import { GetModuleProgressUseCase } from "@/features/modules/application/use-cases/get-module-progress.usecase";
import { GetModuleResumeUseCase } from "@/features/modules/application/use-cases/get-module-resume.usecase";
import { GetModulesUseCase } from "@/features/modules/application/use-cases/get-modules.usecase";
import { RemoveModulePrerequisiteUseCase } from "@/features/modules/application/use-cases/remove-module-prerequisite.usecase";
import { ReorderModulesUseCase } from "@/features/modules/application/use-cases/reorder-modules.usecase";
import { SetModulePrerequisitesUseCase } from "@/features/modules/application/use-cases/set-module-prerequisites.usecase";
import { UpdateModuleUseCase } from "@/features/modules/application/use-cases/update-module.usecase";
import { type ModuleProgressView, type ModuleResumeState } from "@/features/modules/domain/read-models/module-progress.read-model";
import {
  type ModuleDetail,
  type ModuleFullContent,
  type ModuleLessonItem,
  type ModuleListItem,
} from "@/features/modules/domain/read-models/module-views.read-model";
import { ModuleFullDTO } from "@/features/modules/presentation/dtos/module-full.dto";
import { ModuleProgressDTO, ModuleResumeDTO } from "@/features/modules/presentation/dtos/module-progress.dto";
import {
  AddModulePrerequisiteDTO,
  CreateModuleDTO,
  GetModulesQueryDTO,
  ReorderModulesDTO,
  SetModulePrerequisitesDTO,
  UpdateModuleDTO,
} from "@/features/modules/presentation/dtos/module-request.dto";
import { ModuleDetailDTO, ModuleLessonDTO, ModuleLessonsCountDTO, ModuleListItemDTO } from "@/features/modules/presentation/dtos/module.dto";
import { ModuleFullMapper } from "@/features/modules/presentation/mappers/module-full.mapper";
import { ModulesMapper } from "@/features/modules/presentation/mappers/modules.mapper";

const MODULES_MANAGE_PERMISSION: string = "modules:update";

@ApiTags("Modules")
@Controller("api/modules")
export class ModulesController {
  public constructor(
    private readonly _getModulesUseCase: GetModulesUseCase,
    private readonly _getModuleByIdUseCase: GetModuleByIdUseCase,
    private readonly _getModuleLessonsCountUseCase: GetModuleLessonsCountUseCase,
    private readonly _getModuleLessonsUseCase: GetModuleLessonsUseCase,
    private readonly _getModuleProgressUseCase: GetModuleProgressUseCase,
    private readonly _getModuleResumeUseCase: GetModuleResumeUseCase,
    private readonly _createModuleUseCase: CreateModuleUseCase,
    private readonly _updateModuleUseCase: UpdateModuleUseCase,
    private readonly _deleteModuleUseCase: DeleteModuleUseCase,
    private readonly _addModulePrerequisiteUseCase: AddModulePrerequisiteUseCase,
    private readonly _removeModulePrerequisiteUseCase: RemoveModulePrerequisiteUseCase,
    private readonly _setModulePrerequisitesUseCase: SetModulePrerequisitesUseCase,
    private readonly _reorderModulesUseCase: ReorderModulesUseCase,
    private readonly _getModuleFullUseCase: GetModuleFullUseCase,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get modules", description: "Retrieves a paginated list of modules with prerequisites; students only see published modules" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Modules retrieved successfully", type: ModuleListItemDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  public async getModules(
    @Query() query: GetModulesQueryDTO,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ModuleListItemDTO[]>> {
    const modules: Paginated<ModuleListItem> = await this._getModulesUseCase.execute({
      page: query.page,
      limit: query.limit,
      category: query.category,
      difficulty: query.difficulty,
      canManage: canManageContent(currentUser?.permissions, MODULES_MANAGE_PERMISSION),
    });

    return new APIResponseBuilder<ModuleListItemDTO[]>()
      .setData(modules.data.map((module: ModuleListItem) => ModulesMapper.toListItemDTO(module)))
      .setMessage(await i18n.t("modules.modules_retrieved"))
      .setPagination(modules.pagination)
      .build();
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("modules:create")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create module", description: "Creates a module, optionally with prerequisite modules" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Module created successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or unknown prerequisites" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Level not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Duplicate title" })
  public async createModule(
    @Body() dto: CreateModuleDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._createModuleUseCase.execute(
      new CreateModuleCommand({
        levelId: dto.levelId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        difficulty: dto.difficulty,
        estimatedTime: dto.estimatedTime,
        thumbnail: dto.thumbnail,
        order: dto.order,
        prerequisiteIds: dto.prerequisiteIds,
        status: dto.status,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("modules.module_created"))
      .build();
  }

  @Put("reorder")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("modules:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reorder modules of a level", description: "Sets the order of every module of the level in one transaction" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Modules reordered successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or the list is not exactly the modules of the level" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Level not found" })
  public async reorderModules(@Body() dto: ReorderModulesDTO, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._reorderModulesUseCase.execute(dto.levelId, dto.ids);

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("modules.modules_reordered"))
      .build();
  }

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get module by ID", description: "Retrieves a module with its prerequisites and dependent modules; unpublished content answers 404 for students" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Module retrieved successfully", type: ModuleDetailDTO })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Module not found" })
  public async getModuleById(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ModuleDetailDTO>> {
    const module: ModuleDetail = await this._getModuleByIdUseCase.execute(id, canManageContent(currentUser?.permissions, MODULES_MANAGE_PERMISSION));

    return new APIResponseBuilder<ModuleDetailDTO>()
      .setData(ModulesMapper.toDetailDTO(module))
      .setMessage(await i18n.t("modules.module_retrieved"))
      .build();
  }

  @Get(":id/full")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get full module content",
    description: "Retrieves the module with its lessons, pages and blocks in one nested query, with media URLs resolved in one batch; students only see published content",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Module content retrieved successfully", type: ModuleFullDTO })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Module not found" })
  public async getModuleFull(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ModuleFullDTO>> {
    const content: ModuleFullContent = await this._getModuleFullUseCase.execute(id, canManageContent(currentUser?.permissions, MODULES_MANAGE_PERMISSION));

    return new APIResponseBuilder<ModuleFullDTO>()
      .setData(ModuleFullMapper.toDTO(content))
      .setMessage(await i18n.t("modules.module_content_retrieved"))
      .build();
  }

  @Get(":id/lessons/count")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Count module lessons", description: "Counts the lessons of the module; students only count published lessons" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Lesson count retrieved successfully", type: ModuleLessonsCountDTO })
  public async getModuleLessonsCount(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ModuleLessonsCountDTO>> {
    const count: number = await this._getModuleLessonsCountUseCase.execute(id, canManageContent(currentUser?.permissions, MODULES_MANAGE_PERMISSION));

    return new APIResponseBuilder<ModuleLessonsCountDTO>()
      .setData(new ModuleLessonsCountDTO({ count }))
      .setMessage(await i18n.t("modules.lessons_count_retrieved"))
      .build();
  }

  @Get(":id/lessons")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get module lessons", description: "Retrieves the lessons of a module ordered by position; students only see published lessons" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Lessons retrieved successfully", type: ModuleLessonDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Module not found" })
  public async getModuleLessons(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ModuleLessonDTO[]>> {
    const lessons: ModuleLessonItem[] = await this._getModuleLessonsUseCase.execute(id, canManageContent(currentUser?.permissions, MODULES_MANAGE_PERMISSION));

    return new APIResponseBuilder<ModuleLessonDTO[]>()
      .setData(lessons.map((lesson: ModuleLessonItem) => ModulesMapper.toLessonDTO(lesson)))
      .setMessage(await i18n.t("modules.lessons_retrieved"))
      .build();
  }

  @Get(":id/progress")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("progress:read_own")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get module progress",
    description: "Retrieves the current user's progress in the module, creating the progress record when it does not exist",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Progress retrieved successfully", type: ModuleProgressDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Module not found" })
  public async getModuleProgress(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ModuleProgressDTO>> {
    const progress: ModuleProgressView = await this._getModuleProgressUseCase.execute(currentUser.sub, id);

    return new APIResponseBuilder<ModuleProgressDTO>()
      .setData(ModulesMapper.toProgressDTO(progress))
      .setMessage(await i18n.t("modules.progress_retrieved"))
      .build();
  }

  @Get(":id/resume")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("progress:read_own")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get module resume point", description: "Finds the first incomplete active lesson and the step to resume at" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Resume point retrieved successfully", type: ModuleResumeDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Module has no active lessons" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Module not found" })
  public async getModuleResume(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ModuleResumeDTO>> {
    const state: ModuleResumeState = await this._getModuleResumeUseCase.execute(currentUser.sub, id);

    return new APIResponseBuilder<ModuleResumeDTO>()
      .setData(ModulesMapper.toResumeDTO(state))
      .setMessage(await i18n.t("modules.resume_retrieved"))
      .build();
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("modules:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update module", description: "Updates a module's content fields, order or status; isActive stays in sync with status (ARCHIVED means inactive)" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Module updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Module not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Duplicate order" })
  public async updateModule(
    @Param("id") id: string,
    @Body() dto: UpdateModuleDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updateModuleUseCase.execute(
      new UpdateModuleCommand({
        moduleId: id,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        difficulty: dto.difficulty,
        estimatedTime: dto.estimatedTime,
        thumbnail: dto.thumbnail,
        order: dto.order,
        isActive: dto.isActive,
        status: dto.status,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("modules.module_updated"))
      .build();
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("modules:delete")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Delete module",
    description: "Permanently deletes a module with its lessons, pages and blocks; answers 409 when any of them has student data (archive it instead)",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Module deleted successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Module not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The module has student data; archive it instead" })
  public async deleteModule(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._deleteModuleUseCase.execute(new DeleteModuleCommand({ moduleId: id, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("modules.module_deleted"))
      .build();
  }

  @Post(":id/prerequisites")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("modules:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Add module prerequisite", description: "Adds a prerequisite module, rejecting self references and cycles" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Prerequisite added successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or self prerequisite" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Module or prerequisite module not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Prerequisite already exists or would create a circular dependency" })
  public async addModulePrerequisite(
    @Param("id") id: string,
    @Body() dto: AddModulePrerequisiteDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._addModulePrerequisiteUseCase.execute(
      new ModulePrerequisiteCommand({ moduleId: id, prerequisiteId: dto.prerequisiteId, performedBy: currentUser.sub }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("modules.prerequisite_added"))
      .build();
  }

  @Put(":id/prerequisites")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("modules:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Set module prerequisites", description: "Replaces every prerequisite of the module, rejecting self references and cycles" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Prerequisites replaced successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error, self prerequisite or unknown prerequisites" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Module not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The prerequisites would create a circular dependency" })
  public async setModulePrerequisites(
    @Param("id") id: string,
    @Body() dto: SetModulePrerequisitesDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._setModulePrerequisitesUseCase.execute(
      new SetModulePrerequisitesCommand({ moduleId: id, prerequisiteIds: dto.prerequisiteIds, performedBy: currentUser.sub }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("modules.prerequisites_replaced"))
      .build();
  }

  @Delete(":id/prerequisites/:prerequisiteId")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("modules:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove module prerequisite", description: "Removes a prerequisite module" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Prerequisite removed successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Prerequisite relation not found" })
  public async removeModulePrerequisite(
    @Param("id") id: string,
    @Param("prerequisiteId") prerequisiteId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._removeModulePrerequisiteUseCase.execute(new ModulePrerequisiteCommand({ moduleId: id, prerequisiteId, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("modules.prerequisite_removed"))
      .build();
  }
}
