/*
 * Funcionalidad: Lector de valores de ajustes de la plataforma
 * Descripción: Valida el tipo y la forma de un valor recibido (número, entero, booleano, cadena, objeto con campos conocidos) y sus límites duros, lanzando InvalidPlatformSettingValueError o PlatformSettingHardLimitExceededError con la ruta del campo y un código de motivo traducible; en modo de ajuste lleva los números, cadenas y listas fuera de límites al valor válido más cercano en lugar de rechazarlos
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidPlatformSettingValueError, PlatformSettingHardLimitExceededError } from "@/features/platform-settings/domain/platform-settings.errors";
import { type PlatformSettingReasonArgs, type PlatformSettingReasonCode } from "@/features/platform-settings/domain/registry/platform-setting-reasons";

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

  public invalid(path: string, reason: PlatformSettingReasonCode, args: PlatformSettingReasonArgs = {}): never {
    throw new InvalidPlatformSettingValueError(this._key, path, reason, args);
  }

  public outOfLimits(path: string, reason: PlatformSettingReasonCode, args: PlatformSettingReasonArgs = {}): never {
    throw new PlatformSettingHardLimitExceededError(this._key, path, reason, args);
  }

  public number(path: string, value: unknown, limits: NumberLimits): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return this.invalid(path, "not_a_number");
    }

    if (this._clamp) {
      const rounded: number = limits.integer ? Math.round(value) : value;

      return Math.min(limits.max, Math.max(limits.min, rounded));
    }

    if (limits.integer && !Number.isInteger(value)) {
      return this.invalid(path, "not_an_integer");
    }

    if (value < limits.min || value > limits.max) {
      return this.outOfLimits(path, "out_of_range", { min: limits.min, max: limits.max });
    }

    return value;
  }

  public optionalNumber(path: string, value: unknown, limits: NumberLimits): number | undefined {
    return value === undefined ? undefined : this.number(path, value, limits);
  }

  public boolean(path: string, value: unknown): boolean {
    if (typeof value !== "boolean") {
      return this.invalid(path, "not_a_boolean");
    }

    return value;
  }

  public string(path: string, value: unknown, maxLength: number): string {
    if (typeof value !== "string" || value.trim() === "") {
      return this.invalid(path, "empty_string");
    }

    if (value.length > maxLength && this._clamp) {
      return value.slice(0, maxLength);
    }

    if (value.length > maxLength) {
      return this.outOfLimits(path, "too_long", { max: maxLength });
    }

    return value;
  }

  public object(path: string, value: unknown, allowedFields?: readonly string[]): Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return this.invalid(path, "not_an_object");
    }

    const record: Record<string, unknown> = value as Record<string, unknown>;

    if (allowedFields !== undefined) {
      const unknownField: string | undefined = Object.keys(record).find((field: string): boolean => !allowedFields.includes(field));

      if (unknownField !== undefined) {
        return this.invalid(`${path}.${unknownField}`, "unknown_field");
      }
    }

    return record;
  }

  public array(path: string, value: unknown, minLength: number, maxLength: number): unknown[] {
    if (!Array.isArray(value)) {
      return this.invalid(path, "not_an_array");
    }

    if (value.length > maxLength && this._clamp) {
      return value.slice(0, maxLength);
    }

    if (value.length < minLength || value.length > maxLength) {
      return this.outOfLimits(path, "entries_out_of_range", { min: minLength, max: maxLength });
    }

    return value;
  }
}
