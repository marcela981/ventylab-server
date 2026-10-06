/*
 * Funcionalidad: Cortocircuito de proveedores de IA
 * Descripción: Cortocircuito en memoria por proveedor: tras N fallos consecutivos lo abre durante M segundos para que el gateway lo omita; un éxito reinicia el contador y un fallo tras la reapertura lo vuelve a abrir
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiBreakerSettings } from "@/features/ai/application/ports/ai-settings-provider.interface";

interface BreakerState {
  consecutiveFailures: number;
  openUntil: number;
}

export class AiCircuitBreaker {
  private readonly _states: Map<string, BreakerState> = new Map<string, BreakerState>();

  public isOpen(providerId: string, now: number = Date.now()): boolean {
    const state: BreakerState | undefined = this._states.get(providerId);

    return state !== undefined && state.openUntil > now;
  }

  public recordSuccess(providerId: string): void {
    this._states.delete(providerId);
  }

  public recordFailure(providerId: string, settings: AiBreakerSettings, now: number = Date.now()): void {
    const state: BreakerState = this._states.get(providerId) ?? { consecutiveFailures: 0, openUntil: 0 };

    state.consecutiveFailures++;

    if (state.consecutiveFailures >= settings.failureThreshold) {
      state.openUntil = now + settings.openSeconds * 1000;
    }

    this._states.set(providerId, state);
  }
}
