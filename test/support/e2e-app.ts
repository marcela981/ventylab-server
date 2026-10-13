/*
 * Funcionalidad: Arranque de la aplicación para pruebas e2e
 * Descripción: Compila AppModule con @nestjs/testing reemplazando el registro de proveedores de IA por proveedores falsos, aplica la misma configuración HTTP y WebSocket que main.ts (proxy de confianza, cuerpos, CORS, adaptador Socket.io, TrimPipe e I18nValidationPipe), escucha en un puerto libre de 127.0.0.1 y verifica que base de datos, broker y proveedores de IA sean los de prueba antes de devolverla
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ConfigService } from "@nestjs/config";
import { type NestExpressApplication } from "@nestjs/platform-express";
import { Test, type TestingModule } from "@nestjs/testing";
import { I18nValidationPipe } from "nestjs-i18n";

import { AppModule } from "@/app.module";
import { buildCorsOrigin, CORS_ALLOWED_HEADERS, CORS_EXPOSED_HEADERS } from "@/common/infrastructure/config/cors-origins";
import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { TrimPipe } from "@/common/infrastructure/pipes/trim.pipe";
import { RealtimeIoAdapter } from "@/common/infrastructure/realtime/realtime-io.adapter";
import { AI_PROVIDERS_TOKEN, type AiProviderRegistry } from "@/features/ai/application/ports/llm-provider.interface";
import { isFakeAiProviderRegistry, scenarioLlmProvider, withFakeAiProviders } from "@/features/ai/application/testing/ai-provider-scenarios-test-doubles-spec";
import { type FakeLlmProvider } from "@/features/ai/application/testing/ai-test-doubles-spec";

import { assertLocalTestEnvironment } from "./test-env";

const BODY_SIZE_LIMIT: string = "10mb";

export interface E2eApp {
  readonly app: NestExpressApplication;
  readonly baseUrl: string;
  readonly prisma: PrismaService;
  readonly aiProviders: readonly FakeLlmProvider[];
  close(): Promise<void>;
}

export interface E2eAppOptions {
  readonly aiProviders?: readonly FakeLlmProvider[];
}

function defaultAiProviders(): FakeLlmProvider[] {
  return [scenarioLlmProvider("gemini", "success")];
}

function assertTestBindings(app: NestExpressApplication): void {
  const config: ConfigService<EnvironmentVariables, true> = app.get(ConfigService<EnvironmentVariables, true>);

  assertLocalTestEnvironment({
    NODE_ENV: config.get("NODE_ENV", { infer: true }),
    DATABASE_URL: config.get("DATABASE_URL", { infer: true }),
    DIRECT_URL: config.get("DIRECT_URL", { infer: true }),
    MQTT_BROKER_URL: config.get("MQTT_BROKER_URL", { infer: true }),
  });

  if (!isFakeAiProviderRegistry(app.get<AiProviderRegistry>(AI_PROVIDERS_TOKEN))) {
    throw new Error("Refusing to run e2e tests: the AI provider registry contains a real provider");
  }
}

export async function createE2eApp(options: E2eAppOptions = {}): Promise<E2eApp> {
  assertLocalTestEnvironment();

  const aiProviders: FakeLlmProvider[] = [...(options.aiProviders ?? defaultAiProviders())];
  const moduleRef: TestingModule = await withFakeAiProviders(Test.createTestingModule({ imports: [AppModule] }), ...aiProviders).compile();
  const app: NestExpressApplication = moduleRef.createNestApplication<NestExpressApplication>({ rawBody: true, logger: ["error", "warn"] });
  const config: ConfigService<EnvironmentVariables, true> = app.get(ConfigService<EnvironmentVariables, true>);

  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.useBodyParser("json", { limit: BODY_SIZE_LIMIT });
  app.useBodyParser("urlencoded", { extended: true, limit: BODY_SIZE_LIMIT });
  app.enableCors({
    origin: buildCorsOrigin(config),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [...CORS_ALLOWED_HEADERS],
    exposedHeaders: [...CORS_EXPOSED_HEADERS],
    credentials: true,
  });
  app.useWebSocketAdapter(new RealtimeIoAdapter(app, config));
  app.useGlobalPipes(new TrimPipe(), new I18nValidationPipe());

  assertTestBindings(app);

  await app.listen(0, "127.0.0.1");

  const address: unknown = app.getHttpServer().address();
  const port: number | undefined = typeof address === "object" && address !== null ? (address as { port: number }).port : undefined;

  if (port === undefined) {
    await app.close();

    throw new Error("The e2e app did not report its listening port");
  }

  return {
    app,
    baseUrl: `http://127.0.0.1:${port}`,
    prisma: app.get(PrismaService),
    aiProviders,
    close: (): Promise<void> => app.close(),
  };
}
