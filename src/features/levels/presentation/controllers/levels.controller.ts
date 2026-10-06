/*
 * Funcionalidad: Controlador LevelsController
 * Descripción: Expone las rutas HTTP api/levels de la feature de niveles, aplica guardias y permisos y responde con APIResponseBuilder; depende de AddLevelPrerequisiteUseCase, CheckLevelCanDeleteUseCase, CreateLevelUseCase, DeleteLevelUseCase, GetLevelByIdUseCase, GetLevelModulesUseCase y otros
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
import { CreateLevelCommand } from "@/features/levels/application/commands/create-level.command";
import { DeleteLevelCommand } from "@/features/levels/application/commands/delete-level.command";
import { LevelPrerequisiteCommand } from "@/features/levels/application/commands/level-prerequisite.command";
import { ReorderLevelsCommand } from "@/features/levels/application/commands/reorder-levels.command";
import { SetLevelPrerequisitesCommand } from "@/features/levels/application/commands/set-level-prerequisites.command";
import { UpdateLevelCommand } from "@/features/levels/application/commands/update-level.command";
import { AddLevelPrerequisiteUseCase } from "@/features/levels/application/use-cases/add-level-prerequisite.usecase";
import { CheckLevelCanDeleteUseCase } from "@/features/levels/application/use-cases/check-level-can-delete.usecase";
import { CreateLevelUseCase } from "@/features/levels/application/use-cases/create-level.usecase";
import { DeleteLevelUseCase } from "@/features/levels/application/use-cases/delete-level.usecase";
import { GetLevelByIdUseCase } from "@/features/levels/application/use-cases/get-level-by-id.usecase";
import { GetLevelModulesUseCase } from "@/features/levels/application/use-cases/get-level-modules.usecase";
import { GetLevelPrerequisitesUseCase } from "@/features/levels/application/use-cases/get-level-prerequisites.usecase";
import { GetLevelUnlockStatusUseCase } from "@/features/levels/application/use-cases/get-level-unlock-status.usecase";
import { GetLevelsCurriculumUseCase } from "@/features/levels/application/use-cases/get-levels-curriculum.usecase";
import { GetLevelsUseCase } from "@/features/levels/application/use-cases/get-levels.usecase";
import { GetUserRoadmapUseCase } from "@/features/levels/application/use-cases/get-user-roadmap.usecase";
import { RemoveLevelPrerequisiteUseCase } from "@/features/levels/application/use-cases/remove-level-prerequisite.usecase";
import { ReorderLevelsUseCase } from "@/features/levels/application/use-cases/reorder-levels.usecase";
import { SetLevelPrerequisitesUseCase } from "@/features/levels/application/use-cases/set-level-prerequisites.usecase";
import { UpdateLevelUseCase } from "@/features/levels/application/use-cases/update-level.usecase";
import { type LevelCurriculumItem } from "@/features/levels/domain/read-models/level-curriculum.read-model";
import { type LevelRoadmapNode, type LevelUnlockStatus } from "@/features/levels/domain/read-models/level-roadmap.read-model";
import {
  type CanDeleteLevelResult,
  type LevelDetail,
  type LevelModuleItem,
  type LevelPrerequisitesView,
  type LevelSummary,
} from "@/features/levels/domain/read-models/level-views.read-model";
import { LevelCurriculumDTO, LevelRoadmapNodeDTO, LevelUnlockStatusDTO } from "@/features/levels/presentation/dtos/level-progress.dto";
import { GetLevelsCurriculumQueryDTO, GetLevelsQueryDTO, IncludeInactiveQueryDTO } from "@/features/levels/presentation/dtos/level-query.dto";
import {
  AddLevelPrerequisiteDTO,
  CreateLevelDTO,
  ReorderLevelsDTO,
  SetLevelPrerequisitesDTO,
  UpdateLevelDTO,
} from "@/features/levels/presentation/dtos/level-request.dto";
import {
  CanDeleteLevelDTO,
  LevelDetailDTO,
  LevelDTO,
  LevelModuleDTO,
  LevelPrerequisitesDTO,
} from "@/features/levels/presentation/dtos/level.dto";
import { LevelsMapper } from "@/features/levels/presentation/mappers/levels.mapper";

const LEVELS_MANAGE_PERMISSION: string = "levels:update";

@ApiTags("Levels")
@Controller("api/levels")
export class LevelsController {
  public constructor(
    private readonly _getLevelsUseCase: GetLevelsUseCase,
    private readonly _getLevelsCurriculumUseCase: GetLevelsCurriculumUseCase,
    private readonly _getUserRoadmapUseCase: GetUserRoadmapUseCase,
    private readonly _getLevelByIdUseCase: GetLevelByIdUseCase,
    private readonly _getLevelModulesUseCase: GetLevelModulesUseCase,
    private readonly _getLevelPrerequisitesUseCase: GetLevelPrerequisitesUseCase,
    private readonly _getLevelUnlockStatusUseCase: GetLevelUnlockStatusUseCase,
    private readonly _checkLevelCanDeleteUseCase: CheckLevelCanDeleteUseCase,
    private readonly _reorderLevelsUseCase: ReorderLevelsUseCase,
    private readonly _createLevelUseCase: CreateLevelUseCase,
    private readonly _updateLevelUseCase: UpdateLevelUseCase,
    private readonly _addLevelPrerequisiteUseCase: AddLevelPrerequisiteUseCase,
    private readonly _removeLevelPrerequisiteUseCase: RemoveLevelPrerequisiteUseCase,
    private readonly _setLevelPrerequisitesUseCase: SetLevelPrerequisitesUseCase,
    private readonly _deleteLevelUseCase: DeleteLevelUseCase,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get levels",
    description: "Retrieves a paginated list of levels ordered by position; students only see published levels and includeInactive requires levels:update",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Levels retrieved successfully", type: LevelDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  public async getLevels(
    @Query() query: GetLevelsQueryDTO,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<LevelDTO[]>> {
    const canManage: boolean = canManageContent(currentUser?.permissions, LEVELS_MANAGE_PERMISSION);

    const levels: Paginated<LevelSummary> = await this._getLevelsUseCase.execute({
      page: query.page,
      limit: query.limit,
      includeInactive: canManage && (query.includeInactive ?? false),
      canManage,
    });

    return new APIResponseBuilder<LevelDTO[]>()
      .setData(levels.data.map((level: LevelSummary) => LevelsMapper.toDTO(level)))
      .setMessage(await i18n.t("levels.levels_retrieved"))
      .setPagination(levels.pagination)
      .build();
  }

  @Get("curriculum")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get levels curriculum",
    description: "Retrieves active levels with their active modules and, when authenticated, the user's progress and unlock state",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Curriculum retrieved successfully", type: LevelCurriculumDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  public async getLevelsCurriculum(
    @Query() query: GetLevelsCurriculumQueryDTO,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<LevelCurriculumDTO[]>> {
    const items: LevelCurriculumItem[] = await this._getLevelsCurriculumUseCase.execute(
      canManageContent(currentUser?.permissions, LEVELS_MANAGE_PERMISSION),
      currentUser?.sub,
      query.track,
    );

    return new APIResponseBuilder<LevelCurriculumDTO[]>()
      .setData(items.map((item: LevelCurriculumItem) => LevelsMapper.toCurriculumDTO(item)))
      .setMessage(await i18n.t("levels.curriculum_retrieved"))
      .build();
  }

  @Get("roadmap")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("progress:read_own")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get user roadmap", description: "Retrieves the main track levels with the user's unlock status and progress" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Roadmap retrieved successfully", type: LevelRoadmapNodeDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async getUserRoadmap(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<LevelRoadmapNodeDTO[]>> {
    const roadmap: LevelRoadmapNode[] = await this._getUserRoadmapUseCase.execute(currentUser.sub);
    const lockReasonPrefix: string = await i18n.t("levels.lock_reason_prefix");

    return new APIResponseBuilder<LevelRoadmapNodeDTO[]>()
      .setData(roadmap.map((node: LevelRoadmapNode) => LevelsMapper.toRoadmapNodeDTO(node, lockReasonPrefix)))
      .setMessage(await i18n.t("levels.roadmap_retrieved"))
      .build();
  }

  @Put("reorder")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("levels:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reorder levels", description: "Sets each level's order to its position in the given list" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Levels reordered successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or unknown level IDs" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async reorderLevels(
    @Body() dto: ReorderLevelsDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._reorderLevelsUseCase.execute(new ReorderLevelsCommand({ levelIds: dto.levelIds, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("levels.levels_reordered"))
      .build();
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("levels:create")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create level", description: "Creates a level; the order defaults to the next available position" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Level created successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Section not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Duplicate title or order" })
  public async createLevel(
    @Body() dto: CreateLevelDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._createLevelUseCase.execute(
      new CreateLevelCommand({
        title: dto.title,
        track: dto.track,
        description: dto.description,
        order: dto.order,
        status: dto.status,
        sectionId: dto.sectionId,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("levels.level_created"))
      .build();
  }

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get level by ID", description: "Retrieves a level with its modules; unpublished content answers 404 for students" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Level retrieved successfully", type: LevelDetailDTO })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Level not found" })
  public async getLevelById(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<LevelDetailDTO>> {
    const level: LevelDetail = await this._getLevelByIdUseCase.execute(id, canManageContent(currentUser?.permissions, LEVELS_MANAGE_PERMISSION));

    return new APIResponseBuilder<LevelDetailDTO>()
      .setData(LevelsMapper.toDetailDTO(level))
      .setMessage(await i18n.t("levels.level_retrieved"))
      .build();
  }

  @Get(":id/modules")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get level modules", description: "Retrieves the modules of a level with lesson counts and prerequisites" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Level modules retrieved successfully", type: LevelModuleDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Level not found" })
  public async getLevelModules(
    @Param("id") id: string,
    @Query() query: IncludeInactiveQueryDTO,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<LevelModuleDTO[]>> {
    const canManage: boolean = canManageContent(currentUser?.permissions, LEVELS_MANAGE_PERMISSION);
    const modules: LevelModuleItem[] = await this._getLevelModulesUseCase.execute(id, canManage && (query.includeInactive ?? false), canManage);

    return new APIResponseBuilder<LevelModuleDTO[]>()
      .setData(modules.map((module: LevelModuleItem) => LevelsMapper.toModuleDTO(module)))
      .setMessage(await i18n.t("levels.level_modules_retrieved"))
      .build();
  }

  @Get(":id/prerequisites")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get level prerequisites", description: "Retrieves the prerequisite and dependent levels of a level" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Prerequisites retrieved successfully", type: LevelPrerequisitesDTO })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Level not found" })
  public async getLevelPrerequisites(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<LevelPrerequisitesDTO>> {
    const view: LevelPrerequisitesView = await this._getLevelPrerequisitesUseCase.execute(id, canManageContent(currentUser?.permissions, LEVELS_MANAGE_PERMISSION));

    return new APIResponseBuilder<LevelPrerequisitesDTO>()
      .setData(LevelsMapper.toPrerequisitesDTO(view))
      .setMessage(await i18n.t("levels.prerequisites_retrieved"))
      .build();
  }

  @Get(":id/unlock-status")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("progress:read_own")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get level unlock status", description: "Computes whether the level is unlocked for the current user" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Unlock status retrieved successfully", type: LevelUnlockStatusDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Level not found" })
  public async getLevelUnlockStatus(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<LevelUnlockStatusDTO>> {
    const status: LevelUnlockStatus = await this._getLevelUnlockStatusUseCase.execute(
      currentUser.sub,
      id,
      canManageContent(currentUser.permissions, LEVELS_MANAGE_PERMISSION),
    );
    const lockReasonPrefix: string = await i18n.t("levels.lock_reason_prefix");

    return new APIResponseBuilder<LevelUnlockStatusDTO>()
      .setData(LevelsMapper.toUnlockStatusDTO(status, lockReasonPrefix))
      .setMessage(await i18n.t("levels.unlock_status_retrieved"))
      .build();
  }

  @Get(":id/can-delete")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("levels:delete")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Check if a level can be deleted", description: "Checks whether the level or any descendant has student data and lists dependent levels" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Check completed", type: CanDeleteLevelDTO })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Level not found" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async checkLevelCanDelete(@Param("id") id: string, @I18n() i18n: I18nContext): Promise<APIResponse<CanDeleteLevelDTO>> {
    const result: CanDeleteLevelResult = await this._checkLevelCanDeleteUseCase.execute(id);

    return new APIResponseBuilder<CanDeleteLevelDTO>()
      .setData(LevelsMapper.toCanDeleteDTO(result))
      .setMessage(await i18n.t("levels.can_delete_checked"))
      .build();
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("levels:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Update level",
    description: "Updates a level's title, track, description, order, section or status; isActive stays in sync with status (ARCHIVED means inactive)",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Level updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Level not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Duplicate title or order" })
  public async updateLevel(
    @Param("id") id: string,
    @Body() dto: UpdateLevelDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updateLevelUseCase.execute(
      new UpdateLevelCommand({
        levelId: id,
        title: dto.title,
        track: dto.track,
        description: dto.description,
        order: dto.order,
        isActive: dto.isActive,
        status: dto.status,
        sectionId: dto.sectionId,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("levels.level_updated"))
      .build();
  }

  @Post(":id/prerequisites")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("levels:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Add level prerequisite", description: "Adds a prerequisite level, rejecting self references and cycles" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Prerequisite added successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or self prerequisite" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Level or prerequisite level not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Prerequisite already exists or would create a circular dependency" })
  public async addLevelPrerequisite(
    @Param("id") id: string,
    @Body() dto: AddLevelPrerequisiteDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._addLevelPrerequisiteUseCase.execute(
      new LevelPrerequisiteCommand({ levelId: id, prerequisiteLevelId: dto.prerequisiteLevelId, performedBy: currentUser.sub }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("levels.prerequisite_added"))
      .build();
  }

  @Put(":id/prerequisites")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("levels:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Set level prerequisites", description: "Replaces every prerequisite of the level, rejecting self references and cycles" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Prerequisites replaced successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or self prerequisite" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Level or prerequisite level not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The prerequisites would create a circular dependency" })
  public async setLevelPrerequisites(
    @Param("id") id: string,
    @Body() dto: SetLevelPrerequisitesDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._setLevelPrerequisitesUseCase.execute(
      new SetLevelPrerequisitesCommand({ levelId: id, prerequisiteLevelIds: dto.prerequisiteLevelIds, performedBy: currentUser.sub }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("levels.prerequisites_replaced"))
      .build();
  }

  @Delete(":id/prerequisites/:prereqId")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("levels:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove level prerequisite", description: "Removes a prerequisite level" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Prerequisite removed successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Prerequisite relation not found" })
  public async removeLevelPrerequisite(
    @Param("id") id: string,
    @Param("prereqId") prereqId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._removeLevelPrerequisiteUseCase.execute(
      new LevelPrerequisiteCommand({ levelId: id, prerequisiteLevelId: prereqId, performedBy: currentUser.sub }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("levels.prerequisite_removed"))
      .build();
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("levels:delete")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Delete level",
    description: "Permanently deletes a level with its sublevels, modules, lessons and pages; answers 409 when any of them has student data (archive it instead)",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Level deleted successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Level not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The level has student data; archive it instead" })
  public async deleteLevel(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._deleteLevelUseCase.execute(new DeleteLevelCommand({ levelId: id, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("levels.level_deleted"))
      .build();
  }
}
