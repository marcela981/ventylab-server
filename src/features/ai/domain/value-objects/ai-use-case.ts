/*
 * Funcionalidad: Value object AiUseCase
 * Descripción: Enumera los casos de uso del gateway de IA (retroalimentación de calificaciones, análisis de notas, profundización de páginas, preguntas de lección, chat libre, verificación de tema y asistencia en simulación) y valida sus valores
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidValueObjectError } from "@/common/domain/errors/invalid-value-object.error";

export type AiUseCaseValue =
  | "GRADE_FEEDBACK"
  | "NOTES_ANALYSIS"
  | "PAGE_DEEPEN"
  | "LESSON_QA"
  | "FREE_CHAT"
  | "TOPIC_CHECK"
  | "SIM_ASSIST";

export const GRADE_FEEDBACK_USE_CASE: AiUseCaseValue = "GRADE_FEEDBACK";

export const NOTES_ANALYSIS_USE_CASE: AiUseCaseValue = "NOTES_ANALYSIS";

export const PAGE_DEEPEN_USE_CASE: AiUseCaseValue = "PAGE_DEEPEN";

export const LESSON_QA_USE_CASE: AiUseCaseValue = "LESSON_QA";

export const FREE_CHAT_USE_CASE: AiUseCaseValue = "FREE_CHAT";

export const TOPIC_CHECK_USE_CASE: AiUseCaseValue = "TOPIC_CHECK";

export const SIM_ASSIST_USE_CASE: AiUseCaseValue = "SIM_ASSIST";

export const AI_USE_CASE_VALUES: readonly AiUseCaseValue[] = [
  GRADE_FEEDBACK_USE_CASE,
  NOTES_ANALYSIS_USE_CASE,
  PAGE_DEEPEN_USE_CASE,
  LESSON_QA_USE_CASE,
  FREE_CHAT_USE_CASE,
  TOPIC_CHECK_USE_CASE,
  SIM_ASSIST_USE_CASE,
] as const;

export function isAiUseCaseValue(value: string): value is AiUseCaseValue {
  return AI_USE_CASE_VALUES.includes(value as AiUseCaseValue);
}

export class AiUseCase {
  private readonly _value: AiUseCaseValue;

  private constructor(value: AiUseCaseValue) {
    this._value = value;
  }

  public get value(): AiUseCaseValue {
    return this._value;
  }

  public static create(value: string): AiUseCase {
    if (!isAiUseCaseValue(value)) {
      throw new InvalidValueObjectError("AiUseCase", value);
    }

    return new AiUseCase(value);
  }

  public equals(other: AiUseCase): boolean {
    return this._value === other._value;
  }
}
