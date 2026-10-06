/*
 * Funcionalidad: Puerto IAiQuotaGuard
 * Descripción: Contrato que verifica, antes de llamar a un proveedor, que el usuario no haya superado su cuota de IA para el caso de uso; recibe la versión, el hash y la referencia de la llamada para registrar el rechazo y lanza AiQuotaExceededError cuando la supera
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";

export const AI_QUOTA_GUARD_TOKEN: unique symbol = Symbol("AI_QUOTA_GUARD_TOKEN");

export interface AiQuotaCallContext {
  readonly promptVersion: string;
  readonly promptHash: string;
  readonly refType?: string;
  readonly refId?: string;
}

export interface IAiQuotaGuard {
  assertWithinQuota(userId: string | undefined, role: string | undefined, useCase: AiUseCaseValue, call: AiQuotaCallContext): Promise<void>;
}
