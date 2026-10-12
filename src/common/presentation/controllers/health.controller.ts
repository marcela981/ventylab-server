/*
 * Funcionalidad: Controlador HealthController
 * Descripción: Expone la vida del servicio en /, /health y /api/health y su preparación en /health/ready y /api/health/ready, que responde 503 cuando la base de datos no contesta un SELECT 1 dentro de HEALTH_CHECK_TIMEOUT_MS; ambas rutas son públicas, sin detalles internos y fuera del limitador de peticiones
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Get, HttpCode, HttpStatus, Inject, Logger, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { type Response } from "express";

import { DATABASE_HEALTH_PROBE_TOKEN, type IDatabaseHealthProbe } from "@/common/application/ports/database-health-probe.interface";
import { withTimeout } from "@/common/domain/utils/with-timeout";
import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";

export const READY_STATUS: string = "ready";

export const NOT_READY_STATUS: string = "not_ready";

@SkipThrottle()
@ApiTags("Health")
@Controller()
export class HealthController {
  private readonly _logger: Logger = new Logger(HealthController.name);

  public constructor(
    @Inject(DATABASE_HEALTH_PROBE_TOKEN)
    private readonly _databaseProbe: IDatabaseHealthProbe,
    private readonly _configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Get(["", "health", "api/health"])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Healthcheck", description: "Returns OK if the application is running" })
  @ApiResponse({ status: HttpStatus.OK, description: "Application is healthy" })
  public healthcheck(): { status: string; timestamp: string } {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  @Get(["health/ready", "api/health/ready"])
  @ApiOperation({ summary: "Readiness check", description: "Returns ready when the database answers a minimal query within the health check timeout" })
  @ApiResponse({ status: HttpStatus.OK, description: "Application is ready to serve traffic" })
  @ApiResponse({ status: HttpStatus.SERVICE_UNAVAILABLE, description: "A required dependency is not reachable" })
  public async readiness(@Res({ passthrough: true }) response: Response): Promise<{ status: string }> {
    const ready: boolean = await this._isDatabaseReachable();

    response.status(ready ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);

    return { status: ready ? READY_STATUS : NOT_READY_STATUS };
  }

  private async _isDatabaseReachable(): Promise<boolean> {
    const timeoutMs: number = this._configService.get("HEALTH_CHECK_TIMEOUT_MS", { infer: true });

    try {
      await withTimeout(this._databaseProbe.ping(), timeoutMs);

      return true;
    } catch (error: unknown) {
      this._logger.warn(`Readiness check failed: ${error instanceof Error ? error.name : "UnknownError"}`);

      return false;
    }
  }
}
