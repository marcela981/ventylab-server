/*
 * Funcionalidad: Pruebas de AiRatingAnswers
 * Descripción: Verifica la validación de las respuestas de una valoración de IA (dimensiones QUEST): útil obligatorio, escalas Likert enteras de 1 a 5 opcionales y comentario de hasta 2000 caracteres
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AiRatingCommentTooLongError, InvalidAiRatingScoreError } from "@/features/ai-ratings/domain/ai-ratings.errors";
import { AI_RATING_COMMENT_MAX_LENGTH, AiRatingAnswers } from "@/features/ai-ratings/domain/value-objects/ai-rating-answers";

describe("AiRatingAnswers", () => {
  it("accepts a helpful flag alone", () => {
    const answers: AiRatingAnswers = AiRatingAnswers.create({ helpful: true });

    expect(answers.helpful).toBe(true);
    expect(answers.comment).toBeUndefined();
    expect(answers.quality).toBeUndefined();
  });

  it("accepts every dimension within 1 to 5 and a comment", () => {
    const answers: AiRatingAnswers = AiRatingAnswers.create({
      helpful: false,
      comment: "Too generic",
      quality: 1,
      understanding: 2,
      expression: 3,
      safety: 4,
      trust: 5,
    });

    expect(answers.dimensions).toEqual({ quality: 1, understanding: 2, expression: 3, safety: 4, trust: 5 });
    expect(answers.comment).toBe("Too generic");
  });

  it.each([0, 6, -1, 2.5, Number.NaN])("rejects the Likert value %p", (value: number) => {
    const act = (): AiRatingAnswers => AiRatingAnswers.create({ helpful: true, safety: value });

    expect(act).toThrow(InvalidAiRatingScoreError);
  });

  it("rejects a comment longer than the maximum", () => {
    const act = (): AiRatingAnswers => AiRatingAnswers.create({ helpful: true, comment: "a".repeat(AI_RATING_COMMENT_MAX_LENGTH + 1) });

    expect(act).toThrow(AiRatingCommentTooLongError);
  });

  it("accepts a comment of exactly the maximum length and drops an empty one", () => {
    const longest: AiRatingAnswers = AiRatingAnswers.create({ helpful: true, comment: "a".repeat(AI_RATING_COMMENT_MAX_LENGTH) });
    const empty: AiRatingAnswers = AiRatingAnswers.create({ helpful: true, comment: "" });

    expect(longest.comment).toHaveLength(AI_RATING_COMMENT_MAX_LENGTH);
    expect(empty.comment).toBeUndefined();
  });
});
