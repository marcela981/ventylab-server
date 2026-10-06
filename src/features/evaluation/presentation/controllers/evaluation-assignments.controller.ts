/*
 * Funcionalidad: Controlador de asignaciones de evaluación (activación)
 * Descripción: Rutas /api/evaluations/:id/assignments para activar una evaluación READY en grupos STUDENT, listar sus asignaciones, editar la ventana, cerrar anticipadamente y borrar, y /api/evaluation-assignments para el listado paginado de gestión; requiere evaluations:assign y el alcance de grupos de GroupsFacade
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { type Paginated } from "@/common/domain/utils/paginated";
import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { CloseEvaluationAssignmentCommand } from "@/features/evaluation/application/commands/close-evaluation-assignment.command";
import { CreateEvaluationAssignmentsCommand } from "@/features/evaluation/application/commands/create-evaluation-assignments.command";
import { DeleteEvaluationAssignmentCommand } from "@/features/evaluation/application/commands/delete-evaluation-assignment.command";
import { UpdateEvaluationAssignmentCommand } from "@/features/evaluation/application/commands/update-evaluation-assignment.command";
import { type EvaluationAssignmentResult } from "@/features/evaluation/application/results/evaluation-assignment.result";
import { CloseEvaluationAssignmentUseCase } from "@/features/evaluation/application/use-cases/close-evaluation-assignment.usecase";
import { CreateEvaluationAssignmentsUseCase } from "@/features/evaluation/application/use-cases/create-evaluation-assignments.usecase";
import { DeleteEvaluationAssignmentUseCase } from "@/features/evaluation/application/use-cases/delete-evaluation-assignment.usecase";
import { GetEvaluationAssignmentsUseCase } from "@/features/evaluation/application/use-cases/get-evaluation-assignments.usecase";
import { GetManagedEvaluationAssignmentsUseCase } from "@/features/evaluation/application/use-cases/get-managed-evaluation-assignments.usecase";
import { UpdateEvaluationAssignmentUseCase } from "@/features/evaluation/application/use-cases/update-evaluation-assignment.usecase";
import { type EvaluationAssignmentStateValue } from "@/features/evaluation/domain/value-objects/evaluation-assignment-state";
import {
  CreateEvaluationAssignmentsDTO,
  GetEvaluationAssignmentsQueryDTO,
  UpdateEvaluationAssignmentDTO,
} from "@/features/evaluation/presentation/dtos/evaluation-assignment-request.dto";
import { EvaluationAssignmentDTO, EvaluationAssignmentIdsDTO } from "@/features/evaluation/presentation/dtos/evaluation-assignment.dto";
import { EvaluationAssignmentsMapper } from "@/features/evaluation/presentation/mappers/evaluation-assignments.mapper";
import { type CurrentCaller, toEvaluationActor } from "@/features/evaluation/presentation/types/current-caller";

@ApiTags("Evaluation assignments")
@ApiBearerAuth("JWT-auth")
@Controller("api")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EvaluationAssignmentsController {
  public constructor(
    private readonly _createEvaluationAssignmentsUseCase: CreateEvaluationAssignmentsUseCase,
    private readonly _getEvaluationAssignmentsUseCase: GetEvaluationAssignmentsUseCase,
    private readonly _getManagedEvaluationAssignmentsUseCase: GetManagedEvaluationAssignmentsUseCase,
    private readonly _updateEvaluationAssignmentUseCase: UpdateEvaluationAssignmentUseCase,
    private readonly _closeEvaluationAssignmentUseCase: CloseEvaluationAssignmentUseCase,
    private readonly _deleteEvaluationAssignmentUseCase: DeleteEvaluationAssignmentUseCase,
  ) {}

  @Post("evaluations/:id/assignments")
  @RequirePermissions("evaluations:assign")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Activate evaluation",
    description:
      "Activates a READY evaluation for one or more active STUDENT groups the caller manages (admins: any group) inside [startsAt, endsAt]; all or nothing; notifies each group with evaluation:activated",
  })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Evaluation activated successfully", type: EvaluationAssignmentIdsDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller does not manage one of the groups" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The evaluation is not READY or a group already has an overlapping assignment" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Invalid window or a group is missing, not a STUDENT group or inactive" })
  public async createAssignments(
    @Param("id") id: string,
    @Body() dto: CreateEvaluationAssignmentsDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<EvaluationAssignmentIdsDTO>> {
    const ids: string[] = await this._createEvaluationAssignmentsUseCase.execute(
      new CreateEvaluationAssignmentsCommand({
        evaluationId: id,
        actor: toEvaluationActor(currentUser),
        groupIds: dto.groupIds,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
      }),
    );

    return new APIResponseBuilder<EvaluationAssignmentIdsDTO>()
      .setData(new EvaluationAssignmentIdsDTO({ ids }))
      .setMessage(await i18n.t("evaluation.assignments_created"))
      .build();
  }

  @Get("evaluations/:id/assignments")
  @RequirePermissions("evaluations:assign")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get evaluation assignments",
    description: "Assignments of an evaluation in the groups the caller manages (admins: all) with group name, derived state and attempt counts by status",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Assignments retrieved successfully", type: EvaluationAssignmentDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation not found" })
  public async getEvaluationAssignments(
    @Param("id") id: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<EvaluationAssignmentDTO[]>> {
    const results: EvaluationAssignmentResult[] = await this._getEvaluationAssignmentsUseCase.execute(id, toEvaluationActor(currentUser));

    return new APIResponseBuilder<EvaluationAssignmentDTO[]>()
      .setData(results.map((result: EvaluationAssignmentResult) => EvaluationAssignmentsMapper.toDTO(result)))
      .setMessage(await i18n.t("evaluation.assignments_retrieved"))
      .build();
  }

  @Patch("evaluations/:id/assignments/:assignmentId")
  @RequirePermissions("evaluations:assign")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Update evaluation assignment window",
    description: "UPCOMING: startsAt and endsAt may change; ACTIVE: only endsAt, never before now; CLOSED: immutable (409)",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Assignment updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller does not manage the assignment group" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Assignment not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The assignment is closed or the new window overlaps another assignment" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Invalid window" })
  public async updateAssignment(
    @Param("id") id: string,
    @Param("assignmentId") assignmentId: string,
    @Body() dto: UpdateEvaluationAssignmentDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updateEvaluationAssignmentUseCase.execute(
      new UpdateEvaluationAssignmentCommand({
        evaluationId: id,
        assignmentId,
        actor: toEvaluationActor(currentUser),
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
      }),
    );

    return new APIResponseBuilder<null>().setMessage(await i18n.t("evaluation.assignment_updated")).build();
  }

  @Post("evaluations/:id/assignments/:assignmentId/close")
  @RequirePermissions("evaluations:assign")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Close evaluation assignment", description: "Closes an UPCOMING or ACTIVE assignment now (endsAt = now)" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Assignment closed successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller does not manage the assignment group" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Assignment not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The assignment is already closed" })
  public async closeAssignment(
    @Param("id") id: string,
    @Param("assignmentId") assignmentId: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._closeEvaluationAssignmentUseCase.execute(
      new CloseEvaluationAssignmentCommand({ evaluationId: id, assignmentId, actor: toEvaluationActor(currentUser) }),
    );

    return new APIResponseBuilder<null>().setMessage(await i18n.t("evaluation.assignment_closed_successfully")).build();
  }

  @Delete("evaluations/:id/assignments/:assignmentId")
  @RequirePermissions("evaluations:assign")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete evaluation assignment", description: "Deletes an assignment without attempts; with attempts close it instead (409)" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Assignment deleted successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller does not manage the assignment group" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Assignment not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The assignment has attempts" })
  public async deleteAssignment(
    @Param("id") id: string,
    @Param("assignmentId") assignmentId: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._deleteEvaluationAssignmentUseCase.execute(
      new DeleteEvaluationAssignmentCommand({ evaluationId: id, assignmentId, actor: toEvaluationActor(currentUser) }),
    );

    return new APIResponseBuilder<null>().setMessage(await i18n.t("evaluation.assignment_deleted")).build();
  }

  @Get("evaluation-assignments")
  @RequirePermissions("evaluations:assign")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get managed evaluation assignments",
    description: "Paginated assignments in the groups the caller manages (admins: all), filtered by group, evaluation and derived state; sorted by startsAt (desc by default)",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Assignments retrieved successfully", type: EvaluationAssignmentDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller does not manage the requested group" })
  public async getManagedAssignments(
    @Query() query: GetEvaluationAssignmentsQueryDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<EvaluationAssignmentDTO[]>> {
    const result: Paginated<EvaluationAssignmentResult> = await this._getManagedEvaluationAssignmentsUseCase.execute(
      {
        page: Number(query.page),
        limit: Number(query.limit),
        ids: query.ids,
        createdAtFrom: query.createdAtFrom,
        createdAtTo: query.createdAtTo,
        sortOrder: query.sortOrder,
        groupId: query.groupId,
        evaluationId: query.evaluationId,
        state: query.state as EvaluationAssignmentStateValue | undefined,
      },
      toEvaluationActor(currentUser),
    );

    return new APIResponseBuilder<EvaluationAssignmentDTO[]>()
      .setData(result.data.map((item: EvaluationAssignmentResult) => EvaluationAssignmentsMapper.toDTO(item)))
      .setMessage(await i18n.t("evaluation.assignments_retrieved"))
      .setPagination(result.pagination)
      .build();
  }
}
