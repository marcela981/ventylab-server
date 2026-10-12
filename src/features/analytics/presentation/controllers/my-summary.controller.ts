/*
 * Funcionalidad: Controlador MySummaryController
 * Descripción: Expone GET /api/me/summary para cualquier usuario autenticado y solo sobre sí mismo (el identificador sale del JWT, nunca de la petición): progreso por sección, notas publicadas, evaluaciones activas y próximas, últimas notas, conversaciones con el tutor y sesiones de simulación, próximas reservas y notificaciones sin leer
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Get, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type MySummary } from "@/features/analytics/application/results/analytics.results";
import { GetMySummaryUseCase } from "@/features/analytics/application/use-cases/get-my-summary.usecase";
import { MySummaryDTO } from "@/features/analytics/presentation/dtos/analytics-response.dto";
import { AnalyticsMapper } from "@/features/analytics/presentation/mappers/analytics.mapper";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";

@ApiTags("Student summary")
@ApiBearerAuth("JWT-auth")
@Controller("api/me")
@UseGuards(JwtAuthGuard)
export class MySummaryController {
  public constructor(private readonly _getMySummaryUseCase: GetMySummaryUseCase) {}

  @Get("summary")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get my summary",
    description:
      "Summary of the authenticated user only: progress per section, published grades, active and upcoming evaluations, latest notes, AI tutor conversations and simulation sessions, upcoming ventilator reservations and unread notifications",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Summary retrieved successfully", type: MySummaryDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async getMySummary(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<MySummaryDTO>> {
    const summary: MySummary = await this._getMySummaryUseCase.execute({ id: currentUser.sub, role: currentUser.role });

    return new APIResponseBuilder<MySummaryDTO>()
      .setData(AnalyticsMapper.toMySummaryDTO(summary))
      .setMessage(await i18n.t("analytics.summary_retrieved"))
      .build();
  }
}
