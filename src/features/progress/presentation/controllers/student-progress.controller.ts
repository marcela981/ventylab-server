/*
 * Funcionalidad: Controlador de progreso de estudiantes
 * Descripción: Expone a docentes y administradores (permiso progress:read) el progreso por páginas de un usuario en /api/progress/users/:userId (resumen, módulo, nivel y sección) y, en solo lectura, su gamificación (XP, nivel y racha), su actividad reciente y sus logros; un docente solo lee a los estudiantes de los grupos que creó o supervisa (GroupsFacade.assertCanViewStudent, 403 fuera de su alcance), luego valida que el usuario exista con GetUserByIdUseCase y delega en LearningProgressFacade
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Get, HttpCode, HttpStatus, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { LearningProgressFacade } from "@/features/progress/application/services/learning-progress.facade";
import { GetGamificationStatsUseCase } from "@/features/progress/application/use-cases/get-gamification-stats.usecase";
import { GetRecentActivityUseCase } from "@/features/progress/application/use-cases/get-recent-activity.usecase";
import { GetUserAchievementsUseCase } from "@/features/progress/application/use-cases/get-user-achievements.usecase";
import { type GamificationStats, type RecentActivityItem } from "@/features/progress/domain/read-models/gamification.read-model";
import {
  type LearningProgressReport,
  type LevelLearningProgress,
  type ModuleLearningProgress,
  type SectionLearningProgress,
} from "@/features/progress/domain/read-models/learning-progress.read-model";
import { type UnlockedAchievementView } from "@/features/progress/domain/read-models/progress-views.read-model";
import { AchievementsDTO } from "@/features/progress/presentation/dtos/achievement.dto";
import { GamificationStatsDTO, RecentActivityItemDTO, RecentActivityQueryDTO } from "@/features/progress/presentation/dtos/gamification.dto";
import {
  LearningProgressSummaryDTO,
  LevelLearningProgressDTO,
  ModuleLearningProgressDTO,
  SectionLearningProgressDTO,
} from "@/features/progress/presentation/dtos/learning-progress.dto";
import { GamificationMapper } from "@/features/progress/presentation/mappers/gamification.mapper";
import { LearningProgressMapper } from "@/features/progress/presentation/mappers/learning-progress.mapper";
import { ProgressMapper } from "@/features/progress/presentation/mappers/progress.mapper";
import { GetUserByIdUseCase } from "@/features/users/application/use-cases/get-user-by-id.usecase";

@ApiTags("Progress")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("api/progress/users/:userId")
export class StudentProgressController {
  public constructor(
    private readonly _learningProgressFacade: LearningProgressFacade,
    private readonly _getUserByIdUseCase: GetUserByIdUseCase,
    private readonly _groupsFacade: GroupsFacade,
    private readonly _getGamificationStatsUseCase: GetGamificationStatsUseCase,
    private readonly _getRecentActivityUseCase: GetRecentActivityUseCase,
    private readonly _getUserAchievementsUseCase: GetUserAchievementsUseCase,
  ) {}

  @Get("summary")
  @RequirePermissions("progress:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get a user's learning progress summary", description: "Returns the lesson-weighted progress of the given user over all published content" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Learning progress summary retrieved successfully", type: LearningProgressSummaryDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or the student is outside the teacher's groups" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  public async getUserLearningProgressSummary(
    @Param("userId") userId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<LearningProgressSummaryDTO>> {
    await this._assertCanView(currentUser, userId);

    const report: LearningProgressReport = await this._learningProgressFacade.getSummary(userId);

    return new APIResponseBuilder<LearningProgressSummaryDTO>()
      .setData(LearningProgressMapper.toLearningProgressSummaryDTO(report))
      .setMessage(await i18n.t("progress.learning_summary_retrieved"))
      .build();
  }

  @Get("modules/:moduleId")
  @RequirePermissions("progress:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get a user's module learning progress", description: "Returns completed lessons over published lessons of the module for the given user" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Module learning progress retrieved successfully", type: ModuleLearningProgressDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or the student is outside the teacher's groups" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User or module not found" })
  public async getUserModuleLearningProgress(
    @Param("userId") userId: string,
    @Param("moduleId") moduleId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ModuleLearningProgressDTO>> {
    await this._assertCanView(currentUser, userId);

    const progress: ModuleLearningProgress = await this._learningProgressFacade.getModuleProgress(userId, moduleId);

    return new APIResponseBuilder<ModuleLearningProgressDTO>()
      .setData(LearningProgressMapper.toModuleLearningProgressDTO(progress))
      .setMessage(await i18n.t("progress.module_progress_retrieved"))
      .build();
  }

  @Get("levels/:levelId")
  @RequirePermissions("progress:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get a user's level learning progress", description: "Returns the lesson-weighted progress of the level for the given user" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Level learning progress retrieved successfully", type: LevelLearningProgressDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or the student is outside the teacher's groups" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User or level not found" })
  public async getUserLevelLearningProgress(
    @Param("userId") userId: string,
    @Param("levelId") levelId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<LevelLearningProgressDTO>> {
    await this._assertCanView(currentUser, userId);

    const progress: LevelLearningProgress = await this._learningProgressFacade.getLevelProgress(userId, levelId);

    return new APIResponseBuilder<LevelLearningProgressDTO>()
      .setData(LearningProgressMapper.toLevelLearningProgressDTO(progress))
      .setMessage(await i18n.t("progress.level_progress_retrieved"))
      .build();
  }

  @Get("sections/:sectionId")
  @RequirePermissions("progress:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get a user's section learning progress", description: "Returns the lesson-weighted progress of the section for the given user" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Section learning progress retrieved successfully", type: SectionLearningProgressDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or the student is outside the teacher's groups" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User or section not found" })
  public async getUserSectionLearningProgress(
    @Param("userId") userId: string,
    @Param("sectionId") sectionId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<SectionLearningProgressDTO>> {
    await this._assertCanView(currentUser, userId);

    const progress: SectionLearningProgress = await this._learningProgressFacade.getSectionProgress(userId, sectionId);

    return new APIResponseBuilder<SectionLearningProgressDTO>()
      .setData(LearningProgressMapper.toSectionLearningProgressDTO(progress))
      .setMessage(await i18n.t("progress.section_progress_retrieved"))
      .build();
  }

  @Get("gamification")
  @RequirePermissions("progress:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get a user's gamification statistics",
    description: "Read-only for staff: XP, level, XP inside the level, the XP of the next level, the current and longest streak (America/Bogota days) and today's XP of the given user",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Gamification statistics retrieved successfully", type: GamificationStatsDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or the student is outside the teacher's groups" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  public async getUserGamification(
    @Param("userId") userId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<GamificationStatsDTO>> {
    await this._assertCanView(currentUser, userId);

    const stats: GamificationStats = await this._getGamificationStatsUseCase.execute(userId);

    return new APIResponseBuilder<GamificationStatsDTO>()
      .setData(GamificationMapper.toGamificationStatsDTO(stats))
      .setMessage(await i18n.t("progress.gamification_retrieved"))
      .build();
  }

  @Get("activity/recent")
  @RequirePermissions("progress:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get a user's recent activity",
    description: "Read-only for staff: the latest ledger milestones of the given user (lesson and module completions, passed evaluations and unlocked achievements) with the title of the referenced item, newest first",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Recent activity retrieved successfully", type: RecentActivityItemDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or the student is outside the teacher's groups" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  public async getUserRecentActivity(
    @Param("userId") userId: string,
    @Query() query: RecentActivityQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<RecentActivityItemDTO[]>> {
    await this._assertCanView(currentUser, userId);

    const items: RecentActivityItem[] = await this._getRecentActivityUseCase.execute(userId, query.limit);

    return new APIResponseBuilder<RecentActivityItemDTO[]>()
      .setData(items.map((item: RecentActivityItem) => GamificationMapper.toRecentActivityItemDTO(item)))
      .setMessage(await i18n.t("progress.recent_activity_retrieved"))
      .build();
  }

  @Get("achievements")
  @RequirePermissions("progress:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get a user's achievements", description: "Read-only for staff: the achievements unlocked by the given user, newest first" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Achievements retrieved successfully", type: AchievementsDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or the student is outside the teacher's groups" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  public async getUserAchievements(
    @Param("userId") userId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<AchievementsDTO>> {
    await this._assertCanView(currentUser, userId);

    const achievements: UnlockedAchievementView[] = await this._getUserAchievementsUseCase.execute(userId);

    return new APIResponseBuilder<AchievementsDTO>()
      .setData(ProgressMapper.toAchievementsDTO(achievements))
      .setMessage(await i18n.t("progress.achievements_retrieved"))
      .build();
  }

  /**
   * @throws {StudentOutOfScopeError} If a teacher does not manage any group of the user
   * @throws {UserNotFoundError} If the user does not exist
   */
  private async _assertCanView(currentUser: JwtPayload, userId: string): Promise<void> {
    await this._groupsFacade.assertCanViewStudent({ id: currentUser.sub, role: currentUser.role }, userId);
    await this._getUserByIdUseCase.execute(userId);
  }
}
