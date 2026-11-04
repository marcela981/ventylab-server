/*
 * Funcionalidad: Tipos del protocolo de evaluación de la retroalimentación de IA
 * Descripción: Contratos compartidos por el ejecutor de evaluación (escenarios, prompt construido, solicitud y fragmentos del proveedor, registro de resultado y puntaje auxiliar automático). No importan nada de src/ para que el escritor de resultados, el puntaje y el proveedor falso se puedan probar con `node --test` sin dependencias instaladas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

export type EvalUseCase = "SIM_ASSIST" | "GRADE_FEEDBACK" | "LESSON_QA" | "PAGE_DEEPEN";

export const EVAL_USE_CASES: readonly EvalUseCase[] = ["SIM_ASSIST", "GRADE_FEEDBACK", "LESSON_QA", "PAGE_DEEPEN"];

export type ScenarioCategory = "simulador" | "evaluacion" | "leccion";

export interface ExpectedCriterion {
  readonly id: string;
  readonly description: string;
  // Auxiliary automatic score only: a criterion counts as covered when any keyword appears (case- and accent-insensitive).
  readonly keywords: readonly string[];
  readonly sourceRefs: readonly string[];
}

export interface SafetyRule {
  readonly id: string;
  readonly description: string;
  // Regular expressions evaluated on the normalized output; a match raises a flag for the expert, it is not a verdict.
  readonly patterns: readonly string[];
}

export interface ScenarioReference {
  readonly key: string;
  readonly apa: string;
}

export interface EvalScenario {
  readonly id: string;
  readonly category: ScenarioCategory;
  readonly useCase: EvalUseCase;
  readonly language: "es" | "en";
  readonly title: string;
  readonly description: string;
  // Real input shape of the use case (see adapters/server-ai.adapter.ts for the mapping to the server prompt builders).
  readonly input: Record<string, unknown>;
  readonly expectedCriteria: readonly ExpectedCriterion[];
  readonly mustNotContain: readonly SafetyRule[];
  readonly references: readonly ScenarioReference[];
  readonly notes?: string;
  readonly validationStatus: string;
}

export type EvalMessageRole = "user" | "assistant";

export interface EvalMessage {
  readonly role: EvalMessageRole;
  readonly content: string;
}

export interface EvalPrompt {
  readonly useCase: EvalUseCase;
  readonly promptVersion: string;
  readonly promptHash: string;
  readonly system: string;
  readonly messages: readonly EvalMessage[];
  readonly responseFormat: "text" | "json";
}

export interface EvalCallSettings {
  readonly model: string;
  readonly maxOutputTokens: number;
  readonly temperature: number;
  readonly timeoutMs: number;
}

export interface EvalRequest {
  readonly model: string;
  readonly system: string;
  readonly messages: readonly EvalMessage[];
  readonly maxOutputTokens: number;
  readonly temperature: number;
  readonly responseFormat?: "text" | "json";
}

export interface EvalCompletion {
  readonly text: string;
  readonly model: string;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
}

export type EvalChunk = { readonly type: "delta"; readonly text: string } | { readonly type: "final"; readonly completion: EvalCompletion };

// Structurally identical to ILlmProvider (src/features/ai/application/ports/llm-provider.interface.ts) for the streaming path.
export interface EvalProvider {
  readonly id: string;
  stream(request: EvalRequest, signal: AbortSignal): AsyncIterable<EvalChunk>;
}

export interface CriterionScore {
  readonly id: string;
  readonly covered: boolean;
  readonly matchedKeyword?: string;
}

export interface SafetyFlag {
  readonly id: string;
  readonly matchedPattern: string;
}

export interface AutoScore {
  readonly label: string;
  readonly criteriaCovered: number;
  readonly criteriaTotal: number;
  readonly coverage: number;
  readonly criteria: readonly CriterionScore[];
  readonly safetyFlags: readonly SafetyFlag[];
}

export type EvalCallStatus = "ok" | "error" | "timeout";

export interface EvalResultRecord {
  readonly runId: string;
  readonly timestamp: string;
  readonly dryRun: boolean;
  readonly scenarioId: string;
  readonly category: ScenarioCategory;
  readonly useCase: EvalUseCase;
  readonly language: string;
  readonly provider: string;
  readonly model: string;
  readonly promptVersion: string;
  readonly promptHash: string;
  readonly repetition: number;
  readonly settings: { readonly temperature: number; readonly maxOutputTokens: number; readonly timeoutMs: number };
  readonly status: EvalCallStatus;
  readonly errorName?: string;
  readonly errorMessage?: string;
  readonly ttftMs?: number;
  readonly totalMs: number;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly costUsd?: number;
  readonly outputText: string;
  readonly outputChars: number;
  // GRADE_FEEDBACK only: whether the server parser (parseGradeFeedbackResponse) accepts the output.
  readonly parseOk?: boolean;
  readonly autoScore: AutoScore;
  readonly prompt: { readonly system: string; readonly messages: readonly EvalMessage[]; readonly responseFormat: "text" | "json" };
}
