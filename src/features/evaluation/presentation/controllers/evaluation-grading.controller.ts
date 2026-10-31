/*
 * Funcionalidad: Controlador de calificación de evaluaciones
 * Descripción: Rutas /api/evaluation-grading del profesor o administrador con el permiso evaluations:grade: cola paginada de intentos PENDING_REVIEW en su alcance filtrable por evaluación, grupo o estudiante (cierra antes los intentos vencidos) y su conteo, lista paginada de todos los intentos no heredados de una evaluación filtrable por grupo y estados con conteos por estado, reinicio no destructivo del intento de un estudiante (concede un intento más, auditado y notificado), notas publicadas de un estudiante de sus grupos, vista de calificación de un intento, calificación manual de una pregunta (comentario obligatorio al sobrescribir, auditado), publicación idempotente de una nota y publicación masiva de una evaluación o grupo
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

import { type Paginated } from "@/common/domain/utils/paginated";
import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { GradeEvaluationAnswerCommand } from "@/features/evaluation/application/commands/grade-evaluation-answer.command";
import { PublishEvaluationGradesCommand } from "@/features/evaluation/application/commands/publish-evaluation-grades.command";
import { ResetEvaluationAttemptCommand } from "@/features/evaluation/application/commands/reset-evaluation-attempt.command";
import {
  type EvaluationUserGrade,
  type GradeEvaluationAnswerResult,
  type GradingAttemptDetailResult,
  type PublishEvaluationAttemptGradeResult,
} from "@/features/evaluation/application/results/evaluation-grading.result";
import { GetAttemptForGradingUseCase } from "@/features/evaluation/application/use-cases/get-attempt-for-grading.usecase";
import { type EvaluationAttemptsPage, GetEvaluationAttemptsUseCase } from "@/features/evaluation/application/use-cases/get-evaluation-attempts.usecase";
import { GetGradingQueueCountUseCase } from "@/features/evaluation/application/use-cases/get-grading-queue-count.usecase";
import { GetGradingQueueUseCase } from "@/features/evaluation/application/use-cases/get-grading-queue.usecase";
import { GetStudentGradesUseCase } from "@/features/evaluation/application/use-cases/get-student-grades.usecase";
import { GradeEvaluationAnswerUseCase } from "@/features/evaluation/application/use-cases/grade-evaluation-answer.usecase";
import { PublishEvaluationAttemptGradeUseCase } from "@/features/evaluation/application/use-cases/publish-evaluation-attempt-grade.usecase";
import { PublishEvaluationGradesUseCase } from "@/features/evaluation/application/use-cases/publish-evaluation-grades.usecase";
import { ResetEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/reset-evaluation-attempt.usecase";
import { type GradingQueueItemView } from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import { type EvaluationAttemptStatusValue } from "@/features/evaluation/domain/value-objects/evaluation-attempt-status";
import {
  GetEvaluationAttemptsQueryDTO,
  GetGradingQueueCountQueryDTO,
  GetGradingQueueQueryDTO,
  GradeEvaluationAnswerDTO,
  PublishEvaluationGradesDTO,
  ResetEvaluationAttemptDTO,
} from "@/features/evaluation/presentation/dtos/evaluation-grading-request.dto";
import {
  EvaluationAttemptsPageDTO,
  GradeEvaluationAnswerResponseDTO,
  GradingAttemptDTO,
  GradingQueueCountDTO,
  GradingQueueItemDTO,
  MyEvaluationGradeDTO,
  PublishAttemptGradeResponseDTO,
  PublishGradesResponseDTO,
} from "@/features/evaluation/presentation/dtos/evaluation-grading.dto";
import { EvaluationGradingMapper } from "@/features/evaluation/presentation/mappers/evaluation-grading.mapper";
import { type CurrentCaller, toEvaluationActor } from "@/features/evaluation/presentation/types/current-caller";

@ApiTags("Evaluation grading")
@ApiBearerAuth("JWT-auth")
@Controller("api/evaluation-grading")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EvaluationGradingController {
  public constructor(
    private readonly _getGradingQueueUseCase: GetGradingQueueUseCase,
    private readonly _getEvaluationAttemptsUseCase: GetEvaluationAttemptsUseCase,
    private readonly _resetEvaluationAttemptUseCase: ResetEvaluationAttemptUseCase,
    private readonly _getAttemptForGradingUseCase: GetAttemptForGradingUseCase,
    private readonly _gradeEvaluationAnswerUseCase: GradeEvaluationAnswerUseCase,
    private readonly _publishEvaluationAttemptGradeUseCase: PublishEvaluationAttemptGradeUseCase,
    private readonly _publishEvaluationGradesUseCase: PublishEvaluationGradesUseCase,
    private readonly _getGradingQueueCountUseCase: GetGradingQueueCountUseCase,
    private readonly _getStudentGradesUseCase: GetStudentGradesUseCase,
  ) {}

  @Get("queue")
  @RequirePermissions("evaluations:grade")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get grading queue",
    description:
      "PENDING_REVIEW attempts of students in the STUDENT groups the caller created or supervises (legacy attempts without assignment: evaluations the caller created; admins: all), optionally filtered by evaluation, group and student, oldest first; expired attempts in progress of the filtered evaluations/groups/student are closed first (at most 50 per request)",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Grading queue retrieved successfully", type: GradingQueueItemDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getQueue(
    @Query() query: GetGradingQueueQueryDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<GradingQueueItemDTO[]>> {
    const result: Paginated<GradingQueueItemView> = await this._getGradingQueueUseCase.execute(
      { evaluationId: query.evaluationId, groupId: query.groupId, studentId: query.studentId, page: Number(query.page), limit: Number(query.limit) },
      toEvaluationActor(currentUser),
    );

    return new APIResponseBuilder<GradingQueueItemDTO[]>()
      .setData(result.data.map((item: GradingQueueItemView) => EvaluationGradingMapper.toQueueItemDTO(item)))
      .setMessage(await i18n.t("evaluation.grading_queue_retrieved"))
      .setPagination(result.pagination)
      .build();
  }

  @Get("queue/count")
  @RequirePermissions("evaluations:grade")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Count the grading queue",
    description:
      "Number of PENDING_REVIEW attempts with the same scope and filters (evaluation, group, student) as the grading queue; expired attempts in progress matching the filters are closed first (at most 50 per request)",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Pending count retrieved successfully", type: GradingQueueCountDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getQueueCount(
    @Query() query: GetGradingQueueCountQueryDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<GradingQueueCountDTO>> {
    const pending: number = await this._getGradingQueueCountUseCase.execute(
      { evaluationId: query.evaluationId, groupId: query.groupId, studentId: query.studentId },
      toEvaluationActor(currentUser),
    );

    return new APIResponseBuilder<GradingQueueCountDTO>()
      .setData(new GradingQueueCountDTO(pending))
      .setMessage(await i18n.t("evaluation.grading_queue_count_retrieved"))
      .build();
  }

  @Get("students/:userId/grades")
  @RequirePermissions("evaluations:grade")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get a student's grades",
    description:
      "Published grades of a student with attempt, evaluation, module, grade on the 0.0–5.0 scale, pass flag and publication date. Admins see every grade; a teacher must create or supervise a STUDENT group of the student (403 otherwise) and only sees the grades of their grading scope (assignments of those groups, legacy attempts of evaluations they created)",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Grades retrieved successfully", type: MyEvaluationGradeDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or student outside the caller's groups" })
  public async getStudentGrades(
    @Param("userId") userId: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<MyEvaluationGradeDTO[]>> {
    const grades: EvaluationUserGrade[] = await this._getStudentGradesUseCase.execute(userId, toEvaluationActor(currentUser));

    return new APIResponseBuilder<MyEvaluationGradeDTO[]>()
      .setData(grades.map((grade: EvaluationUserGrade) => EvaluationGradingMapper.toMyGradeDTO(grade)))
      .setMessage(await i18n.t("evaluation.student_grades_retrieved"))
      .build();
  }

  @Get("attempts")
  @RequirePermissions("evaluations:grade")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "List evaluation attempts",
    description:
      "Every non-legacy attempt of one evaluation in the caller grading scope (same scope as the grading queue), optionally filtered by STUDENT group and statuses, ordered by student and attempt number, with grade, publication date, late flag and the counts by status of the evaluation and group (the status filter does not apply to the counts); expired attempts in progress are closed first (at most 50 per request)",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Attempts retrieved successfully", type: EvaluationAttemptsPageDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getEvaluationAttempts(
    @Query() query: GetEvaluationAttemptsQueryDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<EvaluationAttemptsPageDTO>> {
    const page: EvaluationAttemptsPage = await this._getEvaluationAttemptsUseCase.execute(
      {
        evaluationId: query.evaluationId,
        groupId: query.groupId,
        statuses: query.status as EvaluationAttemptStatusValue[] | undefined,
        page: Number(query.page),
        limit: Number(query.limit),
      },
      toEvaluationActor(currentUser),
    );

    return new APIResponseBuilder<EvaluationAttemptsPageDTO>()
      .setData(EvaluationGradingMapper.toAttemptsPageDTO(page))
      .setMessage(await i18n.t("evaluation.evaluation_attempts_retrieved"))
      .setPagination(page.attempts.pagination)
      .build();
  }

  @Post("students/:userId/evaluations/:evaluationId/reset")
  @RequirePermissions("evaluations:grade")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Reset a student attempt",
    description:
      "Non-destructive reset: grants the student one more attempt of the evaluation (maxAttempts plus the accumulated grants), keeping every previous attempt, grade and feedback; the reason is audited and the student is notified (ATTEMPT_RESET). Requires the grading scope over the student group and an ACTIVE assignment of that group",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Attempt reset successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The student group is outside the caller grading scope" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation not found, or not assigned to the student group" })
  @ApiResponseDoc({
    status: HttpStatus.CONFLICT,
    description:
      "evaluation.attempt_in_progress: the student has an attempt in progress; evaluation.assignment_not_active: the assignment of the student group is not active (data: assignmentId, startsAt, endsAt, to extend its window)",
  })
  public async resetAttempt(
    @Param("userId") userId: string,
    @Param("evaluationId") evaluationId: string,
    @Body() dto: ResetEvaluationAttemptDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._resetEvaluationAttemptUseCase.execute(
      new ResetEvaluationAttemptCommand({ userId, evaluationId, reason: dto.reason, actor: toEvaluationActor(currentUser) }),
    );

    return new APIResponseBuilder<null>().setMessage(await i18n.t("evaluation.attempt_reset")).build();
  }

  @Get("attempts/:attemptId")
  @RequirePermissions("evaluations:grade")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get attempt for grading",
    description:
      "Full questions with correct options, explanations and rubrics, the student answers with automatic and manual scores, and the practical score breakdown of SIMULATION answers recomputed on demand (read-only, not stored)",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Attempt retrieved successfully", type: GradingAttemptDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The attempt is outside the caller's groups" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Attempt not found" })
  public async getAttempt(
    @Param("attemptId") attemptId: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<GradingAttemptDTO>> {
    const result: GradingAttemptDetailResult = await this._getAttemptForGradingUseCase.execute(attemptId, toEvaluationActor(currentUser));

    return new APIResponseBuilder<GradingAttemptDTO>()
      .setData(EvaluationGradingMapper.toAttemptDTO(result))
      .setMessage(await i18n.t("evaluation.grading_attempt_retrieved"))
      .build();
  }

  @Put("attempts/:attemptId/answers/:questionId")
  @RequirePermissions("evaluations:grade")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Grade answer",
    description:
      "Sets the manual score (0..points) of one question; overriding an existing automatic or manual score requires a comment and is audited; when nothing is pending the attempt becomes GRADED (grade = round(5 × score / maxScore, 1)) and is published at once if the evaluation shows results immediately",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Answer graded successfully", type: GradeEvaluationAnswerResponseDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The attempt is outside the caller's groups" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Attempt or question not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The attempt is still in progress" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Score out of range, or an override without a comment" })
  public async gradeAnswer(
    @Param("attemptId") attemptId: string,
    @Param("questionId") questionId: string,
    @Body() dto: GradeEvaluationAnswerDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<GradeEvaluationAnswerResponseDTO>> {
    const result: GradeEvaluationAnswerResult = await this._gradeEvaluationAnswerUseCase.execute(
      new GradeEvaluationAnswerCommand({ attemptId, questionId, manualScore: dto.manualScore, comment: dto.comment, actor: toEvaluationActor(currentUser) }),
    );

    return new APIResponseBuilder<GradeEvaluationAnswerResponseDTO>()
      .setData(EvaluationGradingMapper.toGradeResponseDTO(result))
      .setMessage(await i18n.t("evaluation.answer_graded"))
      .build();
  }

  @Post("attempts/:attemptId/publish")
  @RequirePermissions("evaluations:grade")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Publish attempt grade",
    description: "Publishes the grade of a GRADED attempt and notifies the student with grade:published; idempotent (an already published grade keeps its date)",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Grade published successfully", type: PublishAttemptGradeResponseDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The attempt is outside the caller's groups" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Attempt not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The attempt is not GRADED" })
  public async publishAttempt(
    @Param("attemptId") attemptId: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<PublishAttemptGradeResponseDTO>> {
    const result: PublishEvaluationAttemptGradeResult = await this._publishEvaluationAttemptGradeUseCase.execute(attemptId, toEvaluationActor(currentUser));

    return new APIResponseBuilder<PublishAttemptGradeResponseDTO>()
      .setData(EvaluationGradingMapper.toPublishResponseDTO(result))
      .setMessage(await i18n.t("evaluation.grade_published"))
      .build();
  }

  @Post("publish")
  @RequirePermissions("evaluations:grade")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Publish evaluation grades",
    description: "Publishes every GRADED unpublished attempt of the evaluation (optionally one group) within the caller's scope and notifies each student; returns how many were published",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Grades published successfully", type: PublishGradesResponseDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation not found" })
  public async publishEvaluation(
    @Body() dto: PublishEvaluationGradesDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<PublishGradesResponseDTO>> {
    const count: number = await this._publishEvaluationGradesUseCase.execute(
      new PublishEvaluationGradesCommand({ evaluationId: dto.evaluationId, groupId: dto.groupId, actor: toEvaluationActor(currentUser) }),
    );

    return new APIResponseBuilder<PublishGradesResponseDTO>()
      .setData(new PublishGradesResponseDTO(count))
      .setMessage(await i18n.t("evaluation.grades_published"))
      .build();
  }
}
