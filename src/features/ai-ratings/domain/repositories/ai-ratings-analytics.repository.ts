/*
 * Funcionalidad: Puerto de repositorio AI_RATINGS_ANALYTICS_REPOSITORY_TOKEN
 * Descripción: Define la interfaz IAiRatingsAnalyticsRepository de lecturas por lotes para analítica (valoraciones de varios usuarios agrupadas por usuario y caso de uso de la llamada de IA valorada, con conteo útil y medias de las dimensiones), su modelo de lectura y su token de inyección
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiRatingDimension, type AiRatingDimensionStats } from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";

export const AI_RATINGS_ANALYTICS_REPOSITORY_TOKEN: unique symbol = Symbol("AI_RATINGS_ANALYTICS_REPOSITORY_TOKEN");

export interface AiRatingUserUseCaseAggregate {
  readonly userId: string;
  readonly useCase: string;
  readonly ratings: number;
  readonly helpfulCount: number;
  readonly dimensions: Readonly<Record<AiRatingDimension, AiRatingDimensionStats>>;
}

export interface IAiRatingsAnalyticsRepository {
  getUserUseCaseAggregates(userIds: readonly string[]): Promise<AiRatingUserUseCaseAggregate[]>;
}
