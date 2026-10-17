/*
 * Funcionalidad: Caso de uso GetGradingQueueUseCase
 * Descripción: Cola de revisión del profesor (o administrador): antes de listar cierra de forma perezosa, con GradingQueueLazyCloser y un máximo por solicitud, los intentos en curso vencidos de las evaluaciones, grupos y estudiantes filtrados en su alcance; luego devuelve paginados los intentos PENDING_REVIEW de ese alcance, del más antiguo al más reciente
 * Versión: 1.2
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
import { type GradingQueueItemView } from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import { type EvaluationAssignmentScope } from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import {
  EVALUATION_GRADING_REPOSITORY_TOKEN,
  type GradingAttemptFilter,
  type IEvaluationGradingRepository,
} from "@/features/evaluation/domain/repositories/evaluation-grading.repository";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export interface GradingQueueFilterInput {
  readonly evaluationId?: string;
  readonly groupId?: string;
  readonly studentId?: string;
}

export interface GetGradingQueueInput extends GradingQueueFilterInput {
  readonly page: number;
  readonly limit: number;
}

@Injectable()
export class GetGradingQueueUseCase {
  public constructor(
    @Inject(EVALUATION_GRADING_REPOSITORY_TOKEN)
    private readonly _gradingRepository: IEvaluationGradingRepository,
    private readonly _lazyCloser: GradingQueueLazyCloser,
    private readonly _access: EvaluationGradingAccess,
  ) {}

  public async execute(input: GetGradingQueueInput, actor: EvaluationActor): Promise<Paginated<GradingQueueItemView>> {
    const scope: EvaluationAssignmentScope | undefined = await this._access.scopeFor(actor);
    const filter: GradingAttemptFilter = { evaluationId: input.evaluationId, groupId: input.groupId, studentId: input.studentId, scope };

    await this._lazyCloser.closeExpired(filter, new Date());

    return await this._gradingRepository.getQueue({ ...filter, page: input.page, limit: input.limit });
  }
}
