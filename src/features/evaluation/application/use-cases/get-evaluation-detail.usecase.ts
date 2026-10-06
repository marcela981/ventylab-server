/*
 * Funcionalidad: Caso de uso GetEvaluationDetailUseCase
 * Descripción: Detalle de gestión de una evaluación con sus escenarios, preguntas y opciones (incluidas las respuestas correctas), conteos de uso, problemas de preparación para READY y URLs firmadas de los medios resueltas por IMediaUrlResolver cuando está disponible
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Optional } from "@nestjs/common";

import {
  type IMediaUrlResolver,
  MEDIA_URL_RESOLVER_TOKEN,
  type ResolvedMediaURL,
} from "@/common/application/ports/media-url-resolver.interface";
import { EvaluationDetailResult } from "@/features/evaluation/application/results/evaluation-detail.result";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { EvaluationNotFoundError } from "@/features/evaluation/domain/evaluation.errors";
import { EVALUATIONS_REPOSITORY_TOKEN, type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";
import { canManageEvaluation, type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

/**
 * @throws {EvaluationNotFoundError} If the evaluation does not exist
 */
@Injectable()
export class GetEvaluationDetailUseCase {
  public constructor(
    @Inject(EVALUATIONS_REPOSITORY_TOKEN)
    private readonly _evaluationsRepository: IEvaluationsRepository,
    @Optional()
    @Inject(MEDIA_URL_RESOLVER_TOKEN)
    private readonly _mediaUrlResolver?: IMediaUrlResolver,
  ) {}

  public async execute(evaluationId: string, actor: EvaluationActor): Promise<EvaluationDetailResult> {
    const evaluation: Evaluation | undefined = await this._evaluationsRepository.getById(evaluationId);

    if (!evaluation) {
      throw new EvaluationNotFoundError();
    }

    const [usage, mediaUrls] = await Promise.all([
      this._evaluationsRepository.getUsage(evaluation.id),
      this._resolveMedia(evaluation.referencedMediaIds),
    ]);

    return new EvaluationDetailResult({
      evaluation,
      usage,
      readinessIssues: evaluation.readinessIssues(),
      mediaUrls,
      canManage: canManageEvaluation(actor, evaluation),
    });
  }

  private async _resolveMedia(mediaIds: string[]): Promise<Map<string, ResolvedMediaURL>> {
    if (!this._mediaUrlResolver || mediaIds.length === 0) {
      return new Map<string, ResolvedMediaURL>();
    }

    return await this._mediaUrlResolver.resolveMany(mediaIds);
  }
}
