/*
 * Funcionalidad: Aplicación Nest para pruebas de integración
 * Descripción: Compila AppModule con @nestjs/testing contra el PostgreSQL de Testcontainers con proveedores de IA falsos y la inicializa sin escuchar en ningún puerto, para resolver casos de uso, repositorios y el gestor de transacciones reales; verifica que la base de datos sea local y que no haya proveedores de IA reales
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";

import { AppModule } from "@/app.module";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { AI_PROVIDERS_TOKEN, type AiProviderRegistry } from "@/features/ai/application/ports/llm-provider.interface";
import { isFakeAiProviderRegistry, scenarioLlmProvider, withFakeAiProviders } from "@/features/ai/application/testing/ai-provider-scenarios-test-doubles-spec";

import { assertLocalTestEnvironment } from "./test-env";

export interface IntegrationApp {
  readonly app: INestApplication;
  readonly prisma: PrismaService;
  close(): Promise<void>;
}

export async function createIntegrationApp(): Promise<IntegrationApp> {
  assertLocalTestEnvironment();

  const moduleRef: TestingModule = await withFakeAiProviders(Test.createTestingModule({ imports: [AppModule] }), scenarioLlmProvider("gemini", "success")).compile();
  const app: INestApplication = moduleRef.createNestApplication({ logger: ["error"] });

  if (!isFakeAiProviderRegistry(app.get<AiProviderRegistry>(AI_PROVIDERS_TOKEN))) {
    throw new Error("Refusing to run integration tests: the AI provider registry contains a real provider");
  }

  await app.init();

  return { app, prisma: app.get(PrismaService), close: (): Promise<void> => app.close() };
}
