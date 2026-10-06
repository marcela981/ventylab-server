/*
 * Funcionalidad: Controlador de asignaciones de actividades
 * Descripción: Endpoints autenticados de /api/activity-assignments para docentes: listado por actividad, asignación (o actualización) a un grupo y retiro de una asignación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { AssignActivityCommand } from "@/features/activities/application/commands/assign-activity.command";
import { RemoveActivityAssignmentCommand } from "@/features/activities/application/commands/remove-activity-assignment.command";
import { AssignActivityUseCase } from "@/features/activities/application/use-cases/assign-activity.usecase";
import { GetActivityAssignmentsUseCase } from "@/features/activities/application/use-cases/get-activity-assignments.usecase";
import { RemoveActivityAssignmentUseCase } from "@/features/activities/application/use-cases/remove-activity-assignment.usecase";
import { type ActivityAssignmentView } from "@/features/activities/domain/read-models/activity.read-model";
import { AssignActivityDTO, GetActivityAssignmentsQueryDTO } from "@/features/activities/presentation/dtos/activity-assignment-request.dto";
import { ActivityAssignmentDTO, ResourceIdDTO } from "@/features/activities/presentation/dtos/activity.dto";
import { ActivitiesMapper } from "@/features/activities/presentation/mappers/activities.mapper";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";

@ApiTags("Activity assignments")
@ApiBearerAuth("JWT-auth")
@Controller("api/activity-assignments")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ActivityAssignmentsController {
  public constructor(
    private readonly _getActivityAssignmentsUseCase: GetActivityAssignmentsUseCase,
    private readonly _assignActivityUseCase: AssignActivityUseCase,
    private readonly _removeActivityAssignmentUseCase: RemoveActivityAssignmentUseCase,
  ) {}

  @Get()
  @RequirePermissions("activity-assignments:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get activity assignments", description: "Active assignments of an activity with basic group data, newest first" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Assignments retrieved successfully", type: ActivityAssignmentDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "activityId is required" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getActivityAssignments(
    @Query() query: GetActivityAssignmentsQueryDTO,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ActivityAssignmentDTO[]>> {
    const views: ActivityAssignmentView[] = await this._getActivityAssignmentsUseCase.execute(query.activityId);

    return new APIResponseBuilder<ActivityAssignmentDTO[]>()
      .setData(ActivitiesMapper.toAssignmentViewDTOList(views))
      .setMessage(await i18n.t("activities.assignments_retrieved"))
      .build();
  }

  @Post()
  @RequirePermissions("activity-assignments:create")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Assign activity to group",
    description: "Assigns an active activity to an active group, or updates the existing assignment of that pair; returns the assignment ID",
  })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Activity assigned successfully", type: ResourceIdDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Not the activity creator" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Activity or group not found" })
  public async assignActivity(
    @Body() dto: AssignActivityDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ResourceIdDTO>> {
    const id: string = await this._assignActivityUseCase.execute(
      new AssignActivityCommand({
        activityId: dto.activityId,
        groupId: dto.groupId,
        visibleFrom: dto.visibleFrom,
        dueDate: dto.dueDate,
        isActive: dto.isActive,
        performedBy: currentUser.sub,
        requesterRole: currentUser.role,
      }),
    );

    return new APIResponseBuilder<ResourceIdDTO>()
      .setData(new ResourceIdDTO({ id }))
      .setMessage(await i18n.t("activities.activity_assigned"))
      .build();
  }

  @Delete(":id")
  @RequirePermissions("activity-assignments:delete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove activity assignment", description: "Soft deletes an assignment; only who assigned it or an admin can do it" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Assignment removed successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Not the assignment creator" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Assignment not found" })
  public async removeActivityAssignment(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._removeActivityAssignmentUseCase.execute(
      new RemoveActivityAssignmentCommand({ assignmentId: id, performedBy: currentUser.sub, requesterRole: currentUser.role }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("activities.assignment_removed"))
      .build();
  }
}
