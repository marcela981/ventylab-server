/*
 * Funcionalidad: Arranque de la aplicación
 * Descripción: Crea la aplicación NestJS con logger estructurado, endurecimiento HTTP compartido (x-powered-by desactivado, helmet con CSP, límites de cuerpo y CORS restringido a los orígenes configurados), compresión (excepto respuestas text/event-stream), redacción de secretos y correos en los eventos de Sentry, adaptador de Socket.io, pipes globales de validación (con transformación de DTOs para aplicar valores por defecto y conversiones de tipo) y documentación de la API (abierta fuera de producción; en producción solo para un token de ADMIN, con SWAGGER_ALLOWED_IPS como restricción adicional)
 * Versión: 1.5
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
import { I18nValidationPipe } from "nestjs-i18n";

import { AppModule } from "@/app.module";
import { Environment, type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { setupDocs } from "@/common/infrastructure/docs/setup-docs";
import { applyHttpHardening } from "@/common/infrastructure/http/http-hardening";
import { AppLogger } from "@/common/infrastructure/logging/app-logger.service";
import { registerSentryRedaction } from "@/common/infrastructure/logging/sentry-redaction";
import { TrimPipe } from "@/common/infrastructure/pipes/trim.pipe";
import { RealtimeIoAdapter } from "@/common/infrastructure/realtime/realtime-io.adapter";
import { ROLE_PERMISSIONS } from "@/features/authorization/domain/role-permissions";
import { USER_ROLE_VALUES } from "@/features/users/domain/value-objects/user-role";

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
  registerSentryRedaction();

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

  applyHttpHardening(app, configService);

  app.use(compression({ filter: shouldCompress }));

  app.useWebSocketAdapter(new RealtimeIoAdapter(app, configService));

  app.useGlobalPipes(
    new TrimPipe(),
    new I18nValidationPipe({ transform: true }),
  );

  setupDocs(app, {
    isProduction,
    allowedIps: configService.get("SWAGGER_ALLOWED_IPS", { infer: true }),
    roles: { hierarchy: USER_ROLE_VALUES, permissions: ROLE_PERMISSIONS },
  });

  await app.listen(configService.get("PORT", { infer: true }), "0.0.0.0");
}

bootstrap();
