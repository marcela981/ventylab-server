/*
 * Funcionalidad: Controlador de gamificación
 * Descripción: Expone las rutas propias del estudiante bajo /api/progress que leen el registro de actividad: estadísticas de gamificación (XP, nivel, racha), calendario de actividad por días de America/Bogota y actividad reciente con títulos
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { GetActivityCalendarUseCase } from "@/features/progress/application/use-cases/get-activity-calendar.usecase";
import { GetGamificationStatsUseCase } from "@/features/progress/application/use-cases/get-gamification-stats.usecase";
import { GetRecentActivityUseCase } from "@/features/progress/application/use-cases/get-recent-activity.usecase";
import { type ActivityDay, type GamificationStats, type RecentActivityItem } from "@/features/progress/domain/read-models/gamification.read-model";
import {
  ActivityCalendarDTO,
  ActivityCalendarQueryDTO,
  GamificationStatsDTO,
  RecentActivityItemDTO,
  RecentActivityQueryDTO,
} from "@/features/progress/presentation/dtos/gamification.dto";
import { GamificationMapper } from "@/features/progress/presentation/mappers/gamification.mapper";

@ApiTags("Progress")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("api/progress")
export class GamificationController {
  public constructor(
    private readonly _getGamificationStatsUseCase: GetGamificationStatsUseCase,
    private readonly _getActivityCalendarUseCase: GetActivityCalendarUseCase,
    private readonly _getRecentActivityUseCase: GetRecentActivityUseCase,
  ) {}

  @Get("gamification")
  @RequirePermissions("progress:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get my gamification statistics",
    description: "Returns XP, level, XP inside the level, the XP of the next level, the current and longest streak (America/Bogota days) and today's XP from the activity ledger",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Gamification statistics retrieved successfully", type: GamificationStatsDTO })
  public async getGamification(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<GamificationStatsDTO>> {
    const stats: GamificationStats = await this._getGamificationStatsUseCase.execute(currentUser.sub);

    return new APIResponseBuilder<GamificationStatsDTO>()
      .setData(GamificationMapper.toGamificationStatsDTO(stats))
      .setMessage(await i18n.t("progress.gamification_retrieved"))
      .build();
  }

  @Get("activity")
  @RequirePermissions("progress:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get my activity calendar",
    description: "Returns the America/Bogota days with activity (event count and XP) between from and to, both inclusive, at most 366 days; by default the 366 days ending today",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Activity calendar retrieved successfully", type: ActivityCalendarDTO })
  public async getActivity(
    @Query() query: ActivityCalendarQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ActivityCalendarDTO>> {
    const days: ActivityDay[] = await this._getActivityCalendarUseCase.execute(currentUser.sub, { from: query.from, to: query.to });

    return new APIResponseBuilder<ActivityCalendarDTO>()
      .setData(GamificationMapper.toActivityCalendarDTO(days))
      .setMessage(await i18n.t("progress.activity_retrieved"))
      .build();
  }

  @Get("activity/recent")
  @RequirePermissions("progress:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get my recent activity",
    description: "Returns the latest ledger milestones (lesson and module completions, passed evaluations and unlocked achievements) with the title of the referenced item, newest first",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Recent activity retrieved successfully", type: RecentActivityItemDTO, isArray: true })
  public async getRecentActivity(
    @Query() query: RecentActivityQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<RecentActivityItemDTO[]>> {
    const items: RecentActivityItem[] = await this._getRecentActivityUseCase.execute(currentUser.sub, query.limit);

    return new APIResponseBuilder<RecentActivityItemDTO[]>()
      .setData(items.map((item: RecentActivityItem) => GamificationMapper.toRecentActivityItemDTO(item)))
      .setMessage(await i18n.t("progress.recent_activity_retrieved"))
      .build();
  }
}
