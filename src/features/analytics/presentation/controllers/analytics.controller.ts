/*
 * Funcionalidad: Controlador AnalyticsController
 * Descripción: Expone la analítica docente bajo /api/analytics con analytics:read (TEACHER y ADMIN; un profesor solo ve sus grupos creados o supervisados, sus estudiantes y las evaluaciones asignadas a ellos): panel de un grupo, su exportación CSV de notas y progreso, línea de tiempo de un estudiante y estadísticas de una evaluación (opcionalmente de un grupo gestionable); y con analytics:research-export (solo ADMIN) la exportación CSV anonimizada para investigación y su diccionario de datos (columnas, tipo, descripción y ejemplo)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Get, HttpCode, HttpStatus, Param, Query, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { type Response } from "express";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import {
  type EvaluationAnalytics,
  type GroupDashboard,
  type ResearchDatasetRow,
  type StudentTimeline,
} from "@/features/analytics/application/results/analytics.results";
import { type AnalyticsActor } from "@/features/analytics/application/services/analytics-scope.service";
import { ExportResearchDatasetUseCase } from "@/features/analytics/application/use-cases/export-research-dataset.usecase";
import { GetEvaluationAnalyticsUseCase } from "@/features/analytics/application/use-cases/get-evaluation-analytics.usecase";
import { GetGroupDashboardUseCase } from "@/features/analytics/application/use-cases/get-group-dashboard.usecase";
import { GetStudentTimelineUseCase } from "@/features/analytics/application/use-cases/get-student-timeline.usecase";
import { EvaluationStatsQueryDTO, ResearchExportQueryDTO, StudentTimelineQueryDTO } from "@/features/analytics/presentation/dtos/analytics-request.dto";
import { EvaluationAnalyticsDTO, GroupDashboardDTO, ResearchExportColumnDTO, StudentTimelineDTO } from "@/features/analytics/presentation/dtos/analytics-response.dto";
import { AnalyticsMapper } from "@/features/analytics/presentation/mappers/analytics.mapper";
import { toGroupDashboardCsv, toResearchCsv } from "@/features/analytics/presentation/utils/analytics-csv";
import { RESEARCH_EXPORT_DICTIONARY, type ResearchExportColumnDefinition } from "@/features/analytics/presentation/utils/research-export-dictionary";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";

function toActor(user: JwtPayload): AnalyticsActor {
  return { id: user.sub, role: user.role };
}

function sendCsv(response: Response, fileName: string, csv: string): void {
  response.status(HttpStatus.OK);
  response.setHeader("Content-Type", "text/csv; charset=utf-8");
  response.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  response.setHeader("Cache-Control", "no-store");
  response.send(csv);
}

@ApiTags("Analytics")
@ApiBearerAuth("JWT-auth")
@Controller("api/analytics")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnalyticsController {
  public constructor(
    private readonly _getGroupDashboardUseCase: GetGroupDashboardUseCase,
    private readonly _getStudentTimelineUseCase: GetStudentTimelineUseCase,
    private readonly _getEvaluationAnalyticsUseCase: GetEvaluationAnalyticsUseCase,
    private readonly _exportResearchDatasetUseCase: ExportResearchDatasetUseCase,
  ) {}

  @Get("groups/:groupId/dashboard")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("analytics:read")
  @ApiOperation({
    summary: "Get a group dashboard",
    description:
      "One row per student: progress by section, level and module, counted grade per evaluation and average, simulation sessions (count, average score, average time to stabilize), AI usage per use case with the percentage of useful ratings, ventilator hours and risk (atRisk, riskReasons, failedEvaluationIds) under the current risk thresholds; plus the current passing grade, the thresholds and the per-module progress aggregate of the group. Teachers only see groups they created or supervise; cached 60 s",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Group dashboard retrieved successfully", type: GroupDashboardDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or group outside the requester scope" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Group not found" })
  public async getGroupDashboard(
    @Param("groupId") groupId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<GroupDashboardDTO>> {
    const dashboard: GroupDashboard = await this._getGroupDashboardUseCase.execute(toActor(currentUser), groupId);

    return new APIResponseBuilder<GroupDashboardDTO>()
      .setData(AnalyticsMapper.toDashboardDTO(dashboard))
      .setMessage(await i18n.t("analytics.dashboard_retrieved"))
      .build();
  }

  @Get("groups/:groupId/export.csv")
  @RequirePermissions("analytics:read")
  @ApiProduces("text/csv")
  @ApiOperation({
    summary: "Export a group's grades and progress",
    description:
      "RFC 4180 CSV with one row per student: name, email, overall and per-section progress, average grade and counted grade per evaluation; cells starting with =, +, -, @ are prefixed against formula injection",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "CSV file" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or group outside the requester scope" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Group not found" })
  public async exportGroupAnalytics(@Param("groupId") groupId: string, @CurrentUser() currentUser: JwtPayload, @Res() response: Response): Promise<void> {
    const dashboard: GroupDashboard = await this._getGroupDashboardUseCase.execute(toActor(currentUser), groupId);

    sendCsv(response, `group-analytics-${dashboard.generatedAt.toISOString().slice(0, 10)}.csv`, toGroupDashboardCsv(dashboard));
  }

  @Get("students/:userId/timeline")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("analytics:read")
  @ApiOperation({
    summary: "Get a student timeline",
    description:
      "Lesson completions, evaluation attempts, simulation sessions and ventilator reservations of a student in a range (last 30 days by default, at most 366), newest first. Teachers only see students of groups they manage; cached 60 s",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Student timeline retrieved successfully", type: StudentTimelineDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden or student outside the requester scope" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Range does not start before it ends or spans more than 366 days" })
  public async getStudentTimeline(
    @Param("userId") userId: string,
    @Query() query: StudentTimelineQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<StudentTimelineDTO>> {
    const timeline: StudentTimeline = await this._getStudentTimelineUseCase.execute(
      toActor(currentUser),
      userId,
      query.from !== undefined ? new Date(query.from) : undefined,
      query.to !== undefined ? new Date(query.to) : undefined,
    );

    return new APIResponseBuilder<StudentTimelineDTO>()
      .setData(AnalyticsMapper.toTimelineDTO(timeline))
      .setMessage(await i18n.t("analytics.timeline_retrieved"))
      .build();
  }

  @Get("evaluations/:evaluationId/stats")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("analytics:read")
  @ApiOperation({
    summary: "Get evaluation statistics",
    description:
      "Average, median, histogram in 0.5 buckets on the 0–5 scale and pass rate over graded attempts, plus the difficulty index and correct rate of each question. Teachers only see evaluations assigned to a group they manage; groupId limits the statistics to the attempts of that group's assignments (teachers must manage or supervise the group, otherwise 403; unknown group 404); cached 60 s",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Evaluation statistics retrieved successfully", type: EvaluationAnalyticsDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden, evaluation or group outside the requester scope" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Evaluation or group not found" })
  public async getEvaluationAnalytics(
    @Param("evaluationId") evaluationId: string,
    @Query() query: EvaluationStatsQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<EvaluationAnalyticsDTO>> {
    const analytics: EvaluationAnalytics = await this._getEvaluationAnalyticsUseCase.execute(toActor(currentUser), evaluationId, query.groupId);

    return new APIResponseBuilder<EvaluationAnalyticsDTO>()
      .setData(AnalyticsMapper.toEvaluationDTO(analytics))
      .setMessage(await i18n.t("analytics.evaluation_stats_retrieved"))
      .build();
  }

  @Get("research/export.csv")
  @RequirePermissions("analytics:research-export")
  @ApiProduces("text/csv")
  @ApiOperation({
    summary: "Export the anonymized research dataset",
    description:
      "Long-format RFC 4180 CSV (participant, group, domain, item, metric, value) with progress, grades, simulation scores, AI ratings and AI telemetry of the students of STUDENT groups. User and group identifiers are replaced by HMAC-SHA256 with ANALYTICS_EXPORT_SALT; no names, emails or original identifiers are exported. Column meanings: GET /api/analytics/research/export/dictionary",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "CSV file" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.SERVICE_UNAVAILABLE, description: "ANALYTICS_EXPORT_SALT is not configured" })
  public async exportResearchDataset(@Query() query: ResearchExportQueryDTO, @Res() response: Response): Promise<void> {
    const rows: ResearchDatasetRow[] = await this._exportResearchDatasetUseCase.execute(query.groupId);

    sendCsv(response, `research-dataset-${new Date().toISOString().slice(0, 10)}.csv`, toResearchCsv(rows));
  }

  @Get("research/export/dictionary")
  @RequirePermissions("analytics:research-export")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get the research export data dictionary",
    description: "Every column of GET /api/analytics/research/export.csv in file order, with its value type, Spanish description and an example; built from the same column definition the CSV writer uses",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Research export dictionary retrieved successfully", type: ResearchExportColumnDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getResearchExportDictionary(@I18n() i18n: I18nContext): Promise<APIResponse<ResearchExportColumnDTO[]>> {
    return new APIResponseBuilder<ResearchExportColumnDTO[]>()
      .setData(RESEARCH_EXPORT_DICTIONARY.map((definition: ResearchExportColumnDefinition) => AnalyticsMapper.toResearchExportColumnDTO(definition)))
      .setMessage(await i18n.t("analytics.research_dictionary_retrieved"))
      .build();
  }
}
