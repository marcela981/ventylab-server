/*
 * Funcionalidad: Pruebas de EvaluationPortsModule
 * Descripción: Verifica que el lector de valoraciones de la retroalimentación se enlaza a AiRatingsFacade con el objetivo GRADE_FEEDBACK y devuelve las valoraciones indexadas por el id de la retroalimentación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type FactoryProvider } from "@nestjs/common";

import { GRADE_FEEDBACK_RATINGS_READER_PROVIDER } from "@/composition/evaluation-ports.module";
import { AiRatingsFacade } from "@/features/ai-ratings/application/services/ai-ratings.facade";
import {
  GRADE_FEEDBACK_RATINGS_READER_TOKEN,
  type GradeFeedbackRatingView,
  type IGradeFeedbackRatingsReader,
} from "@/features/evaluation/application/ports/grade-feedback-ratings-reader.interface";

describe("EvaluationPortsModule", () => {
  it("binds the grade feedback ratings reader to AiRatingsFacade", async () => {
    const provider: FactoryProvider<IGradeFeedbackRatingsReader> = GRADE_FEEDBACK_RATINGS_READER_PROVIDER as FactoryProvider<IGradeFeedbackRatingsReader>;
    const rating: GradeFeedbackRatingView = { id: "rating-1", targetId: "feedback-1", helpful: true, createdAt: new Date(), updatedAt: new Date() };
    const facade: { getOwnRatings: jest.Mock } = { getOwnRatings: jest.fn().mockResolvedValue([rating]) };

    const reader: IGradeFeedbackRatingsReader = provider.useFactory(facade) as IGradeFeedbackRatingsReader;
    const ratings: ReadonlyMap<string, GradeFeedbackRatingView> = await reader.getOwnRatings("student-1", ["feedback-1", "feedback-2"]);

    expect(provider.provide).toBe(GRADE_FEEDBACK_RATINGS_READER_TOKEN);
    expect(provider.inject).toEqual([AiRatingsFacade]);
    expect(facade.getOwnRatings).toHaveBeenCalledWith("student-1", "GRADE_FEEDBACK", ["feedback-1", "feedback-2"]);
    expect([...ratings.entries()]).toEqual([["feedback-1", rating]]);
  });
});
