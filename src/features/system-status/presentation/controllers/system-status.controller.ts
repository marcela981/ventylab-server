/*
 * Funcionalidad: Controlador SystemStatusController
 * Descripción: Expone GET /api/system/status (system:status, TEACHER y ADMIN) con el estado global y por componente, y POST /api/system/probe/ai/:provider (system:probe, solo ADMIN) con una llamada mínima real al proveedor a través del gateway de IA, limitada a 3 por minuto
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type AiProbeResult } from "@/features/ai/domain/results/ai-provider-health";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { GetSystemStatusUseCase } from "@/features/system-status/application/use-cases/get-system-status.usecase";
import { ProbeAiProviderUseCase } from "@/features/system-status/application/use-cases/probe-ai-provider.usecase";
import { type SystemStatusReport } from "@/features/system-status/domain/system-status";
import { AiProbeDTO, SystemStatusDTO } from "@/features/system-status/presentation/dtos/system-status-response.dto";
import { SystemStatusMapper } from "@/features/system-status/presentation/mappers/system-status.mapper";

export const AI_PROBE_RATE_LIMIT: number = 3;

export const AI_PROBE_RATE_WINDOW_MS: number = 60_000;

@ApiTags("System status")
@ApiBearerAuth("JWT-auth")
@Controller("api/system")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemStatusController {
  public constructor(
    private readonly _getSystemStatusUseCase: GetSystemStatusUseCase,
    private readonly _probeAiProviderUseCase: ProbeAiProviderUseCase,
  ) {}

  @Get("status")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("system:status")
  @ApiOperation({
    summary: "Get system status",
    description:
      "Global state (OK, DEGRADED, DOWN) and per-component status of the database, MQTT broker, ventilator, AI providers (never calls a model), media storage and server process; cached for a few seconds. Changes are pushed as system:status-changed to admins and teachers",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "System status retrieved successfully", type: SystemStatusDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getSystemStatus(@I18n() i18n: I18nContext): Promise<APIResponse<SystemStatusDTO>> {
    const report: SystemStatusReport = await this._getSystemStatusUseCase.execute();

    return new APIResponseBuilder<SystemStatusDTO>()
      .setData(SystemStatusMapper.toDTO(report))
      .setMessage(await i18n.t("system-status.status_retrieved"))
      .build();
  }

  @Post("probe/ai/:provider")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("system:probe")
  @Throttle({ default: { limit: AI_PROBE_RATE_LIMIT, ttl: AI_PROBE_RATE_WINDOW_MS } })
  @ApiOperation({
    summary: "Probe an AI provider",
    description: "Makes one minimal real call to the provider through the AI gateway (tiny prompt, a few output tokens, short timeout), recorded in AI telemetry; a failed call is reported in the result, not as an error",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Probe finished", type: AiProbeDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Unknown AI provider" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "AI provider without configuration" })
  @ApiResponseDoc({ status: HttpStatus.TOO_MANY_REQUESTS, description: "Too many probes" })
  public async probeAiProvider(@Param("provider") provider: string, @I18n() i18n: I18nContext): Promise<APIResponse<AiProbeDTO>> {
    const result: AiProbeResult = await this._probeAiProviderUseCase.execute(provider);

    return new APIResponseBuilder<AiProbeDTO>()
      .setData(SystemStatusMapper.toProbeDTO(result))
      .setMessage(await i18n.t(result.ok ? "system-status.probe_succeeded" : "system-status.probe_failed"))
      .build();
  }
}
