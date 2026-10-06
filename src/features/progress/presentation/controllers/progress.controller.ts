/*
 * Funcionalidad: Controlador de progreso
 * Descripción: Expone las rutas autenticadas de /api/progress (resumen general, vistas de página, progreso por páginas de módulo, nivel, sección y resumen, progreso heredado de módulo y lección, pasos, reanudación, detalle, hitos, logros y habilidades) y delega en los casos de uso de progreso y en GetModuleResumeUseCase
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { canManageContent } from "@/features/curriculum/domain/services/content-visibility";
import { GetModuleResumeUseCase } from "@/features/modules/application/use-cases/get-module-resume.usecase";
import { type ModuleResumeState } from "@/features/modules/domain/read-models/module-progress.read-model";
import { RecordLessonProgressCommand } from "@/features/progress/application/commands/record-lesson-progress.command";
import { RecordPageViewCommand } from "@/features/progress/application/commands/record-page-view.command";
import { UpdateStepProgressCommand } from "@/features/progress/application/commands/update-step-progress.command";
import { LearningProgressFacade } from "@/features/progress/application/services/learning-progress.facade";
import { GetLessonProgressDetailsUseCase } from "@/features/progress/application/use-cases/get-lesson-progress-details.usecase";
import { GetLessonProgressUseCase } from "@/features/progress/application/use-cases/get-lesson-progress.usecase";
import { GetMilestonesUseCase } from "@/features/progress/application/use-cases/get-milestones.usecase";
import { GetModuleProgressSummaryUseCase } from "@/features/progress/application/use-cases/get-module-progress-summary.usecase";
import { GetProgressOverviewUseCase } from "@/features/progress/application/use-cases/get-progress-overview.usecase";
import { GetSkillsUseCase } from "@/features/progress/application/use-cases/get-skills.usecase";
import { GetUserAchievementsUseCase } from "@/features/progress/application/use-cases/get-user-achievements.usecase";
import { RecordLessonProgressUseCase } from "@/features/progress/application/use-cases/record-lesson-progress.usecase";
import { RecordPageViewUseCase } from "@/features/progress/application/use-cases/record-page-view.usecase";
import { UpdateStepProgressUseCase } from "@/features/progress/application/use-cases/update-step-progress.usecase";
import {
  type LearningProgressReport,
  type LevelLearningProgress,
  type ModuleLearningProgress,
  type PageViewResult,
  type SectionLearningProgress,
} from "@/features/progress/domain/read-models/learning-progress.read-model";
import {
  type LessonProgressDetails,
  type LessonProgressView,
  type ModuleProgressSummary,
  type ProgressOverview,
  type UnlockedAchievementView,
} from "@/features/progress/domain/read-models/progress-views.read-model";
import { AchievementsDTO, MilestonesDTO, SkillsDTO } from "@/features/progress/presentation/dtos/achievement.dto";
import {
  LearningProgressSummaryDTO,
  LevelLearningProgressDTO,
  ModuleLearningProgressDTO,
  PageViewResultDTO,
  SectionLearningProgressDTO,
} from "@/features/progress/presentation/dtos/learning-progress.dto";
import { ProgressOverviewDTO } from "@/features/progress/presentation/dtos/progress-overview.dto";
import {
  LessonProgressDetailsQueryDTO,
  ProgressLessonQueryDTO,
  UpdateLessonProgressDTO,
  UpdateStepProgressDTO,
} from "@/features/progress/presentation/dtos/progress-request.dto";
import { LessonProgressDetailsDTO, LessonProgressDTO, ModuleProgressSummaryDTO, ProgressResumeDTO } from "@/features/progress/presentation/dtos/progress.dto";
import { LearningProgressMapper } from "@/features/progress/presentation/mappers/learning-progress.mapper";
import { ProgressMapper } from "@/features/progress/presentation/mappers/progress.mapper";

const PAGE_MANAGE_PERMISSION: string = "pages:update";

@ApiTags("Progress")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("api/progress")
export class ProgressController {
  public constructor(
    private readonly _getProgressOverviewUseCase: GetProgressOverviewUseCase,
    private readonly _getModuleProgressSummaryUseCase: GetModuleProgressSummaryUseCase,
    private readonly _getLessonProgressUseCase: GetLessonProgressUseCase,
    private readonly _recordLessonProgressUseCase: RecordLessonProgressUseCase,
    private readonly _updateStepProgressUseCase: UpdateStepProgressUseCase,
    private readonly _getModuleResumeUseCase: GetModuleResumeUseCase,
    private readonly _getLessonProgressDetailsUseCase: GetLessonProgressDetailsUseCase,
    private readonly _getMilestonesUseCase: GetMilestonesUseCase,
    private readonly _getUserAchievementsUseCase: GetUserAchievementsUseCase,
    private readonly _getSkillsUseCase: GetSkillsUseCase,
    private readonly _recordPageViewUseCase: RecordPageViewUseCase,
    private readonly _learningProgressFacade: LearningProgressFacade,
  ) {}

  @Get("overview")
  @RequirePermissions("progress:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get progress overview", description: "Returns the student dashboard: statistics, modules, lessons and levels with their progress" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Progress overview retrieved successfully", type: ProgressOverviewDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getProgressOverview(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<ProgressOverviewDTO>> {
    const overview: ProgressOverview = await this._getProgressOverviewUseCase.execute(currentUser.sub);

    return new APIResponseBuilder<ProgressOverviewDTO>()
      .setData(ProgressMapper.toProgressOverviewDTO(overview))
      .setMessage(await i18n.t("progress.overview_retrieved"))
      .build();
  }

  @Get("module/:moduleId")
  @RequirePermissions("progress:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get module progress summary",
    description: "Returns the stored module progress, calculates it on the first visit, or aggregates a composite curriculum module",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Module progress retrieved successfully", type: ModuleProgressSummaryDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getProgressModuleSummary(
    @Param("moduleId") moduleId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ModuleProgressSummaryDTO>> {
    const summary: ModuleProgressSummary = await this._getModuleProgressSummaryUseCase.execute(currentUser.sub, moduleId);

    return new APIResponseBuilder<ModuleProgressSummaryDTO>()
      .setData(ProgressMapper.toModuleProgressSummaryDTO(summary))
      .setMessage(await i18n.t("progress.module_progress_retrieved"))
      .build();
  }

  @Get("lesson/:lessonId")
  @RequirePermissions("progress:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get lesson progress", description: "Returns the lesson progress; legacy lesson IDs are resolved through pages, and unknown IDs return an initial state" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Lesson progress retrieved successfully", type: LessonProgressDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getProgressLesson(
    @Param("lessonId") lessonId: string,
    @Query() query: ProgressLessonQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<LessonProgressDTO>> {
    const view: LessonProgressView = await this._getLessonProgressUseCase.execute(currentUser.sub, lessonId, query.moduleId);

    return new APIResponseBuilder<LessonProgressDTO>()
      .setData(ProgressMapper.toLessonProgressDTO(view))
      .setMessage(await i18n.t("progress.lesson_progress_retrieved"))
      .build();
  }

  @Put("lesson/:lessonId")
  @RequirePermissions("progress:update_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Update lesson progress",
    description: "Records lesson progress; with currentStep and totalSteps it tracks the step, otherwise it updates time, scores and completion without reverting a completed lesson",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Lesson progress updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async updateProgressLesson(
    @Param("lessonId") lessonId: string,
    @Query() query: ProgressLessonQueryDTO,
    @Body() dto: UpdateLessonProgressDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._recordLessonProgressUseCase.execute(
      new RecordLessonProgressCommand({
        userId: currentUser.sub,
        lessonReference: lessonId,
        moduleIdHint: query.moduleId,
        completed: dto.completed ?? false,
        timeSpent: dto.timeSpent ?? 0,
        currentStep: dto.currentStep,
        totalSteps: dto.totalSteps,
        quizScore: dto.quizScore,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("progress.lesson_progress_updated"))
      .build();
  }

  @Post("step/update")
  @RequirePermissions("progress:update_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update step progress", description: "Records the step the user navigated to for resuming; it never completes a lesson, lessons are completed by viewing their pages" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Step progress updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Lesson not found" })
  public async updateProgressStep(
    @Body() dto: UpdateStepProgressDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updateStepProgressUseCase.execute(
      new UpdateStepProgressCommand({
        userId: currentUser.sub,
        moduleId: dto.moduleId,
        lessonId: dto.lessonId,
        currentStepIndex: dto.currentStepIndex,
        totalSteps: dto.totalSteps,
        timeSpentDelta: dto.timeSpentDelta ?? 0,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("progress.step_progress_updated"))
      .build();
  }

  @Get("resume/:moduleId")
  @RequirePermissions("progress:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get module resume state", description: "Returns the first incomplete active lesson of the module and the step to resume at" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Resume state retrieved successfully", type: ProgressResumeDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Module has no active lessons" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Module not found" })
  public async getProgressResume(
    @Param("moduleId") moduleId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ProgressResumeDTO>> {
    const state: ModuleResumeState = await this._getModuleResumeUseCase.execute(currentUser.sub, moduleId);

    return new APIResponseBuilder<ProgressResumeDTO>()
      .setData(ProgressMapper.toProgressResumeDTO(state))
      .setMessage(await i18n.t("progress.resume_retrieved"))
      .build();
  }

  @Get("lesson/:lessonId/details")
  @RequirePermissions("progress:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get lesson progress details", description: "Returns the step-level progress of a lesson within a module" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Lesson progress details retrieved successfully", type: LessonProgressDetailsDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Module not found" })
  public async getProgressLessonDetails(
    @Param("lessonId") lessonId: string,
    @Query() query: LessonProgressDetailsQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<LessonProgressDetailsDTO>> {
    const details: LessonProgressDetails = await this._getLessonProgressDetailsUseCase.execute(currentUser.sub, query.moduleId, lessonId);

    return new APIResponseBuilder<LessonProgressDetailsDTO>()
      .setData(ProgressMapper.toLessonProgressDetailsDTO(details))
      .setMessage(await i18n.t("progress.lesson_details_retrieved"))
      .build();
  }

  @Get("milestones")
  @RequirePermissions("progress:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get progress milestones", description: "Returns the user milestones" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Milestones retrieved successfully", type: MilestonesDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getProgressMilestones(@I18n() i18n: I18nContext): Promise<APIResponse<MilestonesDTO>> {
    return new APIResponseBuilder<MilestonesDTO>()
      .setData(ProgressMapper.toMilestonesDTO(this._getMilestonesUseCase.execute()))
      .setMessage(await i18n.t("progress.milestones_retrieved"))
      .build();
  }

  @Get("achievements")
  @RequirePermissions("progress:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get progress achievements", description: "Returns the achievements unlocked by the current user, newest first" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Achievements retrieved successfully", type: AchievementsDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getProgressAchievements(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<AchievementsDTO>> {
    const achievements: UnlockedAchievementView[] = await this._getUserAchievementsUseCase.execute(currentUser.sub);

    return new APIResponseBuilder<AchievementsDTO>()
      .setData(ProgressMapper.toAchievementsDTO(achievements))
      .setMessage(await i18n.t("progress.achievements_retrieved"))
      .build();
  }

  @Get("skills")
  @RequirePermissions("progress:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get progress skills", description: "Returns the user skills and competence categories" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Skills retrieved successfully", type: SkillsDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getProgressSkills(@I18n() i18n: I18nContext): Promise<APIResponse<SkillsDTO>> {
    return new APIResponseBuilder<SkillsDTO>()
      .setData(ProgressMapper.toSkillsDTO(this._getSkillsUseCase.execute()))
      .setMessage(await i18n.t("progress.skills_retrieved"))
      .build();
  }

  @Post("pages/:pageId/view")
  @RequirePermissions("progress:update_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Record a page view",
    description: "Idempotently records that the current user viewed a page; viewing every published page of a lesson completes it. Students only reach published pages with published ancestors",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Page view recorded successfully", type: PageViewResultDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Page not found" })
  public async recordPageView(
    @Param("pageId") pageId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<PageViewResultDTO>> {
    const result: PageViewResult = await this._recordPageViewUseCase.execute(
      new RecordPageViewCommand({ userId: currentUser.sub, pageId, canManage: canManageContent(currentUser.permissions, PAGE_MANAGE_PERMISSION) }),
    );

    return new APIResponseBuilder<PageViewResultDTO>()
      .setData(LearningProgressMapper.toPageViewResultDTO(result))
      .setMessage(await i18n.t("progress.page_view_recorded"))
      .build();
  }

  @Get("summary")
  @RequirePermissions("progress:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get learning progress summary", description: "Returns the lesson-weighted progress of the current user over all published sections, levels and modules" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Learning progress summary retrieved successfully", type: LearningProgressSummaryDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getLearningProgressSummary(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<LearningProgressSummaryDTO>> {
    const report: LearningProgressReport = await this._learningProgressFacade.getSummary(currentUser.sub);

    return new APIResponseBuilder<LearningProgressSummaryDTO>()
      .setData(LearningProgressMapper.toLearningProgressSummaryDTO(report))
      .setMessage(await i18n.t("progress.learning_summary_retrieved"))
      .build();
  }

  @Get("modules/:moduleId")
  @RequirePermissions("progress:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get module learning progress", description: "Returns completed lessons over published lessons of the module, with the viewed pages of each lesson" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Module learning progress retrieved successfully", type: ModuleLearningProgressDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Module not found or not published" })
  public async getModuleLearningProgress(
    @Param("moduleId") moduleId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ModuleLearningProgressDTO>> {
    const progress: ModuleLearningProgress = await this._learningProgressFacade.getModuleProgress(currentUser.sub, moduleId);

    return new APIResponseBuilder<ModuleLearningProgressDTO>()
      .setData(LearningProgressMapper.toModuleLearningProgressDTO(progress))
      .setMessage(await i18n.t("progress.module_progress_retrieved"))
      .build();
  }

  @Get("levels/:levelId")
  @RequirePermissions("progress:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get level learning progress", description: "Returns completed lessons over published lessons of the level (lesson-weighted), with the progress of each module" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Level learning progress retrieved successfully", type: LevelLearningProgressDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Level not found or not published" })
  public async getLevelLearningProgress(
    @Param("levelId") levelId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<LevelLearningProgressDTO>> {
    const progress: LevelLearningProgress = await this._learningProgressFacade.getLevelProgress(currentUser.sub, levelId);

    return new APIResponseBuilder<LevelLearningProgressDTO>()
      .setData(LearningProgressMapper.toLevelLearningProgressDTO(progress))
      .setMessage(await i18n.t("progress.level_progress_retrieved"))
      .build();
  }

  @Get("sections/:sectionId")
  @RequirePermissions("progress:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get section learning progress", description: "Returns completed lessons over published lessons of the section (lesson-weighted), with the progress of each level" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Section learning progress retrieved successfully", type: SectionLearningProgressDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Section not found or not published" })
  public async getSectionLearningProgress(
    @Param("sectionId") sectionId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<SectionLearningProgressDTO>> {
    const progress: SectionLearningProgress = await this._learningProgressFacade.getSectionProgress(currentUser.sub, sectionId);

    return new APIResponseBuilder<SectionLearningProgressDTO>()
      .setData(LearningProgressMapper.toSectionLearningProgressDTO(progress))
      .setMessage(await i18n.t("progress.section_progress_retrieved"))
      .build();
  }
}
