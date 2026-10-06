/*
 * Funcionalidad: Controlador de evaluaciones del estudiante
 * Descripción: Rutas del estudiante con el permiso evaluations:attempt: /api/my-evaluations (asignaciones de su grupo con sus intentos e inicio idempotente de un intento, 201 nuevo o 200 el que está en curso) y /api/evaluation-attempts/:attemptId (detalle sin respuestas correctas hasta la publicación, autoguardado por pregunta y entrega idempotente con calificación automática); notas publicadas propias (GET /api/my-evaluations/grades vía EvaluationFacade, incluidas las heredadas)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { type Response } from "express";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { SaveEvaluationAnswerCommand } from "@/features/evaluation/application/commands/save-evaluation-answer.command";
import { StartEvaluationAttemptCommand } from "@/features/evaluation/application/commands/start-evaluation-attempt.command";
import { SubmitEvaluationAttemptCommand } from "@/features/evaluation/application/commands/submit-evaluation-attempt.command";
import { type EvaluationUserGrade } from "@/features/evaluation/application/results/evaluation-grading.result";
import {
  type StartEvaluationAttemptResult,
  type StudentEvaluationAttemptDetailResult,
  type StudentEvaluationListItemResult,
  type SubmitEvaluationAttemptResult,
} from "@/features/evaluation/application/results/student-evaluation-attempt.result";
import { EvaluationFacade } from "@/features/evaluation/application/services/evaluation.facade";
import { GetEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/get-evaluation-attempt.usecase";
import { GetMyEvaluationsUseCase } from "@/features/evaluation/application/use-cases/get-my-evaluations.usecase";
import { SaveEvaluationAnswerUseCase } from "@/features/evaluation/application/use-cases/save-evaluation-answer.usecase";
import { StartEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/start-evaluation-attempt.usecase";
import { SubmitEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/submit-evaluation-attempt.usecase";
import { MyEvaluationGradeDTO } from "@/features/evaluation/presentation/dtos/evaluation-grading.dto";
import { SaveEvaluationAnswerDTO, SubmitEvaluationAnswerDTO, SubmitEvaluationAttemptDTO } from "@/features/evaluation/presentation/dtos/student-evaluation-request.dto";
import {
  MyEvaluationDTO,
  StudentAttemptDetailDTO,
  StudentAttemptStartDTO,
  SubmitEvaluationAttemptResponseDTO,
} from "@/features/evaluation/presentation/dtos/student-evaluation.dto";
import { EvaluationGradingMapper } from "@/features/evaluation/presentation/mappers/evaluation-grading.mapper";
import { StudentEvaluationsMapper } from "@/features/evaluation/presentation/mappers/student-evaluations.mapper";
import { type CurrentCaller } from "@/features/evaluation/presentation/types/current-caller";

@ApiTags("Student evaluations")
@ApiBearerAuth("JWT-auth")
@Controller("api")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StudentEvaluationsController {
  public constructor(
    private readonly _getMyEvaluationsUseCase: GetMyEvaluationsUseCase,
    private readonly _startEvaluationAttemptUseCase: StartEvaluationAttemptUseCase,
    private readonly _getEvaluationAttemptUseCase: GetEvaluationAttemptUseCase,
    private readonly _saveEvaluationAnswerUseCase: SaveEvaluationAnswerUseCase,
    private readonly _submitEvaluationAttemptUseCase: SubmitEvaluationAttemptUseCase,
    private readonly _evaluationFacade: EvaluationFacade,
  ) {}

  @Get("my-evaluations/grades")
  @RequirePermissions("evaluations:attempt")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get my evaluation grades",
    description: "Published grades of the caller (legacy quiz and activity grades included) with evaluation title and type, grade on the 0.0–5.0 scale, pass flag and publication date",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Grades retrieved successfully", type: MyEvaluationGradeDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getMyGrades(@CurrentUser() currentUser: CurrentCaller, @I18n() i18n: I18nContext): Promise<APIResponse<MyEvaluationGradeDTO[]>> {
    const grades: EvaluationUserGrade[] = await this._evaluationFacade.getUserGrades(currentUser.sub);

    return new APIResponseBuilder<MyEvaluationGradeDTO[]>()
      .setData(grades.map((grade: EvaluationUserGrade) => EvaluationGradingMapper.toMyGradeDTO(grade)))
      .setMessage(await i18n.t("evaluation.my_grades_retrieved"))
      .build();
  }

  @Get("my-evaluations")
  @RequirePermissions("evaluations:attempt")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get my evaluations",
    description: "Assignments of the caller's active STUDENT group with derived state, evaluation summary (no answers) and own attempts; grades only when published; empty without group",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Evaluations retrieved successfully", type: MyEvaluationDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getMyEvaluations(@CurrentUser() currentUser: CurrentCaller, @I18n() i18n: I18nContext): Promise<APIResponse<MyEvaluationDTO[]>> {
    const items: StudentEvaluationListItemResult[] = await this._getMyEvaluationsUseCase.execute(currentUser.sub);

    return new APIResponseBuilder<MyEvaluationDTO[]>()
      .setData(items.map((item: StudentEvaluationListItemResult) => StudentEvaluationsMapper.toMyEvaluationDTO(item)))
      .setMessage(await i18n.t("evaluation.my_evaluations_retrieved"))
      .build();
  }

  @Post("my-evaluations/:assignmentId/attempts")
  @RequirePermissions("evaluations:attempt")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Start evaluation attempt",
    description:
      "Starts an attempt in an ACTIVE assignment of the caller's group with a server-side deadline (min(start + duration, assignment end)); returns the attempt in progress with 200 when there is one",
  })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Attempt started", type: StudentAttemptStartDTO })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "The attempt in progress was returned", type: StudentAttemptStartDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The assignment is not ACTIVE or the evaluation is not READY" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "The assignment does not exist or is not for the caller's group" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Every allowed attempt was already used" })
  public async startAttempt(
    @Param("assignmentId") assignmentId: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
    @Res({ passthrough: true }) response: Response,
  ): Promise<APIResponse<StudentAttemptStartDTO>> {
    const result: StartEvaluationAttemptResult = await this._startEvaluationAttemptUseCase.execute(
      new StartEvaluationAttemptCommand({ assignmentId, userId: currentUser.sub }),
    );

    response.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);

    return new APIResponseBuilder<StudentAttemptStartDTO>()
      .setData(StudentEvaluationsMapper.toStartDTO(result))
      .setMessage(await i18n.t(result.created ? "evaluation.attempt_started" : "evaluation.attempt_resumed"))
      .build();
  }

  @Get("evaluation-attempts/:attemptId")
  @RequirePermissions("evaluations:attempt")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get evaluation attempt",
    description:
      "Own attempt with scenarios, questions (shuffled per attempt when configured), options, saved answers, deadline and server time; correct answers, explanations, rubrics and scores only once the grade is published",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Attempt retrieved successfully", type: StudentAttemptDetailDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Attempt not found" })
  public async getAttempt(
    @Param("attemptId") attemptId: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<StudentAttemptDetailDTO>> {
    const result: StudentEvaluationAttemptDetailResult = await this._getEvaluationAttemptUseCase.execute(attemptId, currentUser.sub);

    return new APIResponseBuilder<StudentAttemptDetailDTO>()
      .setData(StudentEvaluationsMapper.toAttemptDetailDTO(result))
      .setMessage(await i18n.t("evaluation.attempt_retrieved"))
      .build();
  }

  @Put("evaluation-attempts/:attemptId/answers/:questionId")
  @RequirePermissions("evaluations:attempt")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Save evaluation answer",
    description: "Autosaves the answer to one question of the own attempt in progress, until the deadline plus 30 s grace; afterwards the attempt is closed with the saved answers (409)",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Answer saved successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Attempt or question not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The attempt is closed, read-only or past its deadline" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "The answer does not match the question" })
  public async saveAnswer(
    @Param("attemptId") attemptId: string,
    @Param("questionId") questionId: string,
    @Body() dto: SaveEvaluationAnswerDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._saveEvaluationAnswerUseCase.execute(
      new SaveEvaluationAnswerCommand({
        attemptId,
        questionId,
        userId: currentUser.sub,
        selectedOptionIds: dto.selectedOptionIds,
        textAnswer: dto.textAnswer,
        simulationSessionId: dto.simulationSessionId,
      }),
    );

    return new APIResponseBuilder<null>().setMessage(await i18n.t("evaluation.answer_saved")).build();
  }

  @Post("evaluation-attempts/:attemptId/submit")
  @RequirePermissions("evaluations:attempt")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Submit evaluation attempt",
    description:
      "Idempotent: closes and auto-grades the own attempt (final answers in the body apply only before the deadline plus 30 s grace); repeated calls return the same result; scores only when published",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Attempt submitted successfully", type: SubmitEvaluationAttemptResponseDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Attempt or question not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The attempt is read-only" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "A final answer does not match its question" })
  public async submitAttempt(
    @Param("attemptId") attemptId: string,
    @Body() dto: SubmitEvaluationAttemptDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<SubmitEvaluationAttemptResponseDTO>> {
    const result: SubmitEvaluationAttemptResult = await this._submitEvaluationAttemptUseCase.execute(
      new SubmitEvaluationAttemptCommand({
        attemptId,
        userId: currentUser.sub,
        answers: dto.answers?.map((answer: SubmitEvaluationAnswerDTO) => ({
          questionId: answer.questionId,
          selectedOptionIds: answer.selectedOptionIds,
          textAnswer: answer.textAnswer,
          simulationSessionId: answer.simulationSessionId,
        })),
      }),
    );

    return new APIResponseBuilder<SubmitEvaluationAttemptResponseDTO>()
      .setData(StudentEvaluationsMapper.toSubmitDTO(result))
      .setMessage(await i18n.t("evaluation.attempt_submitted"))
      .build();
  }
}
