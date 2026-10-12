/*
 * Funcionalidad: Lector de valores de ajustes de la plataforma
 * Descripción: Valida el tipo y la forma de un valor recibido (número, entero, booleano, cadena, objeto con campos conocidos) y sus límites duros, lanzando InvalidPlatformSettingValueError o PlatformSettingHardLimitExceededError con la ruta del campo; en modo de ajuste lleva los números, cadenas y listas fuera de límites al valor válido más cercano en lugar de rechazarlos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidPlatformSettingValueError, PlatformSettingHardLimitExceededError } from "@/features/platform-settings/domain/platform-settings.errors";

export interface NumberLimits {
  readonly min: number;
  readonly max: number;
  readonly integer: boolean;
}

export class PlatformSettingValueReader {
  public constructor(
    private readonly _key: string,
    private readonly _clamp: boolean = false,
  ) {}

  public get clamping(): boolean {
    return this._clamp;
  }

  public invalid(path: string, reason: string): never {
    throw new InvalidPlatformSettingValueError(this._key, `${path} ${reason}`);
  }

  public outOfLimits(path: string, reason: string): never {
    throw new PlatformSettingHardLimitExceededError(this._key, `${path} ${reason}`);
  }

  public number(path: string, value: unknown, limits: NumberLimits): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return this.invalid(path, "must be a number");
    }

    if (this._clamp) {
      const rounded: number = limits.integer ? Math.round(value) : value;

      return Math.min(limits.max, Math.max(limits.min, rounded));
    }

    if (limits.integer && !Number.isInteger(value)) {
      return this.invalid(path, "must be an integer");
    }

    if (value < limits.min || value > limits.max) {
      return this.outOfLimits(path, `must be between ${limits.min} and ${limits.max}`);
    }

    return value;
  }

  public optionalNumber(path: string, value: unknown, limits: NumberLimits): number | undefined {
    return value === undefined ? undefined : this.number(path, value, limits);
  }

  public boolean(path: string, value: unknown): boolean {
    if (typeof value !== "boolean") {
      return this.invalid(path, "must be a boolean");
    }

    return value;
  }

  public string(path: string, value: unknown, maxLength: number): string {
    if (typeof value !== "string" || value.trim() === "") {
      return this.invalid(path, "must be a non-empty string");
    }

    if (value.length > maxLength && this._clamp) {
      return value.slice(0, maxLength);
    }

    if (value.length > maxLength) {
      return this.outOfLimits(path, `must have at most ${maxLength} characters`);
    }

    return value;
  }

  public object(path: string, value: unknown, allowedFields?: readonly string[]): Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return this.invalid(path, "must be an object");
    }

    const record: Record<string, unknown> = value as Record<string, unknown>;

    if (allowedFields !== undefined) {
      const unknownField: string | undefined = Object.keys(record).find((field: string): boolean => !allowedFields.includes(field));

      if (unknownField !== undefined) {
        return this.invalid(`${path}.${unknownField}`, "is not a known field");
      }
    }

    return record;
  }

  public array(path: string, value: unknown, minLength: number, maxLength: number): unknown[] {
    if (!Array.isArray(value)) {
      return this.invalid(path, "must be an array");
    }

    if (value.length > maxLength && this._clamp) {
      return value.slice(0, maxLength);
    }

    if (value.length < minLength || value.length > maxLength) {
      return this.outOfLimits(path, `must have between ${minLength} and ${maxLength} entries`);
    }

    return value;
  }
}
