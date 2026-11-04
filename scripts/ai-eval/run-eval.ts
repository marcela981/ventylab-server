/*
 * Funcionalidad: Ejecutor reproducible de la evaluación de la retroalimentación de IA
 * Descripción: Para cada escenario de scripts/ai-eval/scenarios y cada proveedor configurado (o el proveedor falso con --dry-run) construye el prompt con el código del servidor, llama en streaming a un único proveedor sin cadena de respaldo ni reintentos, mide TTFT y latencia total, registra tokens, costo estimado, versión y hash del prompt, salida cruda, validez del JSON de GRADE_FEEDBACK y un puntaje auxiliar automático, y guarda raw.jsonl, summary.csv y run-meta.json en scripts/ai-eval/results/<marca ISO>/. Nunca imprime ni guarda claves
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 *
 * Usage (from the server repository root, once dependencies are installed):
 *   npx tsx scripts/ai-eval/run-eval.ts --dry-run
 *   npx tsx scripts/ai-eval/run-eval.ts --providers gemini,openai,anthropic --repeat 3
 *   npx tsx scripts/ai-eval/run-eval.ts --scenarios sim-01,eval- --providers openai
 * Options:
 *   --dry-run              In-process fake provider, no network, results under results/dry-run-<stamp>/ (git-ignored)
 *   --providers a,b        Provider ids to call (default: every provider whose key is configured)
 *   --scenarios x,y        Scenario ids or id prefixes (default: all)
 *   --repeat N             Repetitions per scenario x provider (default 1)
 *   --env-file path        Env file to load (default: .env when it exists); existing process env wins
 *   --out dir              Results root (default scripts/ai-eval/results)
 * The AI code is being changed on feat/cierre-ia; all src/ imports are isolated in adapters/server-ai.adapter.ts.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { buildPrompt, checkOutput, createRealProviders, loadServerSettings, PROVIDER_SECRET_ENV_VARS, type ServerSettings } from "./adapters/server-ai.adapter.ts";
import { autoScore } from "./lib/auto-score.ts";
import { createFakeProvider, FAKE_MODEL, FAKE_PROVIDER_ID } from "./lib/fake-provider.ts";
import { redactSecrets, runStamp, writeResults } from "./lib/result-writers.ts";
import { loadScenarios } from "./lib/scenarios.ts";
import type { EvalCallSettings, EvalCompletion, EvalPrompt, EvalProvider, EvalResultRecord, EvalScenario } from "./lib/types.ts";

// The server package is CommonJS, so tsx runs this script as CommonJS and __dirname is defined.
const HERE: string = __dirname;
const MAX_ERROR_MESSAGE_LENGTH: number = 500;

interface CliOptions {
  readonly dryRun: boolean;
  readonly providers: string[];
  readonly scenarios: string[];
  readonly repeat: number;
  readonly envFile?: string;
  readonly out: string;
}

function parseList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item: string) => item.trim())
    .filter((item: string) => item.length > 0);
}

function parseArgs(argv: readonly string[]): CliOptions {
  const values: Map<string, string> = new Map<string, string>();
  const flags: Set<string> = new Set<string>();

  for (let index: number = 0; index < argv.length; index++) {
    const arg: string = argv[index];

    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument ${arg}`);
    }

    if (arg === "--dry-run") {
      flags.add(arg);
    } else {
      const value: string | undefined = argv[index + 1];

      if (value === undefined || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }

      values.set(arg, value);
      index++;
    }
  }

  const repeat: number = Number(values.get("--repeat") ?? "1");

  if (!Number.isInteger(repeat) || repeat < 1) {
    throw new Error("--repeat must be a positive integer");
  }

  return {
    dryRun: flags.has("--dry-run"),
    providers: parseList(values.get("--providers")),
    scenarios: parseList(values.get("--scenarios")),
    repeat,
    envFile: values.get("--env-file"),
    out: values.get("--out") ?? join(HERE, "results"),
  };
}

function loadEnvFile(path: string | undefined): string | undefined {
  const candidate: string = path ?? resolve(process.cwd(), ".env");

  if (!existsSync(candidate)) {
    if (path !== undefined) {
      throw new Error(`Env file not found: ${path}`);
    }

    return undefined;
  }

  // Node >= 20.12: values already present in process.env are not overwritten.
  process.loadEnvFile(candidate);

  return candidate;
}

function gitCommit(): string | undefined {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return undefined;
  }
}

interface CallOutcome {
  readonly status: EvalResultRecord["status"];
  readonly text: string;
  readonly completion?: EvalCompletion;
  readonly ttftMs?: number;
  readonly totalMs: number;
  readonly errorName?: string;
  readonly errorMessage?: string;
}

async function callProvider(provider: EvalProvider, prompt: EvalPrompt, settings: EvalCallSettings, secrets: readonly (string | undefined)[]): Promise<CallOutcome> {
  const controller: AbortController = new AbortController();
  const timer: ReturnType<typeof setTimeout> = setTimeout(() => controller.abort(new Error(`Timeout after ${settings.timeoutMs} ms`)), settings.timeoutMs);
  const started: number = performance.now();
  let ttftMs: number | undefined;
  let text: string = "";
  let completion: EvalCompletion | undefined;

  try {
    for await (const chunk of provider.stream(
      {
        model: settings.model,
        system: prompt.system,
        messages: prompt.messages,
        maxOutputTokens: settings.maxOutputTokens,
        temperature: settings.temperature,
        responseFormat: prompt.responseFormat,
      },
      controller.signal,
    )) {
      if (chunk.type === "delta") {
        if (ttftMs === undefined && chunk.text.length > 0) {
          ttftMs = Math.round(performance.now() - started);
        }

        text += chunk.text;
      } else {
        completion = chunk.completion;
      }
    }

    return { status: "ok", text: completion?.text ?? text, completion, ttftMs, totalMs: Math.round(performance.now() - started) };
  } catch (error: unknown) {
    const name: string = error instanceof Error ? error.name : "UnknownError";
    const message: string = error instanceof Error ? error.message : String(error);

    return {
      status: controller.signal.aborted ? "timeout" : "error",
      text,
      ttftMs,
      totalMs: Math.round(performance.now() - started),
      errorName: name,
      errorMessage: redactSecrets(message, secrets).slice(0, MAX_ERROR_MESSAGE_LENGTH),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function resolveProviders(options: CliOptions): Promise<Map<string, EvalProvider>> {
  if (options.dryRun) {
    return new Map<string, EvalProvider>([[FAKE_PROVIDER_ID, createFakeProvider()]]);
  }

  const available: Map<string, EvalProvider> = await createRealProviders(process.env);
  const wanted: string[] = options.providers.length > 0 ? options.providers : [...available.keys()];
  const missing: string[] = wanted.filter((id: string) => !available.has(id));

  if (missing.length > 0) {
    throw new Error(`Providers not configured (missing key or mapping): ${missing.join(", ")}`);
  }

  if (wanted.length === 0) {
    throw new Error("No AI provider is configured; set GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY or AI_EXTERNAL_BASE_URL + AI_EXTERNAL_MODEL, or use --dry-run");
  }

  return new Map<string, EvalProvider>(wanted.map((id: string) => [id, available.get(id) as EvalProvider]));
}

function callSettingsFor(server: ServerSettings, scenario: EvalScenario, providerId: string, dryRun: boolean): EvalCallSettings {
  const settings: EvalCallSettings = server.callSettings(scenario.useCase, providerId);

  return dryRun ? { ...settings, model: FAKE_MODEL } : settings;
}

async function main(argv: readonly string[]): Promise<number> {
  const options: CliOptions = parseArgs(argv);
  const envFile: string | undefined = options.dryRun ? undefined : loadEnvFile(options.envFile);
  const secrets: (string | undefined)[] = PROVIDER_SECRET_ENV_VARS.map((name: string) => process.env[name]);
  const scenarios: EvalScenario[] = loadScenarios(join(HERE, "scenarios"), options.scenarios);
  const server: ServerSettings = loadServerSettings(process.env);
  const providers: Map<string, EvalProvider> = await resolveProviders(options);
  const startedAt: Date = new Date();
  const runId: string = runStamp(startedAt);
  const records: EvalResultRecord[] = [];

  console.log(`Run ${runId}: ${scenarios.length} scenarios x ${providers.size} providers x ${options.repeat} repetitions${options.dryRun ? " (dry run)" : ""}`);

  for (const scenario of scenarios) {
    const prompt: EvalPrompt = buildPrompt(scenario);

    for (const [providerId, provider] of providers) {
      const settings: EvalCallSettings = callSettingsFor(server, scenario, providerId, options.dryRun);

      for (let repetition: number = 1; repetition <= options.repeat; repetition++) {
        const timestamp: string = new Date().toISOString();
        const outcome: CallOutcome = await callProvider(provider, prompt, settings, secrets);
        const model: string = outcome.completion?.model ?? settings.model;

        records.push({
          runId,
          timestamp,
          dryRun: options.dryRun,
          scenarioId: scenario.id,
          category: scenario.category,
          useCase: scenario.useCase,
          language: scenario.language,
          provider: providerId,
          model,
          promptVersion: prompt.promptVersion,
          promptHash: prompt.promptHash,
          repetition,
          settings: { temperature: settings.temperature, maxOutputTokens: settings.maxOutputTokens, timeoutMs: settings.timeoutMs },
          status: outcome.status,
          errorName: outcome.errorName,
          errorMessage: outcome.errorMessage,
          ttftMs: outcome.ttftMs,
          totalMs: outcome.totalMs,
          finishReason: outcome.completion?.finishReason,
          inputTokens: outcome.completion?.inputTokens,
          outputTokens: outcome.completion?.outputTokens,
          costUsd: options.dryRun ? undefined : server.costUsd(providerId, model, outcome.completion?.inputTokens, outcome.completion?.outputTokens),
          outputText: outcome.text,
          outputChars: outcome.text.length,
          ...(outcome.status === "ok" ? checkOutput(scenario, outcome.text) : {}),
          autoScore: autoScore(outcome.text, scenario.expectedCriteria, scenario.mustNotContain),
          prompt: { system: prompt.system, messages: prompt.messages, responseFormat: prompt.responseFormat },
        });
        console.log(`  ${scenario.id} | ${providerId} | #${repetition} | ${outcome.status} | ${outcome.totalMs} ms`);
      }
    }
  }

  const dir: string = join(options.out, options.dryRun ? `dry-run-${runId}` : runId);
  const written = writeResults(dir, records, {
    runId,
    dryRun: options.dryRun,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    gitCommit: gitCommit(),
    node: process.version,
    envFileLoaded: envFile !== undefined,
    providers: [...providers.keys()],
    scenarioIds: scenarios.map((scenario: EvalScenario) => scenario.id),
    repeat: options.repeat,
    calls: records.length,
    failedCalls: records.filter((record: EvalResultRecord) => record.status !== "ok").length,
    note: "Direct single-provider calls: no gateway fallback chain, retries, circuit breaker, quota or deterministic fallback.",
  });

  console.log(`Results: ${written.rawPath}\n         ${written.summaryPath}`);

  return 0;
}

main(process.argv.slice(2)).then(
  (code: number) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(error instanceof Error ? `${error.name}: ${redactSecrets(error.message, PROVIDER_SECRET_ENV_VARS.map((name: string) => process.env[name]))}` : error);
    process.exitCode = 1;
  },
);
