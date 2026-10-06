/*
 * Funcionalidad: Controlador administrativo de valoraciones de IA
 * Descripción: Endpoints /api/admin/ai-ratings: estadísticas agregadas (tasa de utilidad y media con n por dimensión QUEST por caso de uso, proveedor, modelo y versión de prompt) y exportación CSV sin identificador de usuario; requieren el permiso ai-ratings:read (TEACHER y ADMIN)
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
import { type AiRatingsExport, ExportAiRatingsUseCase } from "@/features/ai-ratings/application/use-cases/export-ai-ratings.usecase";
import { GetAiRatingStatsUseCase } from "@/features/ai-ratings/application/use-cases/get-ai-rating-stats.usecase";
import { type AiRatingStats, type AiRatingStatsFilters } from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";
import { GetAiRatingsStatsQueryDTO } from "@/features/ai-ratings/presentation/dtos/ai-rating-request.dto";
import { AiRatingStatsDTO } from "@/features/ai-ratings/presentation/dtos/ai-rating-response.dto";
import { AiRatingsMapper } from "@/features/ai-ratings/presentation/mappers/ai-ratings.mapper";
import { toAiRatingsCsv } from "@/features/ai-ratings/presentation/utils/ai-ratings-csv";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";

const TRUNCATED_HEADER: string = "X-Export-Truncated";

@ApiTags("AI ratings")
@ApiBearerAuth("JWT-auth")
@Controller("api/admin/ai-ratings")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AiRatingsAdminController {
  public constructor(
    private readonly _getAiRatingStatsUseCase: GetAiRatingStatsUseCase,
    private readonly _exportAiRatingsUseCase: ExportAiRatingsUseCase,
  ) {}

  @Get("stats")
  @RequirePermissions("ai-ratings:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get AI rating stats",
    description:
      "Helpful rate and mean with n per QUEST dimension, grouped by use case, provider, model and prompt version of the linked AI call (\"unknown\" when the rating has no linked call)",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Stats retrieved successfully", type: AiRatingStatsDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Range does not start before it ends or spans more than 366 days" })
  public async getAiRatingStats(@Query() query: GetAiRatingsStatsQueryDTO, @I18n() i18n: I18nContext): Promise<APIResponse<AiRatingStatsDTO>> {
    const stats: AiRatingStats = await this._getAiRatingStatsUseCase.execute(AiRatingsMapper.toFilters(query, new Date()));

    return new APIResponseBuilder<AiRatingStatsDTO>()
      .setData(AiRatingsMapper.toStatsDTO(stats))
      .setMessage(await i18n.t("ai-ratings.stats_retrieved"))
      .build();
  }

  @Get("export.csv")
  @RequirePermissions("ai-ratings:read")
  @ApiProduces("text/csv")
  @ApiOperation({
    summary: "Export AI ratings as CSV",
    description: `One RFC 4180 row per rating without user identifiers, oldest first, capped at the export row limit; the ${TRUNCATED_HEADER} header is "true" when rows were left out`,
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "CSV file" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Range does not start before it ends or spans more than 366 days" })
  public async exportAiRatingsCsv(@Query() query: GetAiRatingsStatsQueryDTO, @Res() response: Response): Promise<void> {
    const filters: AiRatingStatsFilters = AiRatingsMapper.toFilters(query, new Date());
    const result: AiRatingsExport = await this._exportAiRatingsUseCase.execute(filters);
    const fileName: string = `ai-ratings-${filters.from.toISOString().slice(0, 10)}-${filters.to.toISOString().slice(0, 10)}.csv`;

    response.status(HttpStatus.OK);
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    response.setHeader(TRUNCATED_HEADER, String(result.truncated));
    response.send(toAiRatingsCsv(result.rows));
  }
}
