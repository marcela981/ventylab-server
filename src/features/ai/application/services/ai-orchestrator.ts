/*
 * Funcionalidad: Orquestador de proveedores de IA
 * Descripción: Recorre la cadena de proveedores de un caso de uso omitiendo los no registrados o con el cortocircuito abierto, aplica tiempo límite por intento con AbortController, un reintento ante errores transitorios, respaldo determinista del consumidor o 503, abortos del llamador, streams con TTFT, registra el resultado de cada llamada sin bloquearla, registra las llamadas bloqueadas por estar fuera de tema sin intentos, expone los ajustes del tutor y la salud de cada proveedor conocido (configurado y foto del cortocircuito), el catálogo de proveedores con los modelos conocidos (con precio o referenciados por los ajustes vigentes de algún caso de uso) y ejecuta la sonda manual de un proveedor: un solo intento sin reintentos con el prompt mínimo, que actualiza el cortocircuito y se registra en la telemetría como cualquier llamada; v1.4: resuelve el identificador heredado custom como external (sin repetir un proveedor en la cadena) y el modelo "default" o ausente con el modelo por defecto del proveedor; v1.5: la respuesta de respaldo del consumidor se registra como FALLBACK con el proveedor deterministic; v1.6: opciones con sujeto de cuota separado de la atribución (quotaUserId, quotaUserRole); v1.7: telemetría por llamada con idioma, temperatura y máximo de tokens de salida usados, motivo de fin normalizado (error si la llamada falla), id de petición del proveedor, rastro de cada intento (proveedor, modelo, resultado, código y latencia; fallback con el proveedor deterministic) y TTFT también en llamadas sin stream (igual a la latencia total hasta la respuesta); v1.8: espera entre reintentos con retroceso exponencial y jitter completo acotado o el Retry-After del proveedor (acotado); si todos los intentos fallaron por límite de tasa y no hay respaldo, el 503 lleva la hora de reintento más tardía informada; v1.9: opciones trace (hash y tiempo simulado del contexto, comparación cliente-servidor) y validate (una respuesta completa que el consumidor descarta se registra con rejectionReason y lo devuelve en el resultado)
 * Versión: 1.9
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { generateId } from "@/common/domain/utils/generate-id";
import { AI_CALL_RECORDER_TOKEN, type AiCallRecord, type IAiCallRecorder } from "@/features/ai/application/ports/ai-call-recorder.interface";
import {
  AI_SETTINGS_PROVIDER_TOKEN,
  type AiTutorSettings,
  type AiUseCaseSettings,
  type IAiSettingsProvider,
} from "@/features/ai/application/ports/ai-settings-provider.interface";
import {
  AI_PROVIDERS_TOKEN,
  type AiProviderRegistry,
  type ILlmProvider,
  type LlmChunk,
  type LlmCompletion,
  type LlmRequest,
} from "@/features/ai/application/ports/llm-provider.interface";
import { AiCircuitBreaker } from "@/features/ai/application/services/ai-circuit-breaker";
import {
  AiCallAbortedError,
  AiProviderError,
  type AiProviderErrorKind,
  AiProviderNotRegisteredError,
  AiProvidersUnavailableError,
  AiStreamInterruptedError,
} from "@/features/ai/domain/ai.errors";
import { type BuiltPrompt } from "@/features/ai/domain/prompts/prompt-template";
import { type AiAttemptOutcome, type AiAttemptTrailEntry } from "@/features/ai/domain/results/ai-attempt-trail";
import { type AiProbeResult, type AiProviderCatalogEntry, type AiProviderHealth } from "@/features/ai/domain/results/ai-provider-health";
import { type AiCallStatus, type AiResult, type AiStreamChunk } from "@/features/ai/domain/results/ai-result";
import { classifyAiError } from "@/features/ai/domain/services/ai-error-classification";
import { type AiFinishReason, ERROR_FINISH_REASON, UNKNOWN_FINISH_REASON } from "@/features/ai/domain/services/ai-finish-reason";
import { retryDelayMs } from "@/features/ai/domain/services/ai-retry-policy";
import {
  AI_PROVIDER_ID_VALUES,
  normalizeAiProviderId,
  PROVIDER_DEFAULT_MODEL,
} from "@/features/ai/domain/value-objects/ai-provider-id";
import { AI_USE_CASE_VALUES, type AiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";
import { DETERMINISTIC_PROVIDER } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

// A timed-out attempt already spent the whole latency budget, so it moves to the next provider instead of retrying.
const RETRYABLE_KINDS: readonly AiProviderErrorKind[] = ["RATE_LIMIT", "SERVER", "NETWORK"];

const MAX_RETRIES_PER_PROVIDER: number = 1;

const NO_PROVIDER_AVAILABLE_CODE: string = "NO_PROVIDER_AVAILABLE";

const FALLBACK_FAILED_CODE: string = "FALLBACK_FAILED";

const OFF_TOPIC_CODE: string = "OFF_TOPIC";

export interface AiCallOptions {
  // Attribution of the call in the telemetry (and in the daily usage it adds to).
  readonly userId?: string;
  readonly userRole?: string;
  // When either is set, the quota is checked for this user and role instead of userId/userRole (a staff action attributed to a student).
  readonly quotaUserId?: string;
  readonly quotaUserRole?: string;
  readonly fallback?: () => string | Promise<string>;
  readonly signal?: AbortSignal;
  readonly refType?: string;
  readonly refId?: string;
  /** Context of the call stored with its telemetry (simulator: hash of the state sent and its simulated time) */
  readonly trace?: AiCallTrace;
  /** Checks a provider answer once complete; a returned reason discards it (recorded as rejectionReason) */
  readonly validate?: (content: string) => string | undefined;
}

export interface AiCallTrace {
  readonly contextHash?: string;
  readonly simTimeMs?: number;
  readonly contextCheck?: string;
}

export interface AiProbeLimits {
  readonly timeoutMs: number;
  readonly maxOutputTokens: number;
}

export interface AiOrchestrationRequest {
  readonly useCase: AiUseCaseValue;
  readonly prompt: BuiltPrompt;
  readonly promptVersion: string;
  readonly promptHash: string;
  // Language the prompt asks the answer in, recorded in the telemetry.
  readonly language?: string;
  readonly options: AiCallOptions;
}

interface ProviderTarget {
  readonly provider: ILlmProvider;
  readonly model: string;
}

interface CallTracker {
  readonly id: string;
  readonly startedAt: number;
  attempts: number;
  provider?: string;
  model?: string;
  ttftMs?: number;
  errorCode?: string;
  recorded: boolean;
  temperature?: number;
  maxOutputTokens?: number;
  readonly trail: AiAttemptTrailEntry[];
  // Longest Retry-After a rate-limited provider sent during this call.
  retryAfterMs?: number;
}

interface RecordOutcome {
  readonly status: AiCallStatus;
  readonly completion?: LlmCompletion;
  readonly rejectionReason?: string;
}

interface OpenedStream {
  readonly scope: AttemptScope;
  readonly iterator: AsyncIterator<LlmChunk>;
  readonly first: IteratorResult<LlmChunk>;
  readonly startedAt: number;
}

class AttemptScope {
  private readonly _controller: AbortController = new AbortController();
  private readonly _callerSignal?: AbortSignal;
  private _timer?: NodeJS.Timeout;

  public constructor(
    private readonly _timeoutMs: number,
    callerSignal?: AbortSignal,
  ) {
    this._callerSignal = callerSignal;

    if (callerSignal?.aborted) {
      this._onCallerAbort();
    } else {
      callerSignal?.addEventListener("abort", this._onCallerAbort, { once: true });
    }

    this.arm();
  }

  public get signal(): AbortSignal {
    return this._controller.signal;
  }

  public arm(): void {
    this.disarm();

    this._timer = setTimeout(() => {
      this._controller.abort(new AiProviderError("TIMEOUT", `No response within ${this._timeoutMs} ms`));
    }, this._timeoutMs);
  }

  public disarm(): void {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = undefined;
    }
  }

  public race<T>(promise: Promise<T>): Promise<T> {
    const signal: AbortSignal = this._controller.signal;

    return new Promise<T>((resolve: (value: T) => void, reject: (reason: unknown) => void) => {
      if (signal.aborted) {
        promise.catch(() => undefined);
        reject(toError(signal.reason));

        return;
      }

      const onAbort = (): void => reject(toError(signal.reason));

      signal.addEventListener("abort", onAbort, { once: true });

      promise.then(
        (value: T) => {
          signal.removeEventListener("abort", onAbort);
          resolve(value);
        },
        (error: unknown) => {
          signal.removeEventListener("abort", onAbort);
          reject(error instanceof Error ? error : new Error(String(error)));
        },
      );
    });
  }

  public dispose(abortProvider: boolean): void {
    this.disarm();
    this._callerSignal?.removeEventListener("abort", this._onCallerAbort);

    if (abortProvider && !this._controller.signal.aborted) {
      this._controller.abort(new AiCallAbortedError());
    }
  }

  private readonly _onCallerAbort = (): void => {
    this._controller.abort(new AiCallAbortedError());
  };
}

function retryAfterOf(error: unknown): number | undefined {
  return error instanceof AiProviderError ? error.retryAfterMs : undefined;
}

function toError(reason: unknown): Error {
  return reason instanceof Error ? reason : new AiCallAbortedError();
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve: () => void, reject: (reason: Error) => void) => {
    if (signal?.aborted) {
      reject(new AiCallAbortedError());

      return;
    }

    const onAbort = (): void => {
      clearTimeout(handle);
      reject(new AiCallAbortedError());
    };

    const handle: NodeJS.Timeout = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

@Injectable()
export class AiOrchestrator {
  private readonly _logger: Logger = new Logger(AiOrchestrator.name);
  private readonly _breaker: AiCircuitBreaker = new AiCircuitBreaker();

  public constructor(
    @Inject(AI_PROVIDERS_TOKEN)
    private readonly _providers: AiProviderRegistry,
    @Inject(AI_SETTINGS_PROVIDER_TOKEN)
    private readonly _settings: IAiSettingsProvider,
    @Inject(AI_CALL_RECORDER_TOKEN)
    private readonly _recorder: IAiCallRecorder,
  ) {}

  public async complete(request: AiOrchestrationRequest): Promise<AiResult> {
    const settings: AiUseCaseSettings = this._settings.getUseCaseSettings(request.useCase);
    const tracker: CallTracker = this._startTracker(settings);

    for (const target of this._targets(settings)) {
      if (this._isCallerAborted(request)) {
        break;
      }

      tracker.attempts++;
      tracker.provider = target.provider.id;
      tracker.model = target.model;

      try {
        const completion: LlmCompletion = await this._completeWithRetry(target, request, settings, tracker);

        this._breaker.recordSuccess(target.provider.id);
        tracker.model = completion.model || target.model;
        tracker.errorCode = undefined;
        // Without streaming the first token arrives with the whole answer, so TTFT equals the latency until the response.
        tracker.ttftMs = Date.now() - tracker.startedAt;

        const rejectionReason: string | undefined = request.options.validate?.(completion.text);

        this._record(request, tracker, { status: "SUCCESS", completion, rejectionReason });

        return {
          content: completion.text,
          source: "LLM",
          provider: target.provider.id,
          model: tracker.model,
          aiCallId: tracker.id,
          ...(rejectionReason === undefined ? {} : { rejectionReason }),
        };
      } catch (error: unknown) {
        if (this._isCallerAborted(request)) {
          break;
        }

        this._registerFailure(target, tracker, error);
      }
    }

    if (this._isCallerAborted(request)) {
      this._record(request, tracker, { status: "ABORTED" });

      throw new AiCallAbortedError();
    }

    const content: string = await this._runFallbackOrThrow(request, tracker);

    return { content, source: "DETERMINISTIC", aiCallId: tracker.id };
  }

  public getTutorSettings(): AiTutorSettings {
    return this._settings.getTutorSettings();
  }

  public getProviderHealth(now: number = Date.now()): AiProviderHealth[] {
    return this._knownProviderIds().map((provider: string): AiProviderHealth => ({
      provider,
      configured: this._providers.has(provider),
      ...this._breaker.inspect(provider, now),
    }));
  }

  public getProviderCatalog(): AiProviderCatalogEntry[] {
    const useCaseSettings: AiUseCaseSettings[] = AI_USE_CASE_VALUES.map((useCase: AiUseCaseValue) => this._settings.getUseCaseSettings(useCase));

    return this._knownProviderIds().map((provider: string): AiProviderCatalogEntry => {
      const referenced: string[] = useCaseSettings.flatMap((settings: AiUseCaseSettings) => {
        const model: string | undefined = settings.models[provider];

        return model ? [model] : [];
      });

      return {
        provider,
        configured: this._providers.has(provider),
        models: [...new Set<string>([...this._settings.getPricedModels(provider), ...referenced, ...this._defaultModels(provider)])]
          .filter((model: string) => model !== PROVIDER_DEFAULT_MODEL)
          .sort(),
      };
    });
  }

  public async probe(request: AiOrchestrationRequest, providerId: string, limits: AiProbeLimits): Promise<AiProbeResult> {
    const provider: ILlmProvider | undefined = this._providers.get(normalizeAiProviderId(providerId));
    const model: string | undefined = provider ? this._probeModel(request.useCase, provider) : undefined;

    if (!provider || !model) {
      throw new AiProviderNotRegisteredError(providerId);
    }

    const tracker: CallTracker = this._startTracker({ temperature: 0, maxOutputTokens: limits.maxOutputTokens });
    const scope: AttemptScope = new AttemptScope(limits.timeoutMs, request.options.signal);

    tracker.attempts = 1;
    tracker.provider = provider.id;
    tracker.model = model;

    try {
      const completion: LlmCompletion = await scope.race(
        provider.complete(
          { model, system: request.prompt.system, messages: request.prompt.messages, maxOutputTokens: limits.maxOutputTokens, temperature: 0, responseFormat: request.prompt.responseFormat },
          scope.signal,
        ),
      );

      this._breaker.recordSuccess(providerId);
      tracker.model = completion.model || model;
      tracker.ttftMs = Date.now() - tracker.startedAt;
      this._pushTrail(tracker, { provider: provider.id, model: tracker.model, outcome: "success", latencyMs: tracker.ttftMs });
      this._record(request, tracker, { status: "SUCCESS", completion });

      return { provider: providerId, model: tracker.model, ok: true, latencyMs: Date.now() - tracker.startedAt, aiCallId: tracker.id };
    } catch (error: unknown) {
      tracker.errorCode = classifyAiError(error);
      this._breaker.recordFailure(providerId, this._settings.getBreakerSettings(), tracker.errorCode);
      this._pushTrail(tracker, { provider: provider.id, model, outcome: "error", errorCode: tracker.errorCode, latencyMs: Date.now() - tracker.startedAt });
      this._record(request, tracker, { status: "ERROR" });

      return { provider: providerId, model, ok: false, latencyMs: Date.now() - tracker.startedAt, errorCode: tracker.errorCode, aiCallId: tracker.id };
    } finally {
      scope.dispose(true);
    }
  }

  public recordBlocked(request: AiOrchestrationRequest): string {
    const tracker: CallTracker = this._startTracker(this._settings.getUseCaseSettings(request.useCase));

    tracker.errorCode = OFF_TOPIC_CODE;
    this._record(request, tracker, { status: "BLOCKED_OFFTOPIC" });

    return tracker.id;
  }

  public async *stream(request: AiOrchestrationRequest): AsyncGenerator<AiStreamChunk> {
    const settings: AiUseCaseSettings = this._settings.getUseCaseSettings(request.useCase);
    const tracker: CallTracker = this._startTracker(settings);
    let opened: OpenedStream | undefined;
    let target: ProviderTarget | undefined;

    try {
      for (const candidate of this._targets(settings)) {
        if (this._isCallerAborted(request)) {
          break;
        }

        tracker.attempts++;
        tracker.provider = candidate.provider.id;
        tracker.model = candidate.model;

        try {
          opened = await this._openStreamWithRetry(candidate, request, settings, tracker);
          target = candidate;
          tracker.errorCode = undefined;

          break;
        } catch (error: unknown) {
          if (this._isCallerAborted(request)) {
            break;
          }

          this._registerFailure(candidate, tracker, error);
        }
      }

      if (this._isCallerAborted(request)) {
        this._record(request, tracker, { status: "ABORTED" });

        return;
      }

      if (!opened || !target) {
        const content: string = await this._runFallbackOrThrow(request, tracker);

        yield { type: "delta", text: content };
        yield { type: "done", result: { content, source: "DETERMINISTIC", aiCallId: tracker.id } };

        return;
      }

      tracker.ttftMs = Date.now() - tracker.startedAt;

      yield* this._pump(opened, target, request, tracker);
    } finally {
      if (opened) {
        opened.scope.dispose(true);
        opened.iterator.return?.().catch(() => undefined);
      }

      if (!tracker.recorded) {
        this._record(request, tracker, { status: "ABORTED" });
      }
    }
  }

  private async *_pump(opened: OpenedStream, target: ProviderTarget, request: AiOrchestrationRequest, tracker: CallTracker): AsyncGenerator<AiStreamChunk> {
    const { scope, iterator } = opened;
    let next: IteratorResult<LlmChunk> = opened.first;
    let text: string = "";
    let final: LlmCompletion | undefined;

    while (!next.done) {
      const chunk: LlmChunk = next.value;

      if (chunk.type === "final") {
        final = chunk.completion;
      } else if (chunk.text.length > 0) {
        text += chunk.text;
        scope.disarm();

        yield { type: "delta", text: chunk.text };
      }

      scope.arm();

      try {
        next = await scope.race(iterator.next());
      } catch (error: unknown) {
        if (this._isCallerAborted(request)) {
          this._pushTrail(tracker, { provider: target.provider.id, model: target.model, outcome: "aborted", latencyMs: Date.now() - opened.startedAt });
          this._record(request, tracker, { status: "ABORTED" });

          return;
        }

        tracker.errorCode = classifyAiError(error);
        this._breaker.recordFailure(target.provider.id, this._settings.getBreakerSettings(), tracker.errorCode);
        this._logger.warn(`AI stream from ${target.provider.id} interrupted (${tracker.errorCode})`);
        this._pushTrail(tracker, { provider: target.provider.id, model: target.model, outcome: "error", errorCode: tracker.errorCode, latencyMs: Date.now() - opened.startedAt });
        this._record(request, tracker, { status: "ERROR" });

        throw new AiStreamInterruptedError();
      }
    }

    scope.disarm();
    this._breaker.recordSuccess(target.provider.id);

    const content: string = text.length > 0 ? text : (final?.text ?? "");

    tracker.model = final?.model || target.model;

    this._pushTrail(tracker, { provider: target.provider.id, model: tracker.model, outcome: "success", latencyMs: Date.now() - opened.startedAt });
    const rejectionReason: string | undefined = request.options.validate?.(content);

    this._record(request, tracker, { status: "SUCCESS", completion: final ?? { text: content, model: tracker.model }, rejectionReason });

    yield {
      type: "done",
      result: {
        content,
        source: "LLM",
        provider: target.provider.id,
        model: tracker.model,
        aiCallId: tracker.id,
        ...(rejectionReason === undefined ? {} : { rejectionReason }),
      },
    };
  }

  private async _completeWithRetry(target: ProviderTarget, request: AiOrchestrationRequest, settings: AiUseCaseSettings, tracker: CallTracker): Promise<LlmCompletion> {
    for (let retry: number = 0; ; retry++) {
      const scope: AttemptScope = new AttemptScope(settings.timeoutMs, request.options.signal);
      const attemptStartedAt: number = Date.now();

      try {
        const completion: LlmCompletion = await scope.race(target.provider.complete(this._buildLlmRequest(target, request, settings), scope.signal));

        this._pushTrail(tracker, { provider: target.provider.id, model: completion.model || target.model, outcome: "success", latencyMs: Date.now() - attemptStartedAt });

        return completion;
      } catch (error: unknown) {
        this._pushFailedAttempt(tracker, target, request, error, attemptStartedAt);
        await this._beforeRetry(error, retry, target, request);
      } finally {
        scope.dispose(false);
      }
    }
  }

  private async _openStreamWithRetry(target: ProviderTarget, request: AiOrchestrationRequest, settings: AiUseCaseSettings, tracker: CallTracker): Promise<OpenedStream> {
    for (let retry: number = 0; ; retry++) {
      const scope: AttemptScope = new AttemptScope(settings.timeoutMs, request.options.signal);
      const attemptStartedAt: number = Date.now();
      let iterator: AsyncIterator<LlmChunk> | undefined;

      try {
        iterator = target.provider.stream(this._buildLlmRequest(target, request, settings), scope.signal)[Symbol.asyncIterator]();

        const first: IteratorResult<LlmChunk> = await scope.race(iterator.next());

        scope.disarm();

        return { scope, iterator, first, startedAt: attemptStartedAt };
      } catch (error: unknown) {
        scope.dispose(true);
        iterator?.return?.().catch(() => undefined);
        this._pushFailedAttempt(tracker, target, request, error, attemptStartedAt);

        await this._beforeRetry(error, retry, target, request);
      }
    }
  }

  private async _beforeRetry(error: unknown, retry: number, target: ProviderTarget, request: AiOrchestrationRequest): Promise<void> {
    const kind: AiProviderErrorKind = classifyAiError(error);

    if (this._isCallerAborted(request) || retry >= MAX_RETRIES_PER_PROVIDER || !RETRYABLE_KINDS.includes(kind)) {
      throw error;
    }

    const delayMs: number = retryDelayMs(this._settings.getRetryDelayMs(), retry, retryAfterOf(error));

    this._logger.warn(`AI provider ${target.provider.id} failed (${kind}), retrying in ${delayMs} ms`);

    await sleep(delayMs, request.options.signal);
  }

  private _registerFailure(target: ProviderTarget, tracker: CallTracker, error: unknown): void {
    tracker.errorCode = classifyAiError(error);
    this._breaker.recordFailure(target.provider.id, this._settings.getBreakerSettings(), tracker.errorCode);
    this._logger.warn(`AI provider ${target.provider.id} failed (${tracker.errorCode}), trying the next provider`);
  }

  private async _runFallbackOrThrow(request: AiOrchestrationRequest, tracker: CallTracker): Promise<string> {
    tracker.errorCode = tracker.errorCode ?? NO_PROVIDER_AVAILABLE_CODE;

    const fallback: (() => string | Promise<string>) | undefined = request.options.fallback;

    if (!fallback) {
      this._record(request, tracker, { status: "ERROR" });

      throw new AiProvidersUnavailableError(this._rateLimitRetryAt(tracker));
    }

    try {
      const fallbackStartedAt: number = Date.now();
      const content: string = await fallback();

      tracker.provider = DETERMINISTIC_PROVIDER;
      tracker.model = undefined;
      this._pushTrail(tracker, { provider: DETERMINISTIC_PROVIDER, outcome: "fallback", latencyMs: Date.now() - fallbackStartedAt });

      this._record(request, tracker, { status: "FALLBACK" });

      return content;
    } catch (error: unknown) {
      tracker.errorCode = FALLBACK_FAILED_CODE;
      this._record(request, tracker, { status: "ERROR" });

      throw error;
    }
  }

  private _knownProviderIds(): string[] {
    return [...new Set<string>([...AI_PROVIDER_ID_VALUES, ...this._providers.keys()])];
  }

  private _probeModel(useCase: AiUseCaseValue, provider: ILlmProvider): string | undefined {
    const preferred: string | undefined = this._resolveModel(this._settings.getUseCaseSettings(useCase), provider);

    if (preferred) {
      return preferred;
    }

    for (const candidate of AI_USE_CASE_VALUES) {
      const model: string | undefined = this._resolveModel(this._settings.getUseCaseSettings(candidate), provider);

      if (model) {
        return model;
      }
    }

    return undefined;
  }

  private _defaultModels(providerId: string): string[] {
    const model: string | undefined = this._providers.get(providerId)?.defaultModel;

    return model ? [model] : [];
  }

  // The legacy "custom" entry of settings saved before the external provider still selects the external model.
  private _resolveModel(settings: AiUseCaseSettings, provider: ILlmProvider): string | undefined {
    const configured: string | undefined =
      settings.models[provider.id] ?? Object.entries(settings.models).find(([id]: [string, string]) => normalizeAiProviderId(id) === provider.id)?.[1];

    if (!configured || configured === PROVIDER_DEFAULT_MODEL) {
      return provider.defaultModel;
    }

    return configured;
  }

  private *_targets(settings: AiUseCaseSettings): Generator<ProviderTarget> {
    const seen: Set<string> = new Set<string>();

    for (const configuredId of settings.providerChain) {
      const providerId: string = normalizeAiProviderId(configuredId);
      const provider: ILlmProvider | undefined = this._providers.get(providerId);
      const model: string | undefined = provider ? this._resolveModel(settings, provider) : undefined;

      if (seen.has(providerId) || !provider || !model || this._breaker.isOpen(providerId)) {
        continue;
      }

      seen.add(providerId);

      yield { provider, model };
    }
  }

  private _buildLlmRequest(target: ProviderTarget, request: AiOrchestrationRequest, settings: AiUseCaseSettings): LlmRequest {
    return {
      model: target.model,
      system: request.prompt.system,
      messages: request.prompt.messages,
      maxOutputTokens: settings.maxOutputTokens,
      temperature: settings.temperature,
      responseFormat: request.prompt.responseFormat,
    };
  }

  private _isCallerAborted(request: AiOrchestrationRequest): boolean {
    return request.options.signal?.aborted === true;
  }

  private _startTracker(generation?: { readonly temperature: number; readonly maxOutputTokens: number }): CallTracker {
    return {
      id: generateId(),
      startedAt: Date.now(),
      attempts: 0,
      recorded: false,
      temperature: generation?.temperature,
      maxOutputTokens: generation?.maxOutputTokens,
      trail: [],
    };
  }

  private _pushTrail(tracker: CallTracker, entry: AiAttemptTrailEntry): void {
    tracker.trail.push(entry);
  }

  // Only when every failed attempt was rate limited and at least one provider said when to come back.
  private _rateLimitRetryAt(tracker: CallTracker): Date | undefined {
    const failures: AiAttemptTrailEntry[] = tracker.trail.filter((entry: AiAttemptTrailEntry) => entry.outcome === "error");
    const allRateLimited: boolean = failures.length > 0 && failures.every((entry: AiAttemptTrailEntry) => entry.errorCode === "RATE_LIMIT");

    return allRateLimited && tracker.retryAfterMs !== undefined ? new Date(Date.now() + tracker.retryAfterMs) : undefined;
  }

  private _pushFailedAttempt(tracker: CallTracker, target: ProviderTarget, request: AiOrchestrationRequest, error: unknown, attemptStartedAt: number): void {
    const outcome: AiAttemptOutcome = this._isCallerAborted(request) ? "aborted" : "error";
    const retryAfterMs: number | undefined = retryAfterOf(error);

    if (retryAfterMs !== undefined) {
      tracker.retryAfterMs = Math.max(tracker.retryAfterMs ?? 0, retryAfterMs);
    }

    this._pushTrail(tracker, {
      provider: target.provider.id,
      model: target.model,
      outcome,
      errorCode: outcome === "error" ? classifyAiError(error) : undefined,
      latencyMs: Date.now() - attemptStartedAt,
    });
  }

  private _finishReasonFor(outcome: RecordOutcome): AiFinishReason | undefined {
    if (outcome.status === "SUCCESS") {
      return outcome.completion?.finishReason ?? UNKNOWN_FINISH_REASON;
    }

    return outcome.status === "ERROR" ? ERROR_FINISH_REASON : undefined;
  }

  private _errorCodeFor(status: AiCallStatus, tracker: CallTracker): string | undefined {
    if (status === "SUCCESS") {
      return undefined;
    }

    return status === "ABORTED" ? "ABORTED" : tracker.errorCode;
  }

  private _record(request: AiOrchestrationRequest, tracker: CallTracker, outcome: RecordOutcome): void {
    tracker.recorded = true;

    const entry: AiCallRecord = {
      id: tracker.id,
      useCase: request.useCase,
      userId: request.options.userId,
      userRole: request.options.userRole,
      refType: request.options.refType,
      refId: request.options.refId,
      provider: tracker.provider,
      model: tracker.model,
      promptVersion: request.promptVersion,
      promptHash: request.promptHash,
      inputTokens: outcome.completion?.inputTokens,
      outputTokens: outcome.completion?.outputTokens,
      latencyMs: Date.now() - tracker.startedAt,
      ttftMs: tracker.ttftMs,
      status: outcome.status,
      errorCode: this._errorCodeFor(outcome.status, tracker),
      attempts: tracker.attempts,
      createdAt: new Date(tracker.startedAt),
      language: request.language,
      finishReason: this._finishReasonFor(outcome),
      temperature: tracker.temperature,
      maxOutputTokens: tracker.maxOutputTokens,
      attemptTrail: [...tracker.trail],
      providerRequestId: outcome.completion?.providerRequestId,
      contextHash: request.options.trace?.contextHash,
      simTimeMs: request.options.trace?.simTimeMs,
      contextCheck: request.options.trace?.contextCheck,
      rejectionReason: outcome.rejectionReason,
    };

    try {
      this._recorder.record(entry).catch((error: unknown) => {
        this._logger.error(`Failed to record AI call ${entry.id}: ${error instanceof Error ? error.message : "unknown error"}`);
      });
    } catch (error: unknown) {
      this._logger.error(`Failed to record AI call ${entry.id}: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }
}
