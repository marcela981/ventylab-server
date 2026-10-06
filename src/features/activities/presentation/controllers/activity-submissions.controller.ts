/*
 * Funcionalidad: Controlador de entregas de actividades
 * Descripción: Endpoints autenticados de /api/activity-submissions: entregas propias, inicio, borrador y envío por estudiantes, detalle (propio o docente), calificación y reinicio por docentes
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { GradeSubmissionCommand } from "@/features/activities/application/commands/grade-submission.command";
import { ResetSubmissionCommand } from "@/features/activities/application/commands/reset-submission.command";
import { SaveSubmissionDraftCommand } from "@/features/activities/application/commands/save-submission-draft.command";
import { StartSubmissionCommand } from "@/features/activities/application/commands/start-submission.command";
import { SubmitSubmissionCommand } from "@/features/activities/application/commands/submit-submission.command";
import { GetMySubmissionForActivityUseCase } from "@/features/activities/application/use-cases/get-my-submission-for-activity.usecase";
import { GetMySubmissionsUseCase } from "@/features/activities/application/use-cases/get-my-submissions.usecase";
import { GetSubmissionByIdUseCase } from "@/features/activities/application/use-cases/get-submission-by-id.usecase";
import { GradeSubmissionUseCase } from "@/features/activities/application/use-cases/grade-submission.usecase";
import { ResetSubmissionUseCase } from "@/features/activities/application/use-cases/reset-submission.usecase";
import { SaveSubmissionDraftUseCase } from "@/features/activities/application/use-cases/save-submission-draft.usecase";
import { StartSubmissionUseCase } from "@/features/activities/application/use-cases/start-submission.usecase";
import { SubmitSubmissionUseCase } from "@/features/activities/application/use-cases/submit-submission.usecase";
import { type ActivitySubmission } from "@/features/activities/domain/entities/activity-submission.entity";
import { type ActivitySubmissionView } from "@/features/activities/domain/read-models/activity.read-model";
import {
  GradeSubmissionDTO,
  SaveSubmissionDraftDTO,
  StartSubmissionDTO,
} from "@/features/activities/presentation/dtos/activity-submission-request.dto";
import { ActivitySubmissionDTO } from "@/features/activities/presentation/dtos/activity-submission.dto";
import { ActivitiesMapper } from "@/features/activities/presentation/mappers/activities.mapper";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";

@ApiTags("Activity submissions")
@ApiBearerAuth("JWT-auth")
@Controller("api/activity-submissions")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ActivitySubmissionsController {
  public constructor(
    private readonly _getMySubmissionsUseCase: GetMySubmissionsUseCase,
    private readonly _getMySubmissionForActivityUseCase: GetMySubmissionForActivityUseCase,
    private readonly _getSubmissionByIdUseCase: GetSubmissionByIdUseCase,
    private readonly _startSubmissionUseCase: StartSubmissionUseCase,
    private readonly _saveSubmissionDraftUseCase: SaveSubmissionDraftUseCase,
    private readonly _submitSubmissionUseCase: SubmitSubmissionUseCase,
    private readonly _gradeSubmissionUseCase: GradeSubmissionUseCase,
    private readonly _resetSubmissionUseCase: ResetSubmissionUseCase,
  ) {}

  @Get("my")
  @RequirePermissions("activity-submissions:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get my submissions", description: "Submissions of the authenticated user with basic activity data, most recently updated first" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Submissions retrieved successfully", type: ActivitySubmissionDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async getMySubmissions(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<ActivitySubmissionDTO[]>> {
    const views: ActivitySubmissionView[] = await this._getMySubmissionsUseCase.execute(currentUser.sub);

    return new APIResponseBuilder<ActivitySubmissionDTO[]>()
      .setData(ActivitiesMapper.toSubmissionViewDTOList(views))
      .setMessage(await i18n.t("activities.submissions_retrieved"))
      .build();
  }

  @Get("for-activity/:activityId")
  @RequirePermissions("activity-submissions:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get my submission for an activity", description: "Submission of the authenticated user for an activity, or null" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Submission retrieved successfully", type: ActivitySubmissionDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async getMySubmissionForActivity(
    @Param("activityId") activityId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ActivitySubmissionDTO | null>> {
    const view: ActivitySubmissionView | undefined = await this._getMySubmissionForActivityUseCase.execute(activityId, currentUser.sub);

    return new APIResponseBuilder<ActivitySubmissionDTO | null>()
      .setData(view ? ActivitiesMapper.toSubmissionViewDTO(view) : null)
      .setMessage(await i18n.t("activities.submission_retrieved"))
      .build();
  }

  @Get(":id")
  @RequirePermissions("activity-submissions:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get submission by ID", description: "Submission with activity, student and grader; students only access their own" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Submission retrieved successfully", type: ActivitySubmissionDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Access denied" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Submission not found" })
  public async getSubmissionById(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ActivitySubmissionDTO>> {
    const view: ActivitySubmissionView = await this._getSubmissionByIdUseCase.execute(id, currentUser.sub, currentUser.role);

    return new APIResponseBuilder<ActivitySubmissionDTO>()
      .setData(ActivitiesMapper.toSubmissionViewDTO(view))
      .setMessage(await i18n.t("activities.submission_retrieved"))
      .build();
  }

  @Post()
  @RequirePermissions("activity-submissions:create_own")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Start submission",
    description: "Starts (or returns the existing draft of) the authenticated student's submission for an activity; returns 409 if already submitted or graded",
  })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Submission started successfully", type: ActivitySubmissionDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Only students, or activity not available or not assigned" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Activity already completed" })
  public async startSubmission(
    @Body() dto: StartSubmissionDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ActivitySubmissionDTO>> {
    const submission: ActivitySubmission = await this._startSubmissionUseCase.execute(
      new StartSubmissionCommand({ activityId: dto.activityId, userId: currentUser.sub, requesterRole: currentUser.role }),
    );

    return new APIResponseBuilder<ActivitySubmissionDTO>()
      .setData(ActivitiesMapper.toSubmissionDTO(submission))
      .setMessage(await i18n.t("activities.submission_started"))
      .build();
  }

  @Put(":id")
  @RequirePermissions("activity-submissions:update_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Save submission draft", description: "Saves the content of the authenticated student's draft submission" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Draft saved successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Only students, or not the owner" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Submission not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Activity already completed" })
  public async saveSubmissionDraft(
    @Param("id") id: string,
    @Body() dto: SaveSubmissionDraftDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._saveSubmissionDraftUseCase.execute(
      new SaveSubmissionDraftCommand({ submissionId: id, userId: currentUser.sub, requesterRole: currentUser.role, content: dto.content }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("activities.submission_draft_saved"))
      .build();
  }

  @Post(":id/submit")
  @RequirePermissions("activity-submissions:update_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Submit submission", description: "Submits the authenticated student's draft; it becomes LATE after the activity due date" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Submission sent successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Only students, or not the owner" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Submission not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Activity already completed" })
  public async submitSubmission(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._submitSubmissionUseCase.execute(
      new SubmitSubmissionCommand({ submissionId: id, userId: currentUser.sub, requesterRole: currentUser.role }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("activities.submission_submitted"))
      .build();
  }

  @Put(":id/grade")
  @RequirePermissions("activity-submissions:grade")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Grade submission", description: "Grades a submitted submission; the grade is also recorded in the scores table" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Submission graded successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error, draft submission or score out of range" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Submission not found" })
  public async gradeSubmission(
    @Param("id") id: string,
    @Body() dto: GradeSubmissionDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._gradeSubmissionUseCase.execute(
      new GradeSubmissionCommand({ submissionId: id, graderId: currentUser.sub, score: dto.score, feedback: dto.feedback ?? undefined }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("activities.submission_graded"))
      .build();
  }

  @Delete(":id/reset")
  @RequirePermissions("activity-submissions:reset")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset submission", description: "Deletes a student's submission so the activity can be attempted again" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Attempt reset successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Submission not found" })
  public async resetSubmission(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._resetSubmissionUseCase.execute(new ResetSubmissionCommand({ submissionId: id, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("activities.submission_reset"))
      .build();
  }
}
