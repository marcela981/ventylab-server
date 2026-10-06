/*
 * Funcionalidad: Puerto IAiCallRecorder
 * Descripción: Contrato para registrar el resultado de cada llamada al gateway de IA (caso de uso, proveedor, modelo, versión y hash del prompt, tokens, latencia, TTFT, estado, código de error e intentos) en la telemetría
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiCallStatus } from "@/features/ai/domain/results/ai-result";
import { type AiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";

export const AI_CALL_RECORDER_TOKEN: unique symbol = Symbol("AI_CALL_RECORDER_TOKEN");

export interface AiCallRecord {
  readonly id: string;
  readonly useCase: AiUseCaseValue;
  readonly userId?: string;
  readonly userRole?: string;
  readonly refType?: string;
  readonly refId?: string;
  readonly provider?: string;
  readonly model?: string;
  readonly promptVersion: string;
  readonly promptHash: string;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly latencyMs: number;
  readonly ttftMs?: number;
  readonly status: AiCallStatus;
  readonly errorCode?: string;
  readonly attempts: number;
  readonly createdAt: Date;
}

export interface IAiCallRecorder {
  record(entry: AiCallRecord): Promise<string>;
}
