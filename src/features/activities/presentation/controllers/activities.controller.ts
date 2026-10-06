/*
 * Funcionalidad: Controlador de actividades
 * Descripción: Endpoints autenticados de /api/activities: listado según rol, catálogo (antes /api/evaluation/activities), detalle, creación, edición, desactivación y publicación por docentes, y entregas de una actividad
 * Versión: 1.0
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
import { CreateActivityCommand } from "@/features/activities/application/commands/create-activity.command";
import { DeleteActivityCommand } from "@/features/activities/application/commands/delete-activity.command";
import { PublishActivityCommand } from "@/features/activities/application/commands/publish-activity.command";
import { UpdateActivityCommand } from "@/features/activities/application/commands/update-activity.command";
import { CreateActivityUseCase } from "@/features/activities/application/use-cases/create-activity.usecase";
import { DeleteActivityUseCase } from "@/features/activities/application/use-cases/delete-activity.usecase";
import { GetActivitiesUseCase } from "@/features/activities/application/use-cases/get-activities.usecase";
import { GetActivityByIdUseCase } from "@/features/activities/application/use-cases/get-activity-by-id.usecase";
import { GetActivityCatalogItemUseCase } from "@/features/activities/application/use-cases/get-activity-catalog-item.usecase";
import { GetActivityCatalogUseCase } from "@/features/activities/application/use-cases/get-activity-catalog.usecase";
import { GetActivitySubmissionsUseCase } from "@/features/activities/application/use-cases/get-activity-submissions.usecase";
import { PublishActivityUseCase } from "@/features/activities/application/use-cases/publish-activity.usecase";
import { UpdateActivityUseCase } from "@/features/activities/application/use-cases/update-activity.usecase";
import { type Activity } from "@/features/activities/domain/entities/activity.entity";
import {
  type ActivityDetailView,
  type ActivityListItemView,
  type ActivitySubmissionView,
} from "@/features/activities/domain/read-models/activity.read-model";
import { type ActivityTypeValue } from "@/features/activities/domain/value-objects/activity-type";
import {
  CreateActivityDTO,
  GetActivityCatalogQueryDTO,
  GetActivitySubmissionsQueryDTO,
  UpdateActivityDTO,
} from "@/features/activities/presentation/dtos/activity-request.dto";
import { ActivitySubmissionDTO } from "@/features/activities/presentation/dtos/activity-submission.dto";
import { ActivityDetailDTO, ActivityDTO, ActivityListItemDTO, ResourceIdDTO } from "@/features/activities/presentation/dtos/activity.dto";
import { ActivitiesMapper } from "@/features/activities/presentation/mappers/activities.mapper";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";

@ApiTags("Activities")
@ApiBearerAuth("JWT-auth")
@Controller("api/activities")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ActivitiesController {
  public constructor(
    private readonly _getActivitiesUseCase: GetActivitiesUseCase,
    private readonly _getActivityCatalogUseCase: GetActivityCatalogUseCase,
    private readonly _getActivityCatalogItemUseCase: GetActivityCatalogItemUseCase,
    private readonly _getActivityByIdUseCase: GetActivityByIdUseCase,
    private readonly _createActivityUseCase: CreateActivityUseCase,
    private readonly _updateActivityUseCase: UpdateActivityUseCase,
    private readonly _deleteActivityUseCase: DeleteActivityUseCase,
    private readonly _publishActivityUseCase: PublishActivityUseCase,
    private readonly _getActivitySubmissionsUseCase: GetActivitySubmissionsUseCase,
  ) {}

  @Get()
  @RequirePermissions("activities:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get activities",
    description: "Students get the published activities assigned to their groups with their submissions; teachers and admins get the active activities they created",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Activities retrieved successfully", type: ActivityListItemDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async getActivities(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<ActivityListItemDTO[]>> {
    const views: ActivityListItemView[] = await this._getActivitiesUseCase.execute(currentUser.sub, currentUser.role);

    return new APIResponseBuilder<ActivityListItemDTO[]>()
      .setData(views.map((view: ActivityListItemView) => ActivitiesMapper.toListItemDTO(view)))
      .setMessage(await i18n.t("activities.activities_retrieved"))
      .build();
  }

  @Get("catalog")
  @RequirePermissions("activities:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get activity catalog", description: "Active activities, oldest first, optionally filtered by type; students only see published ones" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Activity catalog retrieved successfully", type: ActivityDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async getActivityCatalog(
    @Query() query: GetActivityCatalogQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ActivityDTO[]>> {
    const activities: Activity[] = await this._getActivityCatalogUseCase.execute(currentUser.role, query.type as ActivityTypeValue | undefined);

    return new APIResponseBuilder<ActivityDTO[]>()
      .setData(ActivitiesMapper.toDTOList(activities))
      .setMessage(await i18n.t("activities.activities_retrieved"))
      .build();
  }

  @Get("catalog/:id")
  @RequirePermissions("activities:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get activity catalog item", description: "An active activity of the catalog; students only access published ones" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Activity retrieved successfully", type: ActivityDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Activity not available" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Activity not found" })
  public async getActivityCatalogItem(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ActivityDTO>> {
    const activity: Activity = await this._getActivityCatalogItemUseCase.execute(id, currentUser.role);

    return new APIResponseBuilder<ActivityDTO>()
      .setData(ActivitiesMapper.toDTO(activity))
      .setMessage(await i18n.t("activities.activity_retrieved"))
      .build();
  }

  @Post()
  @RequirePermissions("activities:create")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create activity", description: "Creates an unpublished activity owned by the authenticated teacher and returns its ID" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Activity created successfully", type: ResourceIdDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async createActivity(
    @Body() dto: CreateActivityDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ResourceIdDTO>> {
    const id: string = await this._createActivityUseCase.execute(
      new CreateActivityCommand({
        title: dto.title,
        description: dto.description ?? undefined,
        instructions: dto.instructions ?? undefined,
        type: dto.type as ActivityTypeValue,
        maxScore: dto.maxScore,
        timeLimit: dto.timeLimit ?? undefined,
        dueDate: dto.dueDate ?? undefined,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<ResourceIdDTO>()
      .setData(new ResourceIdDTO({ id }))
      .setMessage(await i18n.t("activities.activity_created"))
      .build();
  }

  @Get(":id")
  @RequirePermissions("activities:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get activity by ID", description: "Activity detail with its active assignments; students must be assigned through a group" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Activity retrieved successfully", type: ActivityDetailDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Access denied" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Activity not found" })
  public async getActivityById(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ActivityDetailDTO>> {
    const view: ActivityDetailView = await this._getActivityByIdUseCase.execute(id, currentUser.sub, currentUser.role);

    return new APIResponseBuilder<ActivityDetailDTO>()
      .setData(ActivitiesMapper.toDetailDTO(view))
      .setMessage(await i18n.t("activities.activity_retrieved"))
      .build();
  }

  @Put(":id")
  @RequirePermissions("activities:update")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update activity", description: "Updates the sent fields; only the creator or an admin can do it" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Activity updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Not the activity creator" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Activity not found" })
  public async updateActivity(
    @Param("id") id: string,
    @Body() dto: UpdateActivityDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updateActivityUseCase.execute(
      new UpdateActivityCommand({
        activityId: id,
        changes: ActivitiesMapper.toChanges(dto),
        performedBy: currentUser.sub,
        requesterRole: currentUser.role,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("activities.activity_updated"))
      .build();
  }

  @Delete(":id")
  @RequirePermissions("activities:delete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Deactivate activity", description: "Soft deletes an activity; only the creator or an admin can do it" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Activity deactivated successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Not the activity creator" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Activity not found" })
  public async deleteActivity(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._deleteActivityUseCase.execute(
      new DeleteActivityCommand({ activityId: id, performedBy: currentUser.sub, requesterRole: currentUser.role }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("activities.activity_deactivated"))
      .build();
  }

  @Post(":id/publish")
  @RequirePermissions("activities:publish")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Publish activity", description: "Publishes an activity (no effect if already published); only the creator or an admin can do it" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Activity published successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Not the activity creator" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Activity not found" })
  public async publishActivity(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._publishActivityUseCase.execute(
      new PublishActivityCommand({ activityId: id, performedBy: currentUser.sub, requesterRole: currentUser.role }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("activities.activity_published"))
      .build();
  }

  @Get(":id/submissions")
  @RequirePermissions("activity-submissions:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get activity submissions", description: "Submissions of an activity, optionally of one group, with student and grader" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Submissions retrieved successfully", type: ActivitySubmissionDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getActivitySubmissions(
    @Param("id") id: string,
    @Query() query: GetActivitySubmissionsQueryDTO,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ActivitySubmissionDTO[]>> {
    const views: ActivitySubmissionView[] = await this._getActivitySubmissionsUseCase.execute(id, query.groupId || undefined);

    return new APIResponseBuilder<ActivitySubmissionDTO[]>()
      .setData(ActivitiesMapper.toSubmissionViewDTOList(views))
      .setMessage(await i18n.t("activities.submissions_retrieved"))
      .build();
  }
}
