/*
 * Funcionalidad: Errores de dominio de la configuración de la plataforma
 * Descripción: Errores de clave desconocida, valor inválido, valor fuera de los límites duros, conflicto de versión (concurrencia optimista) y proveedor de IA sin credenciales al entrar en una cadena
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class PlatformSettingNotFoundError extends DomainError {
  public constructor(public readonly key: string) {
    super(`Platform setting ${key} does not exist`, "platform-settings.setting_not_found");
  }

  public get i18nArgs(): Record<string, string> {
    return { key: this.key };
  }
}

export class InvalidPlatformSettingValueError extends DomainError {
  public constructor(
    public readonly key: string,
    public readonly reason: string,
  ) {
    super(`Invalid value for platform setting ${key}: ${reason}`, "platform-settings.invalid_value");
  }

  public get i18nArgs(): Record<string, string> {
    return { key: this.key, reason: this.reason };
  }

  public get details(): { key: string; reason: string } {
    return { key: this.key, reason: this.reason };
  }
}

export class PlatformSettingHardLimitExceededError extends DomainError {
  public constructor(
    public readonly key: string,
    public readonly reason: string,
  ) {
    super(`Platform setting ${key} exceeds its hard limits: ${reason}`, "platform-settings.hard_limit_exceeded");
  }

  public get i18nArgs(): Record<string, string> {
    return { key: this.key, reason: this.reason };
  }

  public get details(): { key: string; reason: string } {
    return { key: this.key, reason: this.reason };
  }
}

export class PlatformSettingVersionConflictError extends DomainError {
  public constructor(
    public readonly key: string,
    public readonly currentVersion: number,
  ) {
    super(`Platform setting ${key} was changed by someone else`, "platform-settings.version_conflict");
  }

  public get i18nArgs(): Record<string, string> {
    return { key: this.key };
  }

  public get details(): { key: string; currentVersion: number } {
    return { key: this.key, currentVersion: this.currentVersion };
  }
}

export class AiProviderNotConfiguredError extends DomainError {
  public constructor(public readonly providers: readonly string[]) {
    super(`AI providers without credentials cannot enter a provider chain: ${providers.join(", ")}`, "platform-settings.ai_provider_not_configured");
  }

  public get i18nArgs(): Record<string, string> {
    return { providers: this.providers.join(", ") };
  }

  public get details(): { providers: readonly string[] } {
    return { providers: this.providers };
  }
}
