/*
 * Funcionalidad: Arranque de la aplicación
 * Descripción: Crea la aplicación NestJS con logger estructurado, helmet, compresión (excepto respuestas text/event-stream), límites de cuerpo, CORS, adaptador de Socket.io, pipes globales de validación y documentación de la API
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
/* eslint-disable @typescript-eslint/no-floating-promises */

import "@/instrument";

import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { type NestExpressApplication } from "@nestjs/platform-express";
import compression from "compression";
import { type Request, type Response } from "express";
import helmet from "helmet";
import { I18nValidationPipe } from "nestjs-i18n";

import { AppModule } from "@/app.module";
import { buildCorsOrigin, CORS_ALLOWED_HEADERS, CORS_EXPOSED_HEADERS } from "@/common/infrastructure/config/cors-origins";
import { Environment, type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { setupDocs } from "@/common/infrastructure/docs/setup-docs";
import { AppLogger } from "@/common/infrastructure/logging/app-logger.service";
import { TrimPipe } from "@/common/infrastructure/pipes/trim.pipe";
import { RealtimeIoAdapter } from "@/common/infrastructure/realtime/realtime-io.adapter";

const BODY_SIZE_LIMIT: string = "10mb";

const EVENT_STREAM_CONTENT_TYPE: string = "text/event-stream";

// Compression buffers the body until enough bytes accumulate, which would hold server-sent events back from the client.
function shouldCompress(req: Request, res: Response): boolean {
  const contentType: unknown = res.getHeader("Content-Type");

  if (typeof contentType === "string" && contentType.startsWith(EVENT_STREAM_CONTENT_TYPE)) {
    return false;
  }

  return compression.filter(req, res);
}

async function bootstrap(): Promise<void> {
  // rawBody: true exposes req.rawBody (Buffer), needed to validate HMAC signatures
  // on webhook endpoints.
  const app: NestExpressApplication = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });

  app.useLogger(app.get(AppLogger));

  // Most reverse proxies forward the real client IP via X-Forwarded-For.
  // Setting trust proxy makes req.ip resolve to the real IP automatically.
  app.getHttpAdapter().getInstance().set("trust proxy", 1);

  app.enableShutdownHooks();

  const configService: ConfigService<EnvironmentVariables, true> = app.get(ConfigService<EnvironmentVariables, true>);
  const isProduction: boolean = configService.get("NODE_ENV", { infer: true }) === Environment.Production;

  // The frontend consumes this API from another origin; helmet's default CORP/COOP policies
  // would make the browser block legitimate CORS responses, so CORS alone governs cross-site access.
  app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
  }));

  app.use(compression({ filter: shouldCompress }));

  app.useBodyParser("json", { limit: BODY_SIZE_LIMIT });
  app.useBodyParser("urlencoded", { extended: true, limit: BODY_SIZE_LIMIT });

  app.enableCors({
    origin: buildCorsOrigin(configService),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [...CORS_ALLOWED_HEADERS],
    // Content-Disposition lets the browser read download filenames; the trace headers let clients report a request id.
    exposedHeaders: [...CORS_EXPOSED_HEADERS],
    credentials: true,
  });

  app.useWebSocketAdapter(new RealtimeIoAdapter(app, configService));

  app.useGlobalPipes(
    new TrimPipe(),
    new I18nValidationPipe(),
  );

  // API docs (Scalar) — access controlled by IP whitelist, not by NODE_ENV.
  // Set SWAGGER_ALLOWED_IPS=* for open access (local dev), or list specific IPs for restricted access.
  // Leave unset to disable docs entirely.
  const rawSwaggerAllowedIps: string | undefined = configService.get("SWAGGER_ALLOWED_IPS");

  if (rawSwaggerAllowedIps !== undefined) {
    const allowedIps: string[] = rawSwaggerAllowedIps.split(",").map((ip: string) => ip.trim());

    setupDocs(app, allowedIps);
  }

  await app.listen(configService.get("PORT", { infer: true }), "0.0.0.0");
}

bootstrap();
