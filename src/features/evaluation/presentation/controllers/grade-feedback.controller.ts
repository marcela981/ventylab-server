/*
 * Funcionalidad: Controlador GradeFeedbackController
 * Descripción: Rutas de retroalimentación de calificación: lectura del estudiante sobre su intento con la nota publicada (GET /api/evaluation-attempts/:attemptId/feedback, evaluations:attempt), lectura del docente o administrador (GET /api/evaluation-grading/attempts/:attemptId/feedback) y regeneración asíncrona que responde 202 PENDING (POST /api/evaluation-grading/attempts/:attemptId/feedback/regenerate), ambas con evaluations:grade y alcance de grupo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { RegenerateGradeFeedbackCommand } from "@/features/evaluation/application/commands/grade-feedback-regeneration.command";
import { type GradeFeedbackRegenerationResult, type GradeFeedbackResult } from "@/features/evaluation/application/results/grade-feedback.result";
import { RegenerateGradeFeedbackUseCase } from "@/features/evaluation/application/use-cases/grade-feedback-regeneration.usecase";
import { GetMyGradeFeedbackUseCase } from "@/features/evaluation/application/use-cases/grade-feedback-student-read.usecase";
import { GetGradeFeedbackUseCase } from "@/features/evaluation/application/use-cases/grade-feedback-teacher-read.usecase";
import { GradeFeedbackDTO, GradeFeedbackRegenerationDTO, StudentGradeFeedbackDTO } from "@/features/evaluation/presentation/dtos/grade-feedback.dto";
import { GradeFeedbacksMapper } from "@/features/evaluation/presentation/mappers/grade-feedbacks.mapper";
import { type CurrentCaller, toEvaluationActor } from "@/features/evaluation/presentation/types/current-caller";

@ApiTags("Grade feedback")
@ApiBearerAuth("JWT-auth")
@Controller("api")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GradeFeedbackController {
  public constructor(
    private readonly _getMyGradeFeedbackUseCase: GetMyGradeFeedbackUseCase,
    private readonly _getGradeFeedbackUseCase: GetGradeFeedbackUseCase,
    private readonly _regenerateGradeFeedbackUseCase: RegenerateGradeFeedbackUseCase,
  ) {}

  @Get("evaluation-attempts/:attemptId/feedback")
  @RequirePermissions("evaluations:attempt")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get my attempt feedback",
    description: "Overall and per-question feedback of the own attempt with its status; content and source only when READY; available once the grade is published",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Feedback retrieved successfully", type: StudentGradeFeedbackDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Attempt not found, or its grade is not published yet" })
  public async getMyFeedback(
    @Param("attemptId") attemptId: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<StudentGradeFeedbackDTO>> {
    const result: GradeFeedbackResult = await this._getMyGradeFeedbackUseCase.execute(attemptId, currentUser.sub);

    return new APIResponseBuilder<StudentGradeFeedbackDTO>()
      .setData(GradeFeedbacksMapper.toStudentDTO(result))
      .setMessage(await i18n.t("evaluation.grade_feedback_retrieved"))
      .build();
  }

  @Get("evaluation-grading/attempts/:attemptId/feedback")
  @RequirePermissions("evaluations:grade")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get attempt feedback",
    description: "Overall and per-question feedback of an attempt with source, provider, model and status; teachers only for attempts of groups they manage",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Feedback retrieved successfully", type: GradeFeedbackDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller does not manage the attempt's group" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Attempt not found" })
  public async getFeedback(
    @Param("attemptId") attemptId: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<GradeFeedbackDTO>> {
    const result: GradeFeedbackResult = await this._getGradeFeedbackUseCase.execute(attemptId, toEvaluationActor(currentUser));

    return new APIResponseBuilder<GradeFeedbackDTO>()
      .setData(GradeFeedbacksMapper.toTeacherDTO(result))
      .setMessage(await i18n.t("evaluation.grade_feedback_retrieved"))
      .build();
  }

  @Post("evaluation-grading/attempts/:attemptId/feedback/regenerate")
  @RequirePermissions("evaluations:grade")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: "Regenerate attempt feedback",
    description: "Replaces the feedback of a graded attempt with a PENDING one and generates it asynchronously (language model with deterministic fallback)",
  })
  @ApiResponseDoc({ status: HttpStatus.ACCEPTED, description: "Regeneration accepted", type: GradeFeedbackRegenerationDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "The caller does not manage the attempt's group" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Attempt not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The attempt is not graded yet" })
  public async regenerateFeedback(
    @Param("attemptId") attemptId: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<GradeFeedbackRegenerationDTO>> {
    const result: GradeFeedbackRegenerationResult = await this._regenerateGradeFeedbackUseCase.execute(
      new RegenerateGradeFeedbackCommand({ attemptId, actor: toEvaluationActor(currentUser) }),
    );

    return new APIResponseBuilder<GradeFeedbackRegenerationDTO>()
      .setData(GradeFeedbacksMapper.toRegenerationDTO(result))
      .setMessage(await i18n.t("evaluation.grade_feedback_regeneration_accepted"))
      .build();
  }
}
