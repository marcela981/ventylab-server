/*
 * Funcionalidad: Tiempo simulado de la asistencia de IA
 * Descripción: Resuelve el tiempo simulado al que el servidor repite una sesión para la asistencia de IA ("Asesoría IA" y "¿Cómo estabilizar?"): el que informa el cliente, nunca antes del último evento guardado (un pequeño retraso del reloj de la consola se ajusta, uno mayor se rechaza como no monótono) ni después de la cota del reloj de pared (tiempo transcurrido × multiplicador de la sesión + tolerancia, acotado a la fecha límite del examen), con la misma regla que POST /end; sin tiempo del cliente se estima con esa cota
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { maxAllowedSimTimeMs } from "@/features/simulation/domain/sessions/simulation-session-events";
import { SimulationEventTimeAheadError, SimulationEventTimeNotMonotonicError } from "@/features/simulation/domain/simulation.errors";

/**
 * The console clock is published at most every 250 ms, so it can trail an event the worker already acknowledged:
 * a request up to this far behind the last stored event is moved up to it instead of being refused.
 */
export const ASSIST_SIM_TIME_LAG_TOLERANCE_MS: number = 1000;

export interface AssistSimTimeInput {
  /** Simulated time reported by the client; undefined for older clients */
  readonly requestedMs?: number;
  readonly lastSimTimeMs: number;
  readonly startedAt: Date;
  readonly now: Date;
  readonly timeMultiplier: number;
  readonly toleranceMs: number;
  /** Exam deadline, if any: no simulated time after it is accepted */
  readonly expiresAt?: Date;
}

/**
 * @throws {SimulationEventTimeNotMonotonicError} If the requested time is further behind the last stored event than the lag tolerance
 * @throws {SimulationEventTimeAheadError} If the requested time is ahead of the wall-clock bound of the session
 */
export function resolveAssistSimTimeMs(input: AssistSimTimeInput): number {
  const boundAt: Date = input.expiresAt !== undefined && input.expiresAt.getTime() < input.now.getTime() ? input.expiresAt : input.now;
  const maxAllowedMs: number = maxAllowedSimTimeMs(input.startedAt, boundAt, input.timeMultiplier, input.toleranceMs);

  if (input.requestedMs === undefined) {
    // Older clients send no time: the wall-clock estimate (it overestimates a paused FREE session).
    const elapsedSimMs: number = Math.max(0, boundAt.getTime() - input.startedAt.getTime()) * input.timeMultiplier;

    return Math.max(input.lastSimTimeMs, Math.floor(Math.min(elapsedSimMs, maxAllowedMs)));
  }

  const requestedMs: number = Math.floor(input.requestedMs);

  if (requestedMs < input.lastSimTimeMs - ASSIST_SIM_TIME_LAG_TOLERANCE_MS) {
    throw new SimulationEventTimeNotMonotonicError();
  }

  if (requestedMs > maxAllowedMs) {
    throw new SimulationEventTimeAheadError();
  }

  return Math.max(input.lastSimTimeMs, requestedMs);
}
