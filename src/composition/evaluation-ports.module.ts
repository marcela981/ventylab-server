/*
 * Funcionalidad: Módulo EvaluationPortsModule
 * Descripción: Parte global de la raíz de composición que enlaza el puerto GRADE_FEEDBACK_RATINGS_READER_TOKEN de la evaluación a AiRatingsFacade.getOwnRatings (objetivo GRADE_FEEDBACK), de modo que la feature de evaluación no importa la de valoraciones de IA
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Global, Module, type Provider } from "@nestjs/common";

import { AiRatingsModule } from "@/features/ai-ratings/ai-ratings.module";
import { AiRatingsFacade, type OwnAiRatingView } from "@/features/ai-ratings/application/services/ai-ratings.facade";
import {
  GRADE_FEEDBACK_RATINGS_READER_TOKEN,
  type GradeFeedbackRatingView,
  type IGradeFeedbackRatingsReader,
} from "@/features/evaluation/application/ports/grade-feedback-ratings-reader.interface";

export const GRADE_FEEDBACK_RATINGS_READER_PROVIDER: Provider = {
  provide: GRADE_FEEDBACK_RATINGS_READER_TOKEN,
  inject: [AiRatingsFacade],
  useFactory: (ratings: AiRatingsFacade): IGradeFeedbackRatingsReader => ({
    getOwnRatings: async (userId: string, feedbackIds: ReadonlyArray<string>): Promise<ReadonlyMap<string, GradeFeedbackRatingView>> => {
      const own: OwnAiRatingView[] = await ratings.getOwnRatings(userId, "GRADE_FEEDBACK", feedbackIds);

      return new Map<string, GradeFeedbackRatingView>(own.map((rating: OwnAiRatingView) => [rating.targetId, rating]));
    },
  }),
};

@Global()
@Module({
  imports: [AiRatingsModule],
  providers: [GRADE_FEEDBACK_RATINGS_READER_PROVIDER],
  exports: [GRADE_FEEDBACK_RATINGS_READER_TOKEN],
})
export class EvaluationPortsModule {}
