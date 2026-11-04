/*
 * Funcionalidad: Adaptador del ejecutor de evaluación hacia el código de IA del servidor
 * Descripción: Único punto del protocolo de evaluación que importa src/. Construye el prompt con las mismas funciones que usa la aplicación (registro de plantillas versionadas, entrada estructurada de GRADE_FEEDBACK, instantánea de SIM_ASSIST, limpieza de correos y hash del prompt del gateway), toma la versión del prompt como el gateway (variante construida), resuelve modelo, temperatura, tokens y tiempo máximo con los ajustes por caso de uso (AI_USE_CASE_SETTINGS) y el costo con los precios (AI_PRICES y AI_EXTERNAL_PRICE_*), y crea los proveedores reales con las mismas variables de entorno que el servidor (incluido el proveedor externo AI_EXTERNAL_*), sin cadena de respaldo, sin reintentos ni cortocircuito: se llama a un único proveedor por vez
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 *
 * NOTE (keep in sync): every import from src/ lives in this file on purpose. When a prompt template, its input or the
 * provider factory changes in src/features/ai, update the imports and the per-use-case mapping in buildPrompt() below
 * (GRADE_FEEDBACK mirrors AIGradeFeedbackGenerator._promptInput); run-eval.ts and lib/ need no change.
 * Real providers are imported lazily so that --dry-run only loads pure domain code (no SDKs, no network).
 */
import { type GradeFeedbackPromptInput } from "@/features/ai/domain/prompts/grade-feedback-prompt";
import { computePromptHash } from "@/features/ai/domain/prompts/prompt-hash";
import { redactPersonalData, stripEmails } from "@/features/ai/domain/prompts/personal-data-guard";
import {
  type ConversationPromptInput,
  getPromptTemplate,
  type PageDeepenPromptInput,
  type SimAssistPromptInput,
} from "@/features/ai/domain/prompts/prompt-registry";
import { type AiMessage, type BuiltPrompt, type PromptTemplate } from "@/features/ai/domain/prompts/prompt-template";
import { estimateAiCostUsd } from "@/features/ai/domain/services/ai-cost-estimation";
import { buildAiSettingsSnapshot, ConfigAiSettingsProvider } from "@/features/ai/infrastructure/config/ai-settings.provider";
import { MAX_GRADE } from "@/features/evaluation/domain/services/deterministic-grade-feedback";
import { parseGradeFeedbackResponse } from "@/features/evaluation/domain/services/grade-feedback-prompt";
import { type GradeFeedbackContext, type GradeFeedbackQuestionContext } from "@/features/evaluation/domain/value-objects/grade-feedback";
import { type AssistSnapshotInput, buildAssistSnapshot } from "@/features/simulation/domain/assist/assist-snapshot";

import type { EvalCallSettings, EvalMessage, EvalPrompt, EvalProvider, EvalScenario } from "../lib/types.ts";

// Same variable names as src/features/ai/infrastructure/config/ai-providers.config.ts (readAiProvidersConfig).
export const PROVIDER_SECRET_ENV_VARS: readonly string[] = ["GEMINI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "AI_EXTERNAL_API_KEY"];

// Defaults mirror EnvironmentVariables (src/common/infrastructure/config/env.validation.ts); they do not affect a single direct call.
const DEFAULT_BREAKER_FAILURE_THRESHOLD: number = 3;
const DEFAULT_BREAKER_OPEN_SECONDS: number = 60;
const DEFAULT_TUTOR_HISTORY_WINDOW: number = 10;
const DEFAULT_TUTOR_CONTEXT_TOKEN_BUDGET: number = 6000;

// Same version the gateway records: a template with input variants reports the variant actually built (AiGateway._prepare).
function promptVersion<TInput>(template: PromptTemplate<TInput>, input: TInput): string {
  return template.versionFor?.(input) ?? template.version;
}

function toEvalPrompt(scenario: EvalScenario, version: string, built: BuiltPrompt): EvalPrompt {
  // Same normalization as AiGateway._prepare: emails are stripped and the hash is taken over the stripped prompt.
  const system: string = stripEmails(built.system);
  const messages: AiMessage[] = built.messages.map((message: AiMessage) => ({ role: message.role, content: stripEmails(message.content) }));

  return {
    useCase: scenario.useCase,
    promptVersion: version,
    promptHash: computePromptHash(system, messages),
    language: scenario.language,
    system,
    messages: messages as EvalMessage[],
    responseFormat: built.responseFormat,
  };
}

// Mirrors AIGradeFeedbackGenerator._promptInput: structured input of the registry template (GRADE_FEEDBACK 2.0.0) in the
// scenario language. Scenarios carry no student names, so there are no identifiers to redact (emails are still removed).
function gradeFeedbackPromptInput(context: GradeFeedbackContext, language: "es" | "en"): GradeFeedbackPromptInput {
  return {
    evaluationType: context.evaluation.type,
    evaluationTitle: context.evaluation.title,
    grade: context.grade,
    maxGrade: MAX_GRADE,
    passingGrade: context.passingGrade,
    questions: context.questions.map((question: GradeFeedbackQuestionContext) => ({ ...question, studentAnswerText: redactPersonalData(question.studentAnswerText, []) })),
    language,
  };
}

export function buildPrompt(scenario: EvalScenario): EvalPrompt {
  const language: "es" | "en" = scenario.language;

  switch (scenario.useCase) {
    case "SIM_ASSIST": {
      // Mirrors AssistSimulationUseCase: snapshot of the session + redacted question (scenarios carry no student names).
      const input: { snapshot: AssistSnapshotInput; question?: string } = scenario.input as never;
      const template = getPromptTemplate("SIM_ASSIST");
      const promptInput: SimAssistPromptInput = {
        simulationState: buildAssistSnapshot(input.snapshot),
        question: redactPersonalData(input.question?.trim() ?? "", []),
        language,
      };

      return toEvalPrompt(scenario, promptVersion(template, promptInput), template.build(promptInput));
    }
    case "GRADE_FEEDBACK": {
      const input: { context: GradeFeedbackContext } = scenario.input as never;
      const template = getPromptTemplate("GRADE_FEEDBACK");
      const promptInput: GradeFeedbackPromptInput = gradeFeedbackPromptInput(input.context, language);

      return toEvalPrompt(scenario, promptVersion(template, promptInput), template.build(promptInput));
    }
    case "LESSON_QA": {
      const input: Omit<ConversationPromptInput, "language"> = scenario.input as never;
      const template = getPromptTemplate("LESSON_QA");
      const promptInput: ConversationPromptInput = { ...input, language };

      return toEvalPrompt(scenario, promptVersion(template, promptInput), template.build(promptInput));
    }
    case "PAGE_DEEPEN": {
      const input: Omit<PageDeepenPromptInput, "language"> = scenario.input as never;
      const template = getPromptTemplate("PAGE_DEEPEN");
      const promptInput: PageDeepenPromptInput = { ...input, language };

      return toEvalPrompt(scenario, promptVersion(template, promptInput), template.build(promptInput));
    }
    default:
      throw new Error(`Unsupported use case ${String((scenario as EvalScenario).useCase)}`);
  }
}

// GRADE_FEEDBACK output is only usable by the app if the server parser accepts it; other use cases are free text.
export function checkOutput(scenario: EvalScenario, text: string): { parseOk?: boolean } {
  if (scenario.useCase !== "GRADE_FEEDBACK") {
    return {};
  }

  const input: { context: GradeFeedbackContext } = scenario.input as never;

  return { parseOk: parseGradeFeedbackResponse(text, input.context) !== undefined };
}

export interface ServerSettings {
  callSettings(useCase: EvalScenario["useCase"], providerId: string): EvalCallSettings;
  costUsd(providerId: string, model: string, inputTokens: number | undefined, outputTokens: number | undefined): number | undefined;
}

function optionalNumber(value: string | undefined): number | undefined {
  return value === undefined || value.trim() === "" ? undefined : Number(value);
}

export function loadServerSettings(env: NodeJS.ProcessEnv): ServerSettings {
  const settings: ConfigAiSettingsProvider = new ConfigAiSettingsProvider(
    buildAiSettingsSnapshot({
      useCaseSettingsJson: env.AI_USE_CASE_SETTINGS,
      quotasJson: env.AI_QUOTAS,
      pricesJson: env.AI_PRICES,
      breakerFailureThreshold: DEFAULT_BREAKER_FAILURE_THRESHOLD,
      breakerOpenSeconds: DEFAULT_BREAKER_OPEN_SECONDS,
      tutorHistoryWindow: DEFAULT_TUTOR_HISTORY_WINDOW,
      tutorContextTokenBudget: DEFAULT_TUTOR_CONTEXT_TOKEN_BUDGET,
      externalModel: env.AI_EXTERNAL_MODEL,
      externalPriceInputPerMTok: optionalNumber(env.AI_EXTERNAL_PRICE_INPUT_PER_MTOK),
      externalPriceOutputPerMTok: optionalNumber(env.AI_EXTERNAL_PRICE_OUTPUT_PER_MTOK),
    }),
  );

  return {
    callSettings: (useCase: EvalScenario["useCase"], providerId: string): EvalCallSettings => {
      const useCaseSettings = settings.getUseCaseSettings(useCase);

      return {
        model: useCaseSettings.models[providerId] ?? "default",
        maxOutputTokens: useCaseSettings.maxOutputTokens,
        temperature: useCaseSettings.temperature,
        timeoutMs: useCaseSettings.timeoutMs,
      };
    },
    costUsd: (providerId: string, model: string, inputTokens: number | undefined, outputTokens: number | undefined): number | undefined =>
      estimateAiCostUsd(settings.getPrice(providerId, model), inputTokens, outputTokens),
  };
}

// Builds the same registry as the server (readAiProvidersConfig): gemini/openai/anthropic when their key is set, and the
// third-party `external` provider when AI_EXTERNAL_BASE_URL and AI_EXTERNAL_MODEL are set. Keys are never logged.
export async function createRealProviders(env: NodeJS.ProcessEnv): Promise<Map<string, EvalProvider>> {
  const { buildAiProviderRegistry } = await import("@/features/ai/infrastructure/providers/ai-providers.factory.ts");
  const registry = buildAiProviderRegistry({
    geminiApiKey: env.GEMINI_API_KEY,
    openaiApiKey: env.OPENAI_API_KEY,
    openaiBaseUrl: env.OPENAI_BASE_URL,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    anthropicBaseUrl: env.ANTHROPIC_BASE_URL,
    externalBaseUrl: env.AI_EXTERNAL_BASE_URL,
    externalApiKey: env.AI_EXTERNAL_API_KEY,
    externalAuthHeader: env.AI_EXTERNAL_AUTH_HEADER,
    externalModel: env.AI_EXTERNAL_MODEL,
    externalFormat: env.AI_EXTERNAL_FORMAT === "simple" ? "simple" : "openai",
    // 0 or unset means no own timeout, as on the server; the per-use-case timeout of the runner still applies.
    externalTimeoutMs: optionalNumber(env.AI_EXTERNAL_TIMEOUT_MS),
  });

  return new Map<string, EvalProvider>([...registry.entries()].map(([id, provider]) => [id, provider as unknown as EvalProvider]));
}
