/*
 * Funcionalidad: Controlador VersionController
 * Descripción: Expone en GET /api/version, pública, sujeta al limitador de peticiones global y sin el envoltorio APIResponse, el commit (APP_GIT_SHA, o APP_COMMIT_SHA/GIT_COMMIT si falta) y la fecha de construcción (APP_BUILD_DATE normalizada a ISO 8601) incrustados en la imagen, con "unknown" cuando faltan o no son válidos, y la versión del contrato de la API
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { API_CONTRACT_VERSION } from "@/common/presentation/api-contract-version";
import { RawResponse } from "@/common/presentation/decorators/raw-response.decorator";
import { VersionInfoDTO } from "@/common/presentation/dtos/version-info.dto";

export const UNKNOWN_BUILD_VALUE: string = "unknown";

export interface VersionInfo {
  sha: string;
  builtAt: string;
  contract: number;
}

function normalizeSha(...candidates: (string | undefined)[]): string {
  const sha: string | undefined = candidates.map((candidate: string | undefined): string => candidate?.trim() ?? "").find((candidate: string): boolean => candidate !== "" && candidate !== UNKNOWN_BUILD_VALUE);

  return sha ?? UNKNOWN_BUILD_VALUE;
}

function normalizeBuildDate(value: string | undefined): string {
  const trimmed: string = value?.trim() ?? "";
  const timestamp: number = trimmed === "" ? Number.NaN : Date.parse(trimmed);

  return Number.isNaN(timestamp) ? UNKNOWN_BUILD_VALUE : new Date(timestamp).toISOString();
}

@RawResponse()
@ApiTags("Health")
@Controller()
export class VersionController {
  private readonly _versionInfo: VersionInfo;

  public constructor(configService: ConfigService<EnvironmentVariables, true>) {
    this._versionInfo = {
      sha: normalizeSha(configService.get("APP_GIT_SHA", { infer: true }), configService.get("APP_COMMIT_SHA", { infer: true })),
      builtAt: normalizeBuildDate(configService.get("APP_BUILD_DATE", { infer: true })),
      contract: API_CONTRACT_VERSION,
    };
  }

  @Get("api/version")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Deployed version", description: "Returns the commit and build date baked into the running image and the API contract version" })
  @ApiResponse({ status: HttpStatus.OK, description: "Version of the running backend", type: VersionInfoDTO })
  public version(): VersionInfo {
    return { ...this._versionInfo };
  }
}
