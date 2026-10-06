/*
 * Funcionalidad: Objeto de valor TitleCaseName
 * Descripción: Normaliza y valida nombres en formato de título
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidValueObjectError } from "@/common/domain/errors/invalid-value-object.error";

export class TitleCaseName {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public get value(): string {
    return this._value;
  }

  public static create(value: string): TitleCaseName {
    const trimmed: string = value.trim();

    if (trimmed.length === 0) {
      throw new InvalidValueObjectError("TitleCaseName", "Name cannot be empty.");
    }

    const titleCased: string = trimmed
      .split(/\s+/)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    return new TitleCaseName(titleCased);
  }

  public equals(other: TitleCaseName): boolean {
    return this._value === other._value;
  }
}
