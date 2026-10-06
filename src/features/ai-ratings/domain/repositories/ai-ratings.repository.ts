/*
 * Funcionalidad: Repositorio de valoraciones de IA
 * Descripción: Contrato de persistencia de ai_ratings: valoración de un usuario sobre un objetivo, guardado idempotente por (usuario, tipo de objetivo, objetivo), agregados por caso de uso, proveedor, modelo y versión de prompt de la llamada enlazada y filas para exportar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiRating } from "@/features/ai-ratings/domain/entities/ai-rating.entity";
import {
  type AiRatingExportRow,
  type AiRatingGroupAggregate,
  type AiRatingStatsFilters,
  type AiRatingTargetTypeValue,
} from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";

export const AI_RATINGS_REPOSITORY_TOKEN: unique symbol = Symbol("AI_RATINGS_REPOSITORY_TOKEN");

export interface IAiRatingsRepository {
  getByUserAndTarget(userId: string, targetType: AiRatingTargetTypeValue, targetId: string, transaction?: unknown): Promise<AiRating | undefined>;
  save(rating: AiRating, transaction?: unknown): Promise<void>;
  getStatsGroups(filters: AiRatingStatsFilters): Promise<AiRatingGroupAggregate[]>;
  getExportRows(filters: AiRatingStatsFilters, limit: number): Promise<AiRatingExportRow[]>;
}
