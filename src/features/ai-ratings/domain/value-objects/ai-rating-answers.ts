/*
 * Funcionalidad: Value object AiRatingAnswers
 * Descripción: Respuestas de una valoración de una salida de IA alineadas con QUEST (Tam et al. 2024, npj Digital Medicine): útil (obligatorio), comentario opcional de hasta 2000 caracteres y escalas Likert opcionales de 1 a 5 de calidad, comprensión, expresión, seguridad y confianza
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AiRatingCommentTooLongError, InvalidAiRatingScoreError } from "@/features/ai-ratings/domain/ai-ratings.errors";
import {
  AI_RATING_DIMENSIONS,
  type AiRatingDimension,
  type AiRatingDimensionScores,
} from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";

export const AI_RATING_COMMENT_MAX_LENGTH: number = 2000;

export const LIKERT_MIN: number = 1;

export const LIKERT_MAX: number = 5;

export interface AiRatingAnswersProps {
  readonly helpful: boolean;
  readonly comment?: string;
  readonly quality?: number;
  readonly understanding?: number;
  readonly expression?: number;
  readonly safety?: number;
  readonly trust?: number;
}

export class AiRatingAnswers {
  private readonly _helpful: boolean;
  private readonly _comment?: string;
  private readonly _dimensions: AiRatingDimensionScores;

  private constructor(helpful: boolean, comment: string | undefined, dimensions: AiRatingDimensionScores) {
    this._helpful = helpful;
    this._comment = comment;
    this._dimensions = dimensions;
  }

  public static create(props: AiRatingAnswersProps): AiRatingAnswers {
    for (const dimension of AI_RATING_DIMENSIONS) {
      AiRatingAnswers._assertLikert(dimension, props[dimension]);
    }

    if (props.comment !== undefined && props.comment.length > AI_RATING_COMMENT_MAX_LENGTH) {
      throw new AiRatingCommentTooLongError(AI_RATING_COMMENT_MAX_LENGTH);
    }

    return new AiRatingAnswers(props.helpful, props.comment === "" ? undefined : props.comment, {
      quality: props.quality,
      understanding: props.understanding,
      expression: props.expression,
      safety: props.safety,
      trust: props.trust,
    });
  }

  public get helpful(): boolean {
    return this._helpful;
  }

  public get comment(): string | undefined {
    return this._comment;
  }

  public get dimensions(): AiRatingDimensionScores {
    return this._dimensions;
  }

  public get quality(): number | undefined {
    return this._dimensions.quality;
  }

  public get understanding(): number | undefined {
    return this._dimensions.understanding;
  }

  public get expression(): number | undefined {
    return this._dimensions.expression;
  }

  public get safety(): number | undefined {
    return this._dimensions.safety;
  }

  public get trust(): number | undefined {
    return this._dimensions.trust;
  }

  private static _assertLikert(dimension: AiRatingDimension, value: number | undefined): void {
    if (value === undefined) {
      return;
    }

    if (!Number.isInteger(value) || value < LIKERT_MIN || value > LIKERT_MAX) {
      throw new InvalidAiRatingScoreError(dimension);
    }
  }
}
