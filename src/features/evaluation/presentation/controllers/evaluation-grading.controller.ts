/*
 * Funcionalidad: Controlador de calificación de evaluaciones
 * Descripción: Rutas /api/evaluation-grading del profesor o administrador con el permiso evaluations:grade: cola paginada de intentos PENDING_REVIEW en su alcance (cierra antes los intentos vencidos), vista de calificación de un intento, calificación manual de una pregunta (comentario obligatorio al sobrescribir, auditado), publicación idempotente de una nota y publicación masiva de una evaluación o grupo
 * Versión: 1.0
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
import {
  type GradeEvaluationAnswerResult,
  type GradingAttemptDetailResult,
  type PublishEvaluationAttemptGradeResult,
} from "@/features/evaluation/application/results/evaluation-grading.result";
import { GetAttemptForGradingUseCase } from "@/features/evaluation/application/use-cases/get-attempt-for-grading.usecase";
import { GetGradingQueueUseCase } from "@/features/evaluation/application/use-cases/get-grading-queue.usecase";
import { GradeEvaluationAnswerUseCase } from "@/features/evaluation/application/use-cases/grade-evaluation-answer.usecase";
import { PublishEvaluationAttemptGradeUseCase } from "@/features/evaluation/application/use-cases/publish-evaluation-attempt-grade.usecase";
import { PublishEvaluationGradesUseCase } from "@/features/evaluation/application/use-cases/publish-evaluation-grades.usecase";
import { type GradingQueueItemView } from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import {
  GetGradingQueueQueryDTO,
  GradeEvaluationAnswerDTO,
  PublishEvaluationGradesDTO,
} from "@/features/evaluation/presentation/dtos/evaluation-grading-request.dto";
import {
  GradeEvaluationAnswerResponseDTO,
  GradingAttemptDTO,
  GradingQueueItemDTO,
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
    private readonly _getAttemptForGradingUseCase: GetAttemptForGradingUseCase,
    private readonly _gradeEvaluationAnswerUseCase: GradeEvaluationAnswerUseCase,
    private readonly _publishEvaluationAttemptGradeUseCase: PublishEvaluationAttemptGradeUseCase,
    private readonly _publishEvaluationGradesUseCase: PublishEvaluationGradesUseCase,
  ) {}

  @Get("queue")
  @RequirePermissions("evaluations:grade")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get grading queue",
    description:
      "PENDING_REVIEW attempts of students in the STUDENT groups the caller created or supervises (legacy attempts without assignment: evaluations the caller created; admins: all), oldest first; expired attempts in progress of the filtered evaluations/groups are closed first (at most 50 per request)",
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
      { evaluationId: query.evaluationId, groupId: query.groupId, page: Number(query.page), limit: Number(query.limit) },
      toEvaluationActor(currentUser),
    );

    return new APIResponseBuilder<GradingQueueItemDTO[]>()
      .setData(result.data.map((item: GradingQueueItemView) => EvaluationGradingMapper.toQueueItemDTO(item)))
      .setMessage(await i18n.t("evaluation.grading_queue_retrieved"))
      .setPagination(result.pagination)
      .build();
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
