/*
 * Funcionalidad: Caso de uso GetEvaluationAnalyticsUseCase
 * Descripción: Estadísticas de una evaluación para su profesor o un administrador: verifica que la evaluación exista y esté asignada a un grupo del alcance del solicitante (o, sin asignaciones, que la haya creado) y, con caché de 60 s por evaluación, solicitante y grupos en alcance, combina las estadísticas de notas (promedio, mediana, histograma en intervalos de 0.5 y tasa de aprobación) con el índice de dificultad por pregunta de EvaluationFacade; para un profesor solo cuentan los intentos de las asignaciones de sus grupos (o sin asignación de evaluaciones que creó), el administrador ve la evaluación completa
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type EvaluationAnalytics } from "@/features/analytics/application/results/analytics.results";
import { AnalyticsCache } from "@/features/analytics/application/services/analytics-cache";
import { type AnalyticsActor, AnalyticsScopeService, type ScopedEvaluation } from "@/features/analytics/application/services/analytics-scope.service";
import { EvaluationFacade } from "@/features/evaluation/application/services/evaluation.facade";

/**
 * @throws {AnalyticsEvaluationNotFoundError} If the evaluation does not exist
 * @throws {AnalyticsScopeForbiddenError} If the requester neither administers the platform, nor manages a group the evaluation is assigned to, nor created an evaluation without assignments
 */
@Injectable()
export class GetEvaluationAnalyticsUseCase {
  public constructor(
    private readonly _scope: AnalyticsScopeService,
    private readonly _cache: AnalyticsCache,
    private readonly _evaluationFacade: EvaluationFacade,
  ) {}

  public async execute(actor: AnalyticsActor, evaluationId: string): Promise<EvaluationAnalytics> {
    const scoped: ScopedEvaluation = await this._scope.assertEvaluationInScope(actor, evaluationId);
    const key: string = `evaluation:${scoped.evaluation.id}:${this._scope.scopeKey(actor, scoped.attemptScope)}`;

    return await this._cache.getOrLoad(key, () => this._build(scoped));
  }

  private async _build({ evaluation, attemptScope }: ScopedEvaluation): Promise<EvaluationAnalytics> {
    const [stats, questions] = await Promise.all([
      this._evaluationFacade.getEvaluationStats(evaluation.id, attemptScope),
      this._evaluationFacade.getEvaluationQuestionStats(evaluation.id, attemptScope),
    ]);

    return { evaluationId: evaluation.id, title: evaluation.title, type: evaluation.type, stats, questions };
  }
}
