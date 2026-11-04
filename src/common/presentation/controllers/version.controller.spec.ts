/*
 * Funcionalidad: Pruebas de VersionController
 * Descripción: Verifica que GET /api/version devuelve exactamente sha, builtAt y contract; que usa APP_GIT_SHA y, si falta, APP_COMMIT_SHA; que normaliza APP_BUILD_DATE a ISO 8601; que responde "unknown" cuando los valores faltan, están vacíos o no son válidos; y que la ruta es cruda y omite el limitador
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { API_CONTRACT_VERSION } from "@/common/presentation/api-contract-version";
import { UNKNOWN_BUILD_VALUE, VersionController, type VersionInfo } from "@/common/presentation/controllers/version.controller";
import { RAW_RESPONSE_KEY } from "@/common/presentation/decorators/raw-response.decorator";

function buildController(values: Partial<Record<keyof EnvironmentVariables, string>>): VersionController {
  const config: ConfigService<EnvironmentVariables, true> = {
    get: jest.fn((key: keyof EnvironmentVariables): string | undefined => values[key]),
  } as unknown as ConfigService<EnvironmentVariables, true>;

  return new VersionController(config);
}

describe("VersionController", () => {
  it("returns exactly the baked sha, the ISO build date and the contract version", () => {
    const result: VersionInfo = buildController({ APP_GIT_SHA: "3f2c1ab", APP_BUILD_DATE: "2026-11-04T00:49:37Z" }).version();

    expect(result).toStrictEqual({ sha: "3f2c1ab", builtAt: "2026-11-04T00:49:37.000Z", contract: API_CONTRACT_VERSION });
    expect(Object.keys(result)).toEqual(["sha", "builtAt", "contract"]);
  });

  it("falls back to APP_COMMIT_SHA when APP_GIT_SHA is missing, blank or unknown", () => {
    expect(buildController({ APP_COMMIT_SHA: "abc1234" }).version().sha).toBe("abc1234");
    expect(buildController({ APP_GIT_SHA: "  ", APP_COMMIT_SHA: "abc1234" }).version().sha).toBe("abc1234");
    expect(buildController({ APP_GIT_SHA: "unknown", APP_COMMIT_SHA: "abc1234" }).version().sha).toBe("abc1234");
  });

  it("reports unknown when nothing was baked into the image", () => {
    expect(buildController({}).version()).toStrictEqual({ sha: UNKNOWN_BUILD_VALUE, builtAt: UNKNOWN_BUILD_VALUE, contract: API_CONTRACT_VERSION });
    expect(buildController({ APP_GIT_SHA: "", APP_BUILD_DATE: "" }).version()).toStrictEqual({ sha: UNKNOWN_BUILD_VALUE, builtAt: UNKNOWN_BUILD_VALUE, contract: API_CONTRACT_VERSION });
  });

  it("reports unknown for a build date that is not a date", () => {
    expect(buildController({ APP_BUILD_DATE: "unknown" }).version().builtAt).toBe(UNKNOWN_BUILD_VALUE);
    expect(buildController({ APP_BUILD_DATE: "yesterday" }).version().builtAt).toBe(UNKNOWN_BUILD_VALUE);
  });

  it("starts at contract version 1", () => {
    expect(API_CONTRACT_VERSION).toBe(1);
  });

  it("is a raw response that stays under the global rate limiter", () => {
    const keys: string[] = Reflect.getMetadataKeys(VersionController);
    const skips: boolean = keys.some((key: string) => typeof key === "string" && key.startsWith("THROTTLER:SKIP") && Reflect.getMetadata(key, VersionController) === true);

    expect(skips).toBe(false);
    expect(Reflect.getMetadata(RAW_RESPONSE_KEY, VersionController)).toBe(true);
  });
});
