/*
 * Funcionalidad: Orquestador de proveedores de IA
 * Descripción: Recorre la cadena de proveedores de un caso de uso omitiendo los no registrados o con el cortocircuito abierto, aplica tiempo límite por intento con AbortController, un reintento ante errores transitorios, respaldo determinista del consumidor o 503, abortos del llamador, streams con TTFT, registra el resultado de cada llamada sin bloquearla registra las llamadas bloqueadas por estar fuera de tema sin intentos y expone los ajustes del tutor
 * Versión: 1.1
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
  AiProvidersUnavailableError,
  AiStreamInterruptedError,
} from "@/features/ai/domain/ai.errors";
import { type BuiltPrompt } from "@/features/ai/domain/prompts/prompt-template";
import { type AiCallStatus, type AiResult, type AiStreamChunk } from "@/features/ai/domain/results/ai-result";
import { classifyAiError } from "@/features/ai/domain/services/ai-error-classification";
import { type AiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";

// A timed-out attempt already spent the whole latency budget, so it moves to the next provider instead of retrying.
const RETRYABLE_KINDS: readonly AiProviderErrorKind[] = ["RATE_LIMIT", "SERVER", "NETWORK"];

const MAX_RETRIES_PER_PROVIDER: number = 1;

const NO_PROVIDER_AVAILABLE_CODE: string = "NO_PROVIDER_AVAILABLE";

const FALLBACK_FAILED_CODE: string = "FALLBACK_FAILED";

const OFF_TOPIC_CODE: string = "OFF_TOPIC";

export interface AiCallOptions {
  readonly userId?: string;
  readonly userRole?: string;
  readonly fallback?: () => string | Promise<string>;
  readonly signal?: AbortSignal;
  readonly refType?: string;
  readonly refId?: string;
}

export interface AiOrchestrationRequest {
  readonly useCase: AiUseCaseValue;
  readonly prompt: BuiltPrompt;
  readonly promptVersion: string;
  readonly promptHash: string;
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
}

interface RecordOutcome {
  readonly status: AiCallStatus;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
}

interface OpenedStream {
  readonly scope: AttemptScope;
  readonly iterator: AsyncIterator<LlmChunk>;
  readonly first: IteratorResult<LlmChunk>;
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
    const tracker: CallTracker = this._startTracker();
    const settings: AiUseCaseSettings = this._settings.getUseCaseSettings(request.useCase);

    for (const target of this._targets(settings)) {
      if (this._isCallerAborted(request)) {
        break;
      }

      tracker.attempts++;
      tracker.provider = target.provider.id;
      tracker.model = target.model;

      try {
        const completion: LlmCompletion = await this._completeWithRetry(target, request, settings);

        this._breaker.recordSuccess(target.provider.id);
        tracker.model = completion.model || target.model;
        tracker.errorCode = undefined;

        this._record(request, tracker, { status: "SUCCESS", inputTokens: completion.inputTokens, outputTokens: completion.outputTokens });

        return { content: completion.text, source: "LLM", provider: target.provider.id, model: tracker.model, aiCallId: tracker.id };
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

  public recordBlocked(request: AiOrchestrationRequest): string {
    const tracker: CallTracker = this._startTracker();

    tracker.errorCode = OFF_TOPIC_CODE;
    this._record(request, tracker, { status: "BLOCKED_OFFTOPIC" });

    return tracker.id;
  }

  public async *stream(request: AiOrchestrationRequest): AsyncGenerator<AiStreamChunk> {
    const tracker: CallTracker = this._startTracker();
    const settings: AiUseCaseSettings = this._settings.getUseCaseSettings(request.useCase);
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
          opened = await this._openStreamWithRetry(candidate, request, settings);
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
          this._record(request, tracker, { status: "ABORTED" });

          return;
        }

        this._breaker.recordFailure(target.provider.id, this._settings.getBreakerSettings());
        tracker.errorCode = classifyAiError(error);
        this._logger.warn(`AI stream from ${target.provider.id} interrupted (${tracker.errorCode})`);
        this._record(request, tracker, { status: "ERROR" });

        throw new AiStreamInterruptedError();
      }
    }

    scope.disarm();
    this._breaker.recordSuccess(target.provider.id);

    const content: string = text.length > 0 ? text : (final?.text ?? "");

    tracker.model = final?.model || target.model;

    this._record(request, tracker, { status: "SUCCESS", inputTokens: final?.inputTokens, outputTokens: final?.outputTokens });

    yield { type: "done", result: { content, source: "LLM", provider: target.provider.id, model: tracker.model, aiCallId: tracker.id } };
  }

  private async _completeWithRetry(target: ProviderTarget, request: AiOrchestrationRequest, settings: AiUseCaseSettings): Promise<LlmCompletion> {
    for (let retry: number = 0; ; retry++) {
      const scope: AttemptScope = new AttemptScope(settings.timeoutMs, request.options.signal);

      try {
        return await scope.race(target.provider.complete(this._buildLlmRequest(target, request, settings), scope.signal));
      } catch (error: unknown) {
        await this._beforeRetry(error, retry, target, request);
      } finally {
        scope.dispose(false);
      }
    }
  }

  private async _openStreamWithRetry(target: ProviderTarget, request: AiOrchestrationRequest, settings: AiUseCaseSettings): Promise<OpenedStream> {
    for (let retry: number = 0; ; retry++) {
      const scope: AttemptScope = new AttemptScope(settings.timeoutMs, request.options.signal);
      let iterator: AsyncIterator<LlmChunk> | undefined;

      try {
        iterator = target.provider.stream(this._buildLlmRequest(target, request, settings), scope.signal)[Symbol.asyncIterator]();

        const first: IteratorResult<LlmChunk> = await scope.race(iterator.next());

        scope.disarm();

        return { scope, iterator, first };
      } catch (error: unknown) {
        scope.dispose(true);
        iterator?.return?.().catch(() => undefined);

        await this._beforeRetry(error, retry, target, request);
      }
    }
  }

  private async _beforeRetry(error: unknown, retry: number, target: ProviderTarget, request: AiOrchestrationRequest): Promise<void> {
    const kind: AiProviderErrorKind = classifyAiError(error);

    if (this._isCallerAborted(request) || retry >= MAX_RETRIES_PER_PROVIDER || !RETRYABLE_KINDS.includes(kind)) {
      throw error;
    }

    this._logger.warn(`AI provider ${target.provider.id} failed (${kind}), retrying`);

    await sleep(this._settings.getRetryDelayMs() * (retry + 1), request.options.signal);
  }

  private _registerFailure(target: ProviderTarget, tracker: CallTracker, error: unknown): void {
    this._breaker.recordFailure(target.provider.id, this._settings.getBreakerSettings());
    tracker.errorCode = classifyAiError(error);
    this._logger.warn(`AI provider ${target.provider.id} failed (${tracker.errorCode}), trying the next provider`);
  }

  private async _runFallbackOrThrow(request: AiOrchestrationRequest, tracker: CallTracker): Promise<string> {
    tracker.errorCode = tracker.errorCode ?? NO_PROVIDER_AVAILABLE_CODE;

    const fallback: (() => string | Promise<string>) | undefined = request.options.fallback;

    if (!fallback) {
      this._record(request, tracker, { status: "ERROR" });

      throw new AiProvidersUnavailableError();
    }

    try {
      const content: string = await fallback();

      tracker.provider = undefined;
      tracker.model = undefined;

      this._record(request, tracker, { status: "FALLBACK" });

      return content;
    } catch (error: unknown) {
      tracker.errorCode = FALLBACK_FAILED_CODE;
      this._record(request, tracker, { status: "ERROR" });

      throw error;
    }
  }

  private *_targets(settings: AiUseCaseSettings): Generator<ProviderTarget> {
    for (const providerId of settings.providerChain) {
      const provider: ILlmProvider | undefined = this._providers.get(providerId);
      const model: string | undefined = settings.models[providerId];

      if (!provider || !model || this._breaker.isOpen(providerId)) {
        continue;
      }

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

  private _startTracker(): CallTracker {
    return { id: generateId(), startedAt: Date.now(), attempts: 0, recorded: false };
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
      inputTokens: outcome.inputTokens,
      outputTokens: outcome.outputTokens,
      latencyMs: Date.now() - tracker.startedAt,
      ttftMs: tracker.ttftMs,
      status: outcome.status,
      errorCode: this._errorCodeFor(outcome.status, tracker),
      attempts: tracker.attempts,
      createdAt: new Date(tracker.startedAt),
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
