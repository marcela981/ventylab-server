/*
 * Funcionalidad: Objeto de valor Language
 * Descripción: Valida y representa los idiomas soportados (es, en) y el idioma por defecto
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidValueObjectError } from "@/common/domain/errors/invalid-value-object.error";

export type LanguageValue = "en" | "es";

export const EN_LANGUAGE_VALUE: LanguageValue = "en";

export const ES_LANGUAGE_VALUE: LanguageValue = "es";

export const LANGUAGE_VALUES: readonly LanguageValue[] = [
  EN_LANGUAGE_VALUE,
  ES_LANGUAGE_VALUE,
] as const;

export const DEFAULT_LANGUAGE_VALUE: LanguageValue = EN_LANGUAGE_VALUE;

export class Language {
  private readonly _value: LanguageValue;

  private constructor(value: LanguageValue) {
    this._value = value;
  }

  public get value(): LanguageValue {
    return this._value;
  }

  public static create(value: string): Language {
    if (!LANGUAGE_VALUES.includes(value as LanguageValue)) {
      throw new InvalidValueObjectError("Language", value);
    }

    return new Language(value as LanguageValue);
  }

  public static createOrDefault(value: string): Language {
    if (!LANGUAGE_VALUES.includes(value as LanguageValue)) {
      return Language.default();
    }

    return new Language(value as LanguageValue);
  }

  public static default(): Language {
    return new Language(DEFAULT_LANGUAGE_VALUE);
  }

  public equals(other: Language): boolean {
    return this._value === other._value;
  }
}
