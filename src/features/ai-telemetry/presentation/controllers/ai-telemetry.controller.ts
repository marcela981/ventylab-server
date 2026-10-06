/*
 * Funcionalidad: Controlador de telemetría de IA
 * Descripción: Endpoints administrativos /api/admin/ai-telemetry: estadísticas agregadas de llamadas de IA (totales y por día) y exportación CSV de la bitácora sin texto de prompt ni de respuesta; requieren el permiso ai-telemetry:read
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Get, HttpCode, HttpStatus, Query, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { type Response } from "express";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type AiCallLogsExport, ExportAiCallLogsUseCase } from "@/features/ai-telemetry/application/use-cases/export-ai-call-logs.usecase";
import { GetAiTelemetryStatsUseCase } from "@/features/ai-telemetry/application/use-cases/get-ai-telemetry-stats.usecase";
import { type AiTelemetryFilters, type AiTelemetryStats } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";
import { GetAiTelemetryQueryDTO } from "@/features/ai-telemetry/presentation/dtos/ai-telemetry-request.dto";
import { AiTelemetryStatsDTO } from "@/features/ai-telemetry/presentation/dtos/ai-telemetry-stats.dto";
import { AiTelemetryMapper } from "@/features/ai-telemetry/presentation/mappers/ai-telemetry.mapper";
import { toAiCallLogsCsv } from "@/features/ai-telemetry/presentation/utils/ai-call-logs-csv";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";

const TRUNCATED_HEADER: string = "X-Export-Truncated";

@ApiTags("AI telemetry")
@ApiBearerAuth("JWT-auth")
@Controller("api/admin/ai-telemetry")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AiTelemetryController {
  public constructor(
    private readonly _getAiTelemetryStatsUseCase: GetAiTelemetryStatsUseCase,
    private readonly _exportAiCallLogsUseCase: ExportAiCallLogsUseCase,
  ) {}

  @Get("stats")
  @RequirePermissions("ai-telemetry:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get AI telemetry stats",
    description:
      "Totals and per-UTC-day series of AI calls: p50/p95 latency and time to first token, fallback and error rates over calls that reached a provider, tokens and estimated cost",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Stats retrieved successfully", type: AiTelemetryStatsDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Range does not start before it ends or spans more than 366 days" })
  public async getAiTelemetryStats(@Query() query: GetAiTelemetryQueryDTO, @I18n() i18n: I18nContext): Promise<APIResponse<AiTelemetryStatsDTO>> {
    const stats: AiTelemetryStats = await this._getAiTelemetryStatsUseCase.execute(AiTelemetryMapper.toFilters(query, new Date()));

    return new APIResponseBuilder<AiTelemetryStatsDTO>()
      .setData(AiTelemetryMapper.toStatsDTO(stats))
      .setMessage(await i18n.t("ai-telemetry.stats_retrieved"))
      .build();
  }

  @Get("export.csv")
  @RequirePermissions("ai-telemetry:read")
  @ApiProduces("text/csv")
  @ApiOperation({
    summary: "Export AI calls as CSV",
    description: `One RFC 4180 row per AI call (no prompt or response text), oldest first, capped at the export row limit; the ${TRUNCATED_HEADER} header is "true" when rows were left out`,
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "CSV file" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Range does not start before it ends or spans more than 366 days" })
  public async exportAiCallLogsCsv(@Query() query: GetAiTelemetryQueryDTO, @Res() response: Response): Promise<void> {
    const filters: AiTelemetryFilters = AiTelemetryMapper.toFilters(query, new Date());
    const result: AiCallLogsExport = await this._exportAiCallLogsUseCase.execute(filters);
    const fileName: string = `ai-calls-${filters.from.toISOString().slice(0, 10)}-${filters.to.toISOString().slice(0, 10)}.csv`;

    response.status(HttpStatus.OK);
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    response.setHeader(TRUNCATED_HEADER, String(result.truncated));
    response.send(toAiCallLogsCsv(result.rows));
  }
}
