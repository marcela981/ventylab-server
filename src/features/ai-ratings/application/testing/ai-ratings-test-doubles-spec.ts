/*
 * Funcionalidad: Dobles de prueba de valoraciones de IA
 * Descripción: Repositorio en memoria de valoraciones de IA indexado por (usuario, tipo de objetivo, objetivo) que registra las transacciones recibidas y devuelve agregados y filas de exportación configurables
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
import { type IAiRatingsRepository } from "@/features/ai-ratings/domain/repositories/ai-ratings.repository";

export class InMemoryAiRatingsRepository implements IAiRatingsRepository {
  public readonly transactions: unknown[] = [];
  public statsGroups: AiRatingGroupAggregate[] = [];
  public exportRows: AiRatingExportRow[] = [];
  private readonly _ratings: Map<string, AiRating> = new Map<string, AiRating>();

  public all(): AiRating[] {
    return [...this._ratings.values()];
  }

  public getByUserAndTarget(
    userId: string,
    targetType: AiRatingTargetTypeValue,
    targetId: string,
    transaction?: unknown,
  ): Promise<AiRating | undefined> {
    this.transactions.push(transaction);

    return Promise.resolve(this._ratings.get(InMemoryAiRatingsRepository._key(userId, targetType, targetId)));
  }

  public save(rating: AiRating, transaction?: unknown): Promise<void> {
    this.transactions.push(transaction);
    this._ratings.set(InMemoryAiRatingsRepository._key(rating.userId, rating.targetType, rating.targetId), rating);

    return Promise.resolve();
  }

  public getStatsGroups(_filters: AiRatingStatsFilters): Promise<AiRatingGroupAggregate[]> {
    return Promise.resolve(this.statsGroups);
  }

  public getExportRows(_filters: AiRatingStatsFilters, limit: number): Promise<AiRatingExportRow[]> {
    return Promise.resolve(this.exportRows.slice(0, limit));
  }

  private static _key(userId: string, targetType: AiRatingTargetTypeValue, targetId: string): string {
    return `${userId}|${targetType}|${targetId}`;
  }
}
