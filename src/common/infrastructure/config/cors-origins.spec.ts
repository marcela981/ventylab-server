/*
 * Funcionalidad: Pruebas de la configuración de CORS
 * Descripción: Verifica los orígenes permitidos explícitos, el comodín, las peticiones sin cabecera Origin y que las vistas previas de Vercel solo se acepten con CORS_ALLOW_VERCEL_PREVIEWS activo
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ConfigService } from "@nestjs/config";

import { buildAllowedOrigins, buildCorsOrigin, type CorsOrigin } from "@/common/infrastructure/config/cors-origins";
import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";

const PREVIEW_ORIGIN: string = "https://ventilab-web-git-feature-team.vercel.app";

function configWith(values: Partial<Record<keyof EnvironmentVariables, unknown>>): ConfigService<EnvironmentVariables, true> {
  const defaults: Partial<Record<keyof EnvironmentVariables, unknown>> = {
    CORS_ORIGIN: "http://localhost:3000",
    FRONTEND_URL: "https://app.example.com",
    PRODUCTION_URL: "https://ventilab.example.com/",
    VERCEL_URL: undefined,
    CORS_ALLOW_VERCEL_PREVIEWS: false,
  };
  const merged: Partial<Record<keyof EnvironmentVariables, unknown>> = { ...defaults, ...values };

  return { get: (key: keyof EnvironmentVariables): unknown => merged[key] } as unknown as ConfigService<EnvironmentVariables, true>;
}

function isAllowed(corsOrigin: CorsOrigin, origin: string | undefined): boolean | undefined {
  if (corsOrigin === "*") {
    return true;
  }

  let result: boolean | undefined;

  corsOrigin(origin, (_error: Error | null, allow?: boolean): void => {
    result = allow;
  });

  return result;
}

describe("buildAllowedOrigins", () => {
  it("parses the comma-separated CORS_ORIGIN list, adds FRONTEND_URL and PRODUCTION_URL, trims, drops trailing slashes and duplicates", () => {
    const config: ConfigService<EnvironmentVariables, true> = configWith({
      CORS_ORIGIN: " https://app.vercel.app/ ,http://localhost:3000,, https://app.example.com",
      FRONTEND_URL: "https://app.example.com/",
      PRODUCTION_URL: "",
    });

    const origins: string[] = buildAllowedOrigins(config);

    expect(origins).toEqual(["https://app.vercel.app", "http://localhost:3000", "https://app.example.com"]);
  });

  it("adds the VERCEL_URL deployment as an https origin", () => {
    const config: ConfigService<EnvironmentVariables, true> = configWith({ CORS_ORIGIN: "http://localhost:3000", VERCEL_URL: "ventilab-web.vercel.app" });

    const origins: string[] = buildAllowedOrigins(config);

    expect(origins).toContain("https://ventilab-web.vercel.app");
  });
});

describe("buildCorsOrigin", () => {
  it("allows configured origins and ignores a trailing slash", () => {
    const corsOrigin: CorsOrigin = buildCorsOrigin(configWith({}));

    expect(isAllowed(corsOrigin, "http://localhost:3000")).toBe(true);
    expect(isAllowed(corsOrigin, "https://ventilab.example.com")).toBe(true);
    expect(isAllowed(corsOrigin, "https://app.example.com/")).toBe(true);
  });

  it("allows requests without an Origin header", () => {
    const corsOrigin: CorsOrigin = buildCorsOrigin(configWith({}));

    expect(isAllowed(corsOrigin, undefined)).toBe(true);
  });

  it("rejects unknown origins", () => {
    const corsOrigin: CorsOrigin = buildCorsOrigin(configWith({}));

    expect(isAllowed(corsOrigin, "https://evil.example.com")).toBe(false);
  });

  it("rejects Vercel preview origins by default", () => {
    const corsOrigin: CorsOrigin = buildCorsOrigin(configWith({}));

    expect(isAllowed(corsOrigin, PREVIEW_ORIGIN)).toBe(false);
  });

  it("allows Vercel preview origins when CORS_ALLOW_VERCEL_PREVIEWS is enabled", () => {
    const corsOrigin: CorsOrigin = buildCorsOrigin(configWith({ CORS_ALLOW_VERCEL_PREVIEWS: true }));

    expect(isAllowed(corsOrigin, PREVIEW_ORIGIN)).toBe(true);
    expect(isAllowed(corsOrigin, "https://vercel.app.evil.example.com")).toBe(false);
  });

  it("allows the deployment named by VERCEL_URL without enabling previews", () => {
    const corsOrigin: CorsOrigin = buildCorsOrigin(configWith({ VERCEL_URL: "ventilab-web.vercel.app" }));

    expect(isAllowed(corsOrigin, "https://ventilab-web.vercel.app")).toBe(true);
    expect(isAllowed(corsOrigin, PREVIEW_ORIGIN)).toBe(false);
  });

  it("returns the wildcard when CORS_ORIGIN contains *", () => {
    const corsOrigin: CorsOrigin = buildCorsOrigin(configWith({ CORS_ORIGIN: "*" }));

    expect(corsOrigin).toBe("*");
  });
});
