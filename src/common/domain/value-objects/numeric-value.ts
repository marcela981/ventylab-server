/*
 * Funcionalidad: Objeto de valor NumericValue
 * Descripción: Valida números según restricciones de mínimo, máximo y decimales
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidValueObjectError } from "@/common/domain/errors/invalid-value-object.error";

export interface NumberConstraints {
  min?: number;
  max?: number;
  allowDecimals?: boolean;
}

export class NumericValue {
  private readonly _value: number;
  private readonly _constraints: NumberConstraints;

  private constructor(value: number, constraints: NumberConstraints = {}) {
    this._value = value;
    this._constraints = constraints;
  }

  public get value(): number {
    return this._value;
  }

  public static create(value: number, constraints: NumberConstraints = {}): NumericValue {
    const { min, max, allowDecimals = false } = constraints;

    if (!allowDecimals && !Number.isInteger(value)) {
      throw new InvalidValueObjectError("NumericValue", `Value must be an integer: ${value}`);
    }

    if (min !== undefined && value < min) {
      throw new InvalidValueObjectError("NumericValue", `Value must be at least ${min}: ${value}`);
    }

    if (max !== undefined && value > max) {
      throw new InvalidValueObjectError("NumericValue", `Value must be at most ${max}: ${value}`);
    }

    return new NumericValue(value, constraints);
  }

  public static positive(value: number): NumericValue {
    return NumericValue.create(value, { min: 0 });
  }

  public static percentage(value: number): NumericValue {
    return NumericValue.create(value, { min: 0, max: 1 });
  }

  public static range(value: number, min: number, max: number): NumericValue {
    return NumericValue.create(value, { min, max });
  }

  public equals(other: NumericValue): boolean {
    return this._value === other._value;
  }
}
