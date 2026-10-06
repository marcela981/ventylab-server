/*
 * Funcionalidad: Caché del consumo diario de IA
 * Descripción: Guarda en memoria, por usuario y caso de uso, el consumo diario de IA leído de la telemetría durante 15 segundos y le suma localmente cada llamada registrada para que las ráfagas no superen la cuota mientras la telemetría se escribe sin bloquear
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { startOfUtcDay } from "@/features/ai/domain/services/ai-quota-window";
import { type AiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";

export const AI_USAGE_CACHE_TTL_MS: number = 15_000;

const PRUNE_THRESHOLD: number = 1000;

export interface AiDailyUsage {
  readonly requests: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
}

interface CachedUsage {
  readonly dayStartMs: number;
  readonly expiresAtMs: number;
  usage: AiDailyUsage;
}

// Per-process cache: with several server instances each one counts its own recorded calls until the TTL re-reads ai_call_logs.
@Injectable()
export class AiUsageCache {
  private readonly _entries: Map<string, CachedUsage> = new Map<string, CachedUsage>();

  public get(userId: string, useCase: AiUseCaseValue, now: Date): AiDailyUsage | undefined {
    const entry: CachedUsage | undefined = this._entries.get(this._key(userId, useCase));

    if (!entry || entry.expiresAtMs <= now.getTime() || entry.dayStartMs !== startOfUtcDay(now).getTime()) {
      return undefined;
    }

    return entry.usage;
  }

  public set(userId: string, useCase: AiUseCaseValue, usage: AiDailyUsage, now: Date): void {
    if (this._entries.size >= PRUNE_THRESHOLD) {
      this._prune(now);
    }

    this._entries.set(this._key(userId, useCase), {
      dayStartMs: startOfUtcDay(now).getTime(),
      expiresAtMs: now.getTime() + AI_USAGE_CACHE_TTL_MS,
      usage,
    });
  }

  public add(userId: string, useCase: AiUseCaseValue, delta: AiDailyUsage, at: Date): void {
    const entry: CachedUsage | undefined = this._entries.get(this._key(userId, useCase));

    if (!entry || entry.dayStartMs !== startOfUtcDay(at).getTime()) {
      return;
    }

    entry.usage = {
      requests: entry.usage.requests + delta.requests,
      inputTokens: entry.usage.inputTokens + delta.inputTokens,
      outputTokens: entry.usage.outputTokens + delta.outputTokens,
    };
  }

  private _prune(now: Date): void {
    for (const [key, entry] of this._entries) {
      if (entry.expiresAtMs <= now.getTime()) {
        this._entries.delete(key);
      }
    }
  }

  private _key(userId: string, useCase: AiUseCaseValue): string {
    return `${userId}:${useCase}`;
  }
}
