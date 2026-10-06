/*
 * Funcionalidad: Caso de uso GetEvaluationsUseCase
 * Descripción: Lista paginada de evaluaciones para gestión (filtros de tipo, estado, búsqueda y autor) indicando en cada una si el llamador puede gestionarla
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { EvaluationListItemResult } from "@/features/evaluation/application/results/evaluation-detail.result";
import { type EvaluationSummaryView } from "@/features/evaluation/domain/read-models/evaluation.read-model";
import {
  EVALUATIONS_REPOSITORY_TOKEN,
  type GetEvaluationsQuery,
  type IEvaluationsRepository,
} from "@/features/evaluation/domain/repositories/evaluations.repository";
import { canManageEvaluation, type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

@Injectable()
export class GetEvaluationsUseCase {
  public constructor(
    @Inject(EVALUATIONS_REPOSITORY_TOKEN)
    private readonly _evaluationsRepository: IEvaluationsRepository,
  ) {}

  public async execute(query: GetEvaluationsQuery, actor: EvaluationActor): Promise<Paginated<EvaluationListItemResult>> {
    const page: Paginated<EvaluationSummaryView> = await this._evaluationsRepository.getSummaries(query);

    return page.map(
      (summary: EvaluationSummaryView) => new EvaluationListItemResult({ summary, canManage: canManageEvaluation(actor, summary) }),
    );
  }
}
