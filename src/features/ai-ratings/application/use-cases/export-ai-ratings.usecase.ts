/*
 * Funcionalidad: Caso de uso ExportAiRatingsUseCase
 * Descripción: Filas de valoraciones de IA de un rango (máximo 366 días) para exportar, sin identificador de usuario, con el caso de uso, proveedor, modelo y versión de prompt de la llamada enlazada, limitadas a un número máximo de filas e indicando si el resultado quedó truncado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type AiRatingExportRow, type AiRatingStatsFilters } from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";
import { AI_RATINGS_REPOSITORY_TOKEN, type IAiRatingsRepository } from "@/features/ai-ratings/domain/repositories/ai-ratings.repository";
import { assertValidAiRatingsRange } from "@/features/ai-ratings/domain/services/ai-ratings-range";

export const AI_RATINGS_EXPORT_ROW_LIMIT: number = 50_000;

export interface AiRatingsExport {
  readonly rows: AiRatingExportRow[];
  readonly truncated: boolean;
}

/**
 * @throws {InvalidAiRatingsRangeError} If the range does not start before it ends or spans more than 366 days
 */
@Injectable()
export class ExportAiRatingsUseCase {
  public constructor(
    @Inject(AI_RATINGS_REPOSITORY_TOKEN)
    private readonly _aiRatingsRepository: IAiRatingsRepository,
  ) {}

  public async execute(filters: AiRatingStatsFilters, rowLimit: number = AI_RATINGS_EXPORT_ROW_LIMIT): Promise<AiRatingsExport> {
    assertValidAiRatingsRange(filters.from, filters.to);

    const rows: AiRatingExportRow[] = await this._aiRatingsRepository.getExportRows(filters, rowLimit + 1);

    return { rows: rows.slice(0, rowLimit), truncated: rows.length > rowLimit };
  }
}
