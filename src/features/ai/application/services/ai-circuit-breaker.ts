/*
 * Funcionalidad: Cortocircuito de proveedores de IA
 * Descripción: Cortocircuito en memoria por proveedor: tras N fallos consecutivos lo abre durante M segundos para que el gateway lo omita; un éxito reinicia el contador y un fallo tras la reapertura lo vuelve a abrir; recuerda el último éxito y el último error (solo su código) y expone una foto de solo lectura con el estado cerrado, abierto o semiabierto
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiBreakerSettings } from "@/features/ai/application/ports/ai-settings-provider.interface";
import { type AiBreakerSnapshot, type AiBreakerStateValue } from "@/features/ai/domain/results/ai-provider-health";

interface BreakerState {
  consecutiveFailures: number;
  openUntil: number;
}

interface BreakerHistory {
  lastSuccessAt?: number;
  lastErrorAt?: number;
  lastErrorCode?: string;
}

export class AiCircuitBreaker {
  private readonly _states: Map<string, BreakerState> = new Map<string, BreakerState>();
  private readonly _history: Map<string, BreakerHistory> = new Map<string, BreakerHistory>();

  public isOpen(providerId: string, now: number = Date.now()): boolean {
    const state: BreakerState | undefined = this._states.get(providerId);

    return state !== undefined && state.openUntil > now;
  }

  public recordSuccess(providerId: string, now: number = Date.now()): void {
    this._states.delete(providerId);
    this._history.set(providerId, { ...this._history.get(providerId), lastSuccessAt: now });
  }

  public recordFailure(providerId: string, settings: AiBreakerSettings, errorCode?: string, now: number = Date.now()): void {
    const state: BreakerState = this._states.get(providerId) ?? { consecutiveFailures: 0, openUntil: 0 };

    state.consecutiveFailures++;

    if (state.consecutiveFailures >= settings.failureThreshold) {
      state.openUntil = now + settings.openSeconds * 1000;
    }

    this._states.set(providerId, state);
    this._history.set(providerId, { ...this._history.get(providerId), lastErrorAt: now, lastErrorCode: errorCode });
  }

  public inspect(providerId: string, now: number = Date.now()): AiBreakerSnapshot {
    const history: BreakerHistory = this._history.get(providerId) ?? {};

    return {
      state: this._stateOf(providerId, now),
      lastSuccessAt: history.lastSuccessAt !== undefined ? new Date(history.lastSuccessAt) : undefined,
      lastErrorAt: history.lastErrorAt !== undefined ? new Date(history.lastErrorAt) : undefined,
      lastErrorCode: history.lastErrorCode,
    };
  }

  private _stateOf(providerId: string, now: number): AiBreakerStateValue {
    const state: BreakerState | undefined = this._states.get(providerId);

    if (!state || state.openUntil === 0) {
      return "closed";
    }

    // Once the open window elapses the next call is let through as a trial; one more failure reopens it, a success closes it.
    return state.openUntil > now ? "open" : "half_open";
  }
}
