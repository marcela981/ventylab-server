/*
 * Funcionalidad: Controlador de quizzes
 * Descripción: Endpoints autenticados de /api/quizzes (alias /api/evaluation/quizzes): listado, detalle (respuestas ocultas hasta el intento), intentos del usuario y registro calificado del intento único
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { AttemptQuizCommand } from "@/features/quizzes/application/commands/attempt-quiz.command";
import { QuizAttemptResult } from "@/features/quizzes/application/results/quiz-attempt.result";
import { AttemptQuizUseCase } from "@/features/quizzes/application/use-cases/attempt-quiz.usecase";
import { GetMyQuizAttemptUseCase } from "@/features/quizzes/application/use-cases/get-my-quiz-attempt.usecase";
import { GetMyQuizAttemptsUseCase } from "@/features/quizzes/application/use-cases/get-my-quiz-attempts.usecase";
import { GetQuizByIdUseCase } from "@/features/quizzes/application/use-cases/get-quiz-by-id.usecase";
import { GetQuizzesUseCase } from "@/features/quizzes/application/use-cases/get-quizzes.usecase";
import { type QuizAttemptSummary, type QuizDetailView, type QuizSummary } from "@/features/quizzes/domain/read-models/quiz.read-model";
import { AttemptQuizDTO, GetQuizzesQueryDTO, QuizAnswerDTO } from "@/features/quizzes/presentation/dtos/quiz-request.dto";
import { QuizAttemptResultDTO, QuizAttemptSummaryDTO, QuizDetailDTO, QuizSummaryDTO } from "@/features/quizzes/presentation/dtos/quiz.dto";
import { QuizzesMapper } from "@/features/quizzes/presentation/mappers/quizzes.mapper";

@ApiTags("Quizzes")
@ApiBearerAuth("JWT-auth")
@Controller(["api/quizzes", "api/evaluation/quizzes"])
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QuizzesController {
  public constructor(
    private readonly _getQuizzesUseCase: GetQuizzesUseCase,
    private readonly _getQuizByIdUseCase: GetQuizByIdUseCase,
    private readonly _getMyQuizAttemptsUseCase: GetMyQuizAttemptsUseCase,
    private readonly _getMyQuizAttemptUseCase: GetMyQuizAttemptUseCase,
    private readonly _attemptQuizUseCase: AttemptQuizUseCase,
  ) {}

  @Get("my-attempts")
  @RequirePermissions("quizzes:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get my quiz attempts", description: "Lists every quiz attempt of the authenticated user, most recent first" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Attempts retrieved successfully", type: QuizAttemptSummaryDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async getMyQuizAttempts(
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<QuizAttemptSummaryDTO[]>> {
    const attempts: QuizAttemptSummary[] = await this._getMyQuizAttemptsUseCase.execute(currentUser.sub);

    return new APIResponseBuilder<QuizAttemptSummaryDTO[]>()
      .setData(QuizzesMapper.toAttemptSummaryDTOList(attempts))
      .setMessage(await i18n.t("quizzes.attempts_retrieved"))
      .build();
  }

  @Get()
  @RequirePermissions("quizzes:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get quizzes", description: "Lists active quizzes without their questions, optionally filtered by module" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Quizzes retrieved successfully", type: QuizSummaryDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async getQuizzes(@Query() query: GetQuizzesQueryDTO, @I18n() i18n: I18nContext): Promise<APIResponse<QuizSummaryDTO[]>> {
    const quizzes: QuizSummary[] = await this._getQuizzesUseCase.execute(query.moduleId);

    return new APIResponseBuilder<QuizSummaryDTO[]>()
      .setData(QuizzesMapper.toSummaryDTOList(quizzes))
      .setMessage(await i18n.t("quizzes.quizzes_retrieved"))
      .build();
  }

  @Get(":quizId")
  @RequirePermissions("quizzes:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get quiz by ID",
    description: "Retrieves an active quiz. Correct answers, option feedback and explanations are hidden until the user has attempted the quiz, unless the user can manage quizzes",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Quiz retrieved successfully", type: QuizDetailDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Quiz inactive" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Quiz not found" })
  public async getQuizById(
    @Param("quizId") quizId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<QuizDetailDTO>> {
    const quiz: QuizDetailView = await this._getQuizByIdUseCase.execute({
      quizId,
      userId: currentUser.sub,
      canManageQuizzes: currentUser.permissions.includes("quizzes:manage"),
    });

    return new APIResponseBuilder<QuizDetailDTO>()
      .setData(QuizzesMapper.toDetailDTO(quiz))
      .setMessage(await i18n.t("quizzes.quiz_retrieved"))
      .build();
  }

  @Get(":quizId/my-attempt")
  @RequirePermissions("quizzes:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get my attempt of a quiz", description: "Retrieves the latest attempt of the authenticated user in a quiz, or null" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Attempt retrieved successfully", type: QuizAttemptSummaryDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async getMyQuizAttempt(
    @Param("quizId") quizId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<QuizAttemptSummaryDTO | null>> {
    const attempt: QuizAttemptSummary | undefined = await this._getMyQuizAttemptUseCase.execute(currentUser.sub, quizId);

    return new APIResponseBuilder<QuizAttemptSummaryDTO | null>()
      .setData(attempt ? QuizzesMapper.toAttemptSummaryDTO(attempt) : null)
      .setMessage(await i18n.t("quizzes.attempt_retrieved"))
      .build();
  }

  @Post(":quizId/attempt")
  @RequirePermissions("quizzes:attempt")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Attempt quiz",
    description: "Grades and records the single allowed attempt of the authenticated user; the response carries the per-question grading",
  })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Attempt graded and recorded", type: QuizAttemptResultDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Quiz not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Quiz already completed" })
  public async attemptQuiz(
    @Param("quizId") quizId: string,
    @Body() dto: AttemptQuizDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<QuizAttemptResultDTO>> {
    const result: QuizAttemptResult = await this._attemptQuizUseCase.execute(
      new AttemptQuizCommand({
        userId: currentUser.sub,
        quizId,
        answers: dto.answers.map((answer: QuizAnswerDTO) => ({
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
        })),
      }),
    );

    return new APIResponseBuilder<QuizAttemptResultDTO>()
      .setData(QuizzesMapper.toAttemptResultDTO(result))
      .setMessage(await i18n.t("quizzes.attempt_recorded"))
      .build();
  }
}
