/*
 * Funcionalidad: Endurecimiento HTTP de la aplicación
 * Descripción: Configuración HTTP compartida por main.ts y la aplicación de pruebas e2e: desactiva x-powered-by, aplica helmet (CSP por defecto en las respuestas de la API y una CSP propia para la interfaz de documentación, que carga Scalar desde jsDelivr), límites de tamaño de los cuerpos JSON y urlencoded, y CORS restringido a los orígenes configurados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ConfigService } from "@nestjs/config";
import { type NestExpressApplication } from "@nestjs/platform-express";
import { type NextFunction, type Request, type RequestHandler, type Response } from "express";
import helmet from "helmet";

import { buildCorsOrigin, CORS_ALLOWED_HEADERS, CORS_EXPOSED_HEADERS } from "@/common/infrastructure/config/cors-origins";
import { Environment, type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { DOCS_UI_PATH } from "@/common/infrastructure/docs/setup-docs";

// The largest legitimate JSON bodies are a profile image sent as a base64 data URL and rich page content without a block count limit; 10 MB covers both.
export const JSON_BODY_LIMIT: string = "10mb";

// No route consumes HTML forms; the parser stays registered so a form post is validated instead of reaching handlers unparsed.
export const URLENCODED_BODY_LIMIT: string = "100kb";

export const CORS_METHODS: readonly string[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

const SCALAR_CDN_ORIGIN: string = "https://cdn.jsdelivr.net";

// The Scalar page loads its bundle from jsDelivr, starts it with an inline script and fetches the document from this origin.
export const DOCS_CONTENT_SECURITY_POLICY_DIRECTIVES: Readonly<Record<string, readonly string[]>> = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", SCALAR_CDN_ORIGIN],
  styleSrc: ["'self'", "'unsafe-inline'", "https:"],
  fontSrc: ["'self'", "https:", "data:"],
  imgSrc: ["'self'", "https:", "data:"],
  connectSrc: ["'self'"],
  workerSrc: ["'self'", "blob:"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  frameAncestors: ["'none'"],
};

function withoutContentSecurityPolicy(_req: Request, res: Response, next: NextFunction): void {
  res.removeHeader("Content-Security-Policy");
  next();
}

// Outside production the documentation page keeps no CSP, so the interactive UI behaves exactly as Scalar ships it while developing.
export function docsContentSecurityPolicy(isProduction: boolean): RequestHandler {
  if (!isProduction) {
    return withoutContentSecurityPolicy;
  }

  return helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: Object.fromEntries(Object.entries(DOCS_CONTENT_SECURITY_POLICY_DIRECTIVES).map(([name, values]: [string, readonly string[]]): [string, string[]] => [name, [...values]])),
  });
}

export function applyHttpHardening(app: NestExpressApplication, configService: ConfigService<EnvironmentVariables, true>): void {
  const isProduction: boolean = configService.get("NODE_ENV", { infer: true }) === Environment.Production;

  app.disable("x-powered-by");

  // The frontend consumes this API from another origin; helmet's default CORP/COOP policies
  // would make the browser block legitimate CORS responses, so CORS alone governs cross-site access.
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
  }));
  app.use(DOCS_UI_PATH, docsContentSecurityPolicy(isProduction));

  app.useBodyParser("json", { limit: JSON_BODY_LIMIT });
  app.useBodyParser("urlencoded", { extended: true, limit: URLENCODED_BODY_LIMIT });

  app.enableCors({
    origin: buildCorsOrigin(configService),
    methods: [...CORS_METHODS],
    allowedHeaders: [...CORS_ALLOWED_HEADERS],
    // Content-Disposition lets the browser read download filenames; the trace headers let clients report a request id.
    exposedHeaders: [...CORS_EXPOSED_HEADERS],
    credentials: true,
  });
}
