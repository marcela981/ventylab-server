/*
 * Funcionalidad: Errores del gateway de IA
 * Descripción: Errores de dominio del gateway de IA (proveedores no disponibles → 503, cuota excedida → 429 con hora de reinicio en el mensaje traducido y en Retry-After, mapeo HTTP personalizado sin configurar) y el error interno de proveedor con su clasificación
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class AiProvidersUnavailableError extends DomainError {
  public constructor() {
    super("No AI provider is available right now", "ai.providers_unavailable");
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

export class AiCallAbortedError extends Error {
  public constructor() {
    super("The AI call was aborted by the caller");
    this.name = AiCallAbortedError.name;
  }
}

export class CustomHttpMappingNotConfiguredError extends Error {
  public constructor() {
    super("The custom HTTP provider mapping is not configured");
    this.name = CustomHttpMappingNotConfiguredError.name;
  }
}

export type AiProviderErrorKind = "TIMEOUT" | "RATE_LIMIT" | "SERVER" | "NETWORK" | "CLIENT" | "INVALID_RESPONSE" | "ABORTED";

export class AiProviderError extends Error {
  public readonly kind: AiProviderErrorKind;
  public readonly statusCode?: number;

  public constructor(kind: AiProviderErrorKind, message: string, statusCode?: number) {
    super(message);
    this.name = AiProviderError.name;
    this.kind = kind;
    this.statusCode = statusCode;
  }
}
