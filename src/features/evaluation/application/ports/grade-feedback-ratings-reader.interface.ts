/*
 * Funcionalidad: Puerto IGradeFeedbackRatingsReader
 * Descripción: Lectura de las valoraciones que el propio estudiante dio a los bloques de retroalimentación de su intento (objetivo GRADE_FEEDBACK), para incluirlas en la respuesta de la retroalimentación sin una petición por bloque; lo enlaza la raíz de composición a la feature de valoraciones de IA
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const GRADE_FEEDBACK_RATINGS_READER_TOKEN: unique symbol = Symbol("GRADE_FEEDBACK_RATINGS_READER_TOKEN");

export interface GradeFeedbackRatingView {
  readonly id: string;
  readonly targetId: string;
  readonly surface?: string;
  readonly helpful: boolean;
  readonly comment?: string;
  readonly quality?: number;
  readonly understanding?: number;
  readonly expression?: number;
  readonly safety?: number;
  readonly trust?: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface IGradeFeedbackRatingsReader {
  // Ratings of the user keyed by the rated feedback ID; feedback without a rating is absent
  getOwnRatings(userId: string, feedbackIds: ReadonlyArray<string>): Promise<ReadonlyMap<string, GradeFeedbackRatingView>>;
}
