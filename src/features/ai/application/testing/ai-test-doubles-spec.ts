/*
 * Funcionalidad: Dobles de prueba del gateway de IA
 * Descripción: Proveedor LLM falso con comportamientos programados (texto, error, bloqueo hasta abortar, stream), configuración estática del gateway y registrador de llamadas en memoria para las pruebas unitarias
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiCallRecord, type IAiCallRecorder } from "@/features/ai/application/ports/ai-call-recorder.interface";
import { type IAiQuotaGuard } from "@/features/ai/application/ports/ai-quota-guard.interface";
import {
  type AiBreakerSettings,
  type AiModelPrice,
  type AiQuotaLimit,
  type AiTutorSettings,
  type AiUseCaseSettings,
  type IAiSettingsProvider,
} from "@/features/ai/application/ports/ai-settings-provider.interface";
import { type ILlmProvider, type LlmChunk, type LlmCompletion, type LlmRequest } from "@/features/ai/application/ports/llm-provider.interface";
import { type AiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";

export type FakeProviderBehavior =
  | { kind: "text"; text: string; inputTokens?: number; outputTokens?: number; delayMs?: number }
  | { kind: "error"; error: Error }
  | { kind: "hang" }
  | { kind: "stream"; chunks: string[]; chunkDelayMs?: number; failAfter?: Error; inputTokens?: number; outputTokens?: number };

function abortReason(signal: AbortSignal): Error {
  return signal.reason instanceof Error ? signal.reason : new Error("Aborted");
}

function waitOrAbort(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise<void>((resolve: () => void, reject: (reason: Error) => void) => {
    if (signal.aborted) {
      reject(abortReason(signal));

      return;
    }

    const handle: NodeJS.Timeout = setTimeout(resolve, ms);

    signal.addEventListener("abort", () => {
      clearTimeout(handle);
      reject(abortReason(signal));
    }, { once: true });
  });
}

export class FakeLlmProvider implements ILlmProvider {
  public readonly requests: LlmRequest[] = [];
  private readonly _behaviors: FakeProviderBehavior[];
  private _callIndex: number = 0;

  public constructor(
    public readonly id: string,
    behaviors: FakeProviderBehavior | FakeProviderBehavior[],
  ) {
    this._behaviors = Array.isArray(behaviors) ? behaviors : [behaviors];
  }

  public get calls(): number {
    return this.requests.length;
  }

  public async complete(request: LlmRequest, signal: AbortSignal): Promise<LlmCompletion> {
    const behavior: FakeProviderBehavior = this._next(request);

    if (behavior.kind === "error") {
      throw behavior.error;
    }

    if (behavior.kind === "hang") {
      await waitOrAbort(Number.MAX_SAFE_INTEGER >>> 1, signal);

      throw new Error("Unreachable");
    }

    if (behavior.kind === "stream") {
      return { text: behavior.chunks.join(""), model: request.model };
    }

    if (behavior.delayMs) {
      await waitOrAbort(behavior.delayMs, signal);
    }

    return { text: behavior.text, model: request.model, inputTokens: behavior.inputTokens, outputTokens: behavior.outputTokens };
  }

  public async *stream(request: LlmRequest, signal: AbortSignal): AsyncIterable<LlmChunk> {
    const behavior: FakeProviderBehavior = this._next(request);

    if (behavior.kind === "error") {
      throw behavior.error;
    }

    if (behavior.kind === "hang") {
      await waitOrAbort(Number.MAX_SAFE_INTEGER >>> 1, signal);

      return;
    }

    if (behavior.kind === "text") {
      yield { type: "delta", text: behavior.text };
      yield { type: "final", completion: { text: behavior.text, model: request.model, inputTokens: behavior.inputTokens, outputTokens: behavior.outputTokens } };

      return;
    }

    for (const chunk of behavior.chunks) {
      if (behavior.chunkDelayMs) {
        await waitOrAbort(behavior.chunkDelayMs, signal);
      }

      yield { type: "delta", text: chunk };
    }

    if (behavior.failAfter) {
      throw behavior.failAfter;
    }

    yield {
      type: "final",
      completion: { text: behavior.chunks.join(""), model: request.model, inputTokens: behavior.inputTokens, outputTokens: behavior.outputTokens },
    };
  }

  private _next(request: LlmRequest): FakeProviderBehavior {
    this.requests.push(request);

    const behavior: FakeProviderBehavior = this._behaviors[Math.min(this._callIndex, this._behaviors.length - 1)];

    this._callIndex++;

    return behavior;
  }
}

export function httpStatusError(status: number): Error {
  const error: Error & { status?: number } = new Error(`HTTP ${status}`);

  error.status = status;

  return error;
}

export class StaticAiSettingsProvider implements IAiSettingsProvider {
  public constructor(
    public useCaseSettings: AiUseCaseSettings,
    public breaker: AiBreakerSettings = { failureThreshold: 3, openSeconds: 60 },
    public retryDelayMs: number = 100,
    public quotas: Partial<Record<string, AiQuotaLimit>> = {},
  ) {}

  public getUseCaseSettings(_useCase: AiUseCaseValue): AiUseCaseSettings {
    return this.useCaseSettings;
  }

  public getBreakerSettings(): AiBreakerSettings {
    return this.breaker;
  }

  public getRetryDelayMs(): number {
    return this.retryDelayMs;
  }

  public getQuota(role: string, _useCase: AiUseCaseValue): AiQuotaLimit | undefined {
    return this.quotas[role];
  }

  public getTutorSettings(): AiTutorSettings {
    return { historyWindow: 10, contextTokenBudget: 4000 };
  }

  public getPrice(_provider: string, _model: string): AiModelPrice | undefined {
    return undefined;
  }
}

export class InMemoryAiCallRecorder implements IAiCallRecorder {
  public readonly records: AiCallRecord[] = [];

  public record(entry: AiCallRecord): Promise<string> {
    this.records.push(entry);

    return Promise.resolve(entry.id);
  }

  public get last(): AiCallRecord | undefined {
    return this.records[this.records.length - 1];
  }
}

export class AllowAllAiQuotaGuard implements IAiQuotaGuard {
  public readonly checks: { userId?: string; role?: string; useCase: AiUseCaseValue }[] = [];

  public assertWithinQuota(userId: string | undefined, role: string | undefined, useCase: AiUseCaseValue): Promise<void> {
    this.checks.push({ userId, role, useCase });

    return Promise.resolve();
  }
}

export function providerRegistry(...providers: ILlmProvider[]): ReadonlyMap<string, ILlmProvider> {
  return new Map<string, ILlmProvider>(providers.map((provider: ILlmProvider) => [provider.id, provider]));
}
