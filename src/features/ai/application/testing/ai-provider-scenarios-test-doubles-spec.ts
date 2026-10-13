/*
 * Funcionalidad: Escenarios de proveedores LLM falsos
 * Descripción: Construye proveedores falsos que implementan ILlmProvider para los escenarios de prueba éxito, error 5xx (clasificado SERVER), tiempo límite (bloqueo hasta que el AbortSignal aborta) y stream parcial (entrega fragmentos y luego se corta con un error de red), y un ayudante de Nest que reemplaza el registro de proveedores de IA en el arranque de pruebas e2e para que ningún proveedor real pueda instanciarse
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type TestingModuleBuilder } from "@nestjs/testing";

import { AI_PROVIDERS_TOKEN, type AiProviderRegistry, type ILlmProvider } from "@/features/ai/application/ports/llm-provider.interface";
import { FakeLlmProvider, type FakeProviderBehavior, httpStatusError, providerRegistry } from "@/features/ai/application/testing/ai-test-doubles-spec";

export type AiProviderScenario = "success" | "server-error" | "timeout" | "partial-stream";

export const AI_PROVIDER_SCENARIOS: readonly AiProviderScenario[] = ["success", "server-error", "timeout", "partial-stream"];

export const SCENARIO_SUCCESS_TEXT: string = "Respuesta simulada del proveedor de prueba";

export const SCENARIO_PARTIAL_CHUNKS: readonly string[] = ["Respuesta ", "parcial "];

export interface AiProviderScenarioOptions {
  readonly text?: string;
  readonly status?: number;
}

export function connectionResetError(): Error {
  const error: Error & { code?: string } = new Error("Connection reset while reading the response body");

  error.code = "ECONNRESET";

  return error;
}

export function scenarioBehavior(scenario: AiProviderScenario, options: AiProviderScenarioOptions = {}): FakeProviderBehavior {
  switch (scenario) {
    case "success":
      return { kind: "text", text: options.text ?? SCENARIO_SUCCESS_TEXT, inputTokens: 10, outputTokens: 5 };
    case "server-error":
      return { kind: "error", error: httpStatusError(options.status ?? 503) };
    case "timeout":
      return { kind: "hang" };
    case "partial-stream":
      return { kind: "partial", chunks: [...SCENARIO_PARTIAL_CHUNKS], error: connectionResetError() };
  }
}

export function scenarioLlmProvider(id: string, scenario: AiProviderScenario, options: AiProviderScenarioOptions = {}): FakeLlmProvider {
  return new FakeLlmProvider(id, scenarioBehavior(scenario, options));
}

export function isFakeAiProviderRegistry(registry: AiProviderRegistry): boolean {
  return [...registry.values()].every((provider: ILlmProvider): boolean => provider instanceof FakeLlmProvider);
}

export function withFakeAiProviders(builder: TestingModuleBuilder, ...providers: FakeLlmProvider[]): TestingModuleBuilder {
  return builder.overrideProvider(AI_PROVIDERS_TOKEN).useValue(providerRegistry(...providers));
}
