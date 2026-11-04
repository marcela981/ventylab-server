/*
 * Funcionalidad: Errores del gateway de IA
 * Descripción: Errores de dominio del gateway de IA (proveedores no disponibles → 503, cuota excedida → 429 con hora de reinicio en el mensaje traducido y en Retry-After, proveedor desconocido → 404 y proveedor sin configuración → 422 para la sonda manual) y el error interno de proveedor con su clasificación; v1.3: sin el error del mapeo HTTP personalizado retirado; v1.4: el error de proveedor lleva el Retry-After del proveedor y el de proveedores no disponibles una hora de reintento opcional (Retry-After en la respuesta) cuando todos los proveedores limitaron la tasa
 * Versión: 1.4
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class AiProvidersUnavailableError extends DomainError {
  // Set when every provider answered 429 with a Retry-After: the client is told when to try again.
  private readonly _retryAt?: Date;

  public constructor(retryAt?: Date) {
    super("No AI provider is available right now", "ai.providers_unavailable");
    this._retryAt = retryAt;
  }

  public get retryAt(): Date | undefined {
    return this._retryAt;
  }
}

export class AiQuotaExceededError extends DomainError {
  public readonly resetAt: Date;

  public constructor(resetAt: Date) {
    super("The AI usage quota was exceeded", "ai.quota_exceeded");
    this.resetAt = resetAt;
  }

  public get retryAt(): Date {
    return this.resetAt;
  }

  public get i18nArgs(): Record<string, string> {
    return { resetAt: `${this.resetAt.toISOString().slice(0, 16).replace("T", " ")} UTC` };
  }
}

export class AiStreamInterruptedError extends DomainError {
  public constructor() {
    super("The AI response was interrupted", "ai.stream_interrupted");
  }
}

export class UnknownAiProviderError extends DomainError {
  public constructor(public readonly provider: string) {
    super(`Unknown AI provider: ${provider}`, "ai.provider_unknown");
  }

  public get i18nArgs(): Record<string, string> {
    return { provider: this.provider };
  }
}

export class AiProviderNotRegisteredError extends DomainError {
  public constructor(public readonly provider: string) {
    super(`The AI provider ${provider} has no configuration`, "ai.provider_not_registered");
  }

  public get i18nArgs(): Record<string, string> {
    return { provider: this.provider };
  }
}

export class AiCallAbortedError extends Error {
  public constructor() {
    super("The AI call was aborted by the caller");
    this.name = AiCallAbortedError.name;
  }
}

export type AiProviderErrorKind = "TIMEOUT" | "RATE_LIMIT" | "SERVER" | "NETWORK" | "CLIENT" | "INVALID_RESPONSE" | "ABORTED";

export class AiProviderError extends Error {
  public readonly kind: AiProviderErrorKind;
  public readonly statusCode?: number;
  // Wait the provider asked for (Retry-After), already bounded.
  public readonly retryAfterMs?: number;

  public constructor(kind: AiProviderErrorKind, message: string, statusCode?: number, retryAfterMs?: number) {
    super(message);
    this.name = AiProviderError.name;
    this.kind = kind;
    this.statusCode = statusCode;
    this.retryAfterMs = retryAfterMs;
  }
}
