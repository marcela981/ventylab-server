/*
 * Funcionalidad: Errores de dominio de las valoraciones de IA
 * Descripción: Errores de la feature ai-ratings: escala Likert fuera de rango, comentario demasiado largo, objetivo inexistente, usuario que no es el destinatario de la salida, aiCallId incoherente con el objetivo y rango de fechas inválido para estadísticas y exportación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class InvalidAiRatingScoreError extends DomainError {
  public constructor(dimension: string) {
    super(`The ${dimension} rating must be an integer between 1 and 5`, "ai-ratings.invalid_score");
  }
}

export class AiRatingCommentTooLongError extends DomainError {
  public constructor(maxLength: number) {
    super(`The comment must have at most ${maxLength} characters`, "ai-ratings.comment_too_long");
  }
}

export class AiRatingTargetNotFoundError extends DomainError {
  public constructor() {
    super("The AI output to rate was not found", "ai-ratings.target_not_found");
  }
}

export class AiRatingNotRecipientError extends DomainError {
  public constructor() {
    super("Only the recipient of an AI output can rate it", "ai-ratings.not_recipient");
  }
}

export class AiRatingCallMismatchError extends DomainError {
  public constructor() {
    super("The AI call does not match the rated output", "ai-ratings.ai_call_mismatch");
  }
}

export class InvalidAiRatingsRangeError extends DomainError {
  public constructor() {
    super("The date range must start before it ends and span at most 366 days", "ai-ratings.invalid_range");
  }
}
