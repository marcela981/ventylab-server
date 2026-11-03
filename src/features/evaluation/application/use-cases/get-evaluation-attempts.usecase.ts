/*
 * Funcionalidad: Caso de uso GetEvaluationAttemptsUseCase
 * Descripción: Lista de intentos de una evaluación para la pantalla de calificación del profesor (o administrador), con el mismo alcance que la cola de revisión: cierra antes de forma perezosa los intentos vencidos filtrados, excluye los intentos heredados (legacySource), filtra por grupo y por estados, pagina y añade los conteos por estado de la evaluación y grupo (sin el filtro de estados)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { EvaluationGradingAccess } from "@/features/evaluation/application/services/evaluation-grading-access";
import { GradingQueueLazyCloser } from "@/features/evaluation/application/services/grading-queue-lazy-closer";
import {
  type AttemptStatusCountsView,
  type GradingAttemptListItemView,
} from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import { type EvaluationAssignmentScope } from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import {
  EVALUATION_GRADING_REPOSITORY_TOKEN,
  type GradingAttemptFilter,
  type IEvaluationGradingRepository,
} from "@/features/evaluation/domain/repositories/evaluation-grading.repository";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";
import { type EvaluationAttemptStatusValue } from "@/features/evaluation/domain/value-objects/evaluation-attempt-status";

export interface GetEvaluationAttemptsInput {
  readonly evaluationId: string;
  readonly groupId?: string;
  readonly statuses?: ReadonlyArray<EvaluationAttemptStatusValue>;
  readonly page: number;
  readonly limit: number;
}

export interface EvaluationAttemptsPage {
  readonly attempts: Paginated<GradingAttemptListItemView>;
  readonly counts: AttemptStatusCountsView;
}

@Injectable()
export class GetEvaluationAttemptsUseCase {
  public constructor(
    @Inject(EVALUATION_GRADING_REPOSITORY_TOKEN)
    private readonly _gradingRepository: IEvaluationGradingRepository,
    private readonly _lazyCloser: GradingQueueLazyCloser,
    private readonly _access: EvaluationGradingAccess,
  ) {}

  public async execute(input: GetEvaluationAttemptsInput, actor: EvaluationActor): Promise<EvaluationAttemptsPage> {
    const scope: EvaluationAssignmentScope | undefined = await this._access.scopeFor(actor);
    const filter: GradingAttemptFilter = { evaluationId: input.evaluationId, groupId: input.groupId, scope };

    await this._lazyCloser.closeExpired(filter, new Date());

    const [attempts, counts] = await Promise.all([
      this._gradingRepository.getAttempts({ ...filter, statuses: input.statuses, page: input.page, limit: input.limit }),
      this._gradingRepository.countAttemptsByStatus(filter),
    ]);

    return { attempts, counts };
  }
}
