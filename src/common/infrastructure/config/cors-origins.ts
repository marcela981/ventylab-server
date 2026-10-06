/*
 * Funcionalidad: Configuración de CORS
 * Descripción: Construye los orígenes permitidos a partir de CORS_ORIGIN, FRONTEND_URL, PRODUCTION_URL y VERCEL_URL, y define las cabeceras permitidas y expuestas compartidas por HTTP y Socket.io
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";

type CorsOriginCallback = (error: Error | null, allow?: boolean) => void;

export type CorsOrigin = "*" | ((origin: string | undefined, callback: CorsOriginCallback) => void);

export const TRACE_ID_HEADER: string = "x-trace-id";

export const REQUEST_ID_HEADER: string = "x-request-id";

export const CORS_ALLOWED_HEADERS: readonly string[] = [
  "Accept",
  "Accept-Language",
  "Authorization",
  "Cache-Control",
  "Content-Type",
  "Pragma",
  "X-Requested-With",
  "x-lang",
  "x-admin-api-key",
  "x-nextauth-bridge-secret",
  TRACE_ID_HEADER,
  REQUEST_ID_HEADER,
];

export const CORS_EXPOSED_HEADERS: readonly string[] = [
  "Content-Disposition",
  TRACE_ID_HEADER,
  REQUEST_ID_HEADER,
];

const VERCEL_PREVIEW_ORIGIN_PATTERN: RegExp = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.vercel\.app$/i;

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, "");
}

export function buildAllowedOrigins(configService: ConfigService<EnvironmentVariables, true>): string[] {
  const rawCorsOrigin: string = configService.get("CORS_ORIGIN", { infer: true });
  const vercelUrl: string | undefined = configService.get("VERCEL_URL", { infer: true });

  const origins: string[] = [
    ...rawCorsOrigin.split(","),
    configService.get("FRONTEND_URL", { infer: true }),
    configService.get("PRODUCTION_URL", { infer: true }),
    vercelUrl ? `https://${vercelUrl}` : "",
  ]
    .map((origin: string) => normalizeOrigin(origin))
    .filter((origin: string) => origin.length > 0);

  return [...new Set(origins)];
}

export function buildCorsOrigin(configService: ConfigService<EnvironmentVariables, true>): CorsOrigin {
  const allowedOrigins: string[] = buildAllowedOrigins(configService);

  if (allowedOrigins.includes("*")) {
    return "*";
  }

  return (origin: string | undefined, callback: CorsOriginCallback): void => {
    // Requests without an Origin header (curl, server-to-server, health probes) are not subject to CORS.
    if (!origin) {
      callback(null, true);

      return;
    }

    const normalizedOrigin: string = normalizeOrigin(origin);

    callback(null, allowedOrigins.includes(normalizedOrigin) || VERCEL_PREVIEW_ORIGIN_PATTERN.test(normalizedOrigin));
  };
}
