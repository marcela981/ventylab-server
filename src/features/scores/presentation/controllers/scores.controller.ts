/*
 * Funcionalidad: Controlador de calificaciones
 * Descripción: Endpoints /api/scores para profesores y administradores: registrar o actualizar una calificación, eliminar una propia, consultar las de un estudiante y las asignadas por el profesor autenticado
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
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { DeleteScoreCommand } from "@/features/scores/application/commands/delete-score.command";
import { GetStudentScoresCommand } from "@/features/scores/application/commands/get-student-scores.command";
import { UpsertScoreCommand } from "@/features/scores/application/commands/upsert-score.command";
import { DeleteScoreUseCase } from "@/features/scores/application/use-cases/delete-score.usecase";
import { GetGraderScoresUseCase } from "@/features/scores/application/use-cases/get-grader-scores.usecase";
import { GetStudentScoresUseCase } from "@/features/scores/application/use-cases/get-student-scores.usecase";
import { UpsertScoreUseCase } from "@/features/scores/application/use-cases/upsert-score.usecase";
import { type ScoreView } from "@/features/scores/domain/read-models/score.read-model";
import { DEFAULT_MAX_POINTS, toScoreEntityType } from "@/features/scores/domain/value-objects/score-entity-type";
import { GetMyScoresQueryDTO, UpsertScoreDTO } from "@/features/scores/presentation/dtos/score-request.dto";
import { ScoreDTO, ScoreIdDTO } from "@/features/scores/presentation/dtos/score.dto";
import { ScoresMapper } from "@/features/scores/presentation/mappers/scores.mapper";

@ApiTags("Scores")
@ApiBearerAuth("JWT-auth")
@Controller("api/scores")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ScoresController {
  public constructor(
    private readonly _upsertScoreUseCase: UpsertScoreUseCase,
    private readonly _deleteScoreUseCase: DeleteScoreUseCase,
    private readonly _getStudentScoresUseCase: GetStudentScoresUseCase,
    private readonly _getGraderScoresUseCase: GetGraderScoresUseCase,
  ) {}

  @Post()
  @RequirePermissions("scores:create")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Record score",
    description: "Creates or updates the caller's score for a student on an element (teacher, student, type and element are the key); returns the score ID",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Score recorded successfully", type: ScoreIdDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or points out of range" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Student not found" })
  public async upsertScore(
    @Body() dto: UpsertScoreDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ScoreIdDTO>> {
    const id: string = await this._upsertScoreUseCase.execute(
      new UpsertScoreCommand({
        graderId: currentUser.sub,
        userId: dto.studentId,
        entityType: toScoreEntityType(dto.entityType),
        entityId: dto.entityId,
        points: dto.score,
        maxPoints: dto.maxScore ?? DEFAULT_MAX_POINTS,
        comments: dto.notes,
      }),
    );

    return new APIResponseBuilder<ScoreIdDTO>()
      .setData(new ScoreIdDTO({ id }))
      .setMessage(await i18n.t("scores.score_recorded"))
      .build();
  }

  @Delete(":id")
  @RequirePermissions("scores:delete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete score", description: "Deletes a score; only the teacher who assigned it can do it" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Score deleted successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Not the teacher who assigned the score" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Score not found" })
  public async deleteScore(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._deleteScoreUseCase.execute(new DeleteScoreCommand({ scoreId: id, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("scores.score_deleted"))
      .build();
  }

  @Get("students/:studentId")
  @RequirePermissions("scores:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get student scores", description: "Scores of a student with their grader; teachers only see their own scores, admins see all" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Scores retrieved successfully", type: ScoreDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getStudentScores(
    @Param("studentId") studentId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ScoreDTO[]>> {
    const views: ScoreView[] = await this._getStudentScoresUseCase.execute(
      new GetStudentScoresCommand({ studentId, requesterId: currentUser.sub, requesterRole: currentUser.role }),
    );

    return new APIResponseBuilder<ScoreDTO[]>()
      .setData(ScoresMapper.toDTOList(views))
      .setMessage(await i18n.t("scores.scores_retrieved"))
      .build();
  }

  @Get("my-scores")
  @RequirePermissions("scores:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get scores given by me", description: "Scores assigned by the authenticated teacher, optionally for one student" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Scores retrieved successfully", type: ScoreDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getMyScores(
    @Query() query: GetMyScoresQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ScoreDTO[]>> {
    const views: ScoreView[] = await this._getGraderScoresUseCase.execute(currentUser.sub, query.studentId);

    return new APIResponseBuilder<ScoreDTO[]>()
      .setData(ScoresMapper.toDTOList(views))
      .setMessage(await i18n.t("scores.scores_retrieved"))
      .build();
  }
}
