/*
 * Funcionalidad: Caso de uso GetGradingQueueUseCase
 * Descripción: Cola de revisión del profesor (o administrador): antes de listar cierra de forma perezosa, con el cierre compartido de intentos y un máximo por solicitud, los intentos en curso vencidos (plazo efectivo más 30 s) de las evaluaciones y grupos filtrados en su alcance; luego devuelve paginados los intentos PENDING_REVIEW de ese alcance, del más antiguo al más reciente
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { EvaluationAttemptCloser } from "@/features/evaluation/application/services/evaluation-attempt-closer";
import { EvaluationGradingAccess } from "@/features/evaluation/application/services/evaluation-grading-access";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { type GradingQueueItemView } from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import { type EvaluationAssignmentScope } from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import {
  EVALUATION_GRADING_REPOSITORY_TOKEN,
  type GradingAttemptFilter,
  type IEvaluationGradingRepository,
} from "@/features/evaluation/domain/repositories/evaluation-grading.repository";
import {
  type IStudentEvaluationAttemptsRepository,
  STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN,
} from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";
import { ATTEMPT_SUBMIT_GRACE_MS } from "@/features/evaluation/domain/services/evaluation-attempt-policy";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export const MAX_LAZY_CLOSES_PER_QUEUE_REQUEST: number = 50;

export interface GetGradingQueueInput {
  readonly evaluationId?: string;
  readonly groupId?: string;
  readonly page: number;
  readonly limit: number;
}

@Injectable()
export class GetGradingQueueUseCase {
  public constructor(
    @Inject(EVALUATION_GRADING_REPOSITORY_TOKEN)
    private readonly _gradingRepository: IEvaluationGradingRepository,
    @Inject(STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN)
    private readonly _attemptsRepository: IStudentEvaluationAttemptsRepository,
    private readonly _closer: EvaluationAttemptCloser,
    private readonly _access: EvaluationGradingAccess,
  ) {}

  public async execute(input: GetGradingQueueInput, actor: EvaluationActor): Promise<Paginated<GradingQueueItemView>> {
    const scope: EvaluationAssignmentScope | undefined = await this._access.scopeFor(actor);
    const filter: GradingAttemptFilter = { evaluationId: input.evaluationId, groupId: input.groupId, scope };
    const now: Date = new Date();

    const expiredIds: string[] = await this._gradingRepository.getExpiredInProgressAttemptIds(
      filter,
      new Date(now.getTime() - ATTEMPT_SUBMIT_GRACE_MS),
      MAX_LAZY_CLOSES_PER_QUEUE_REQUEST,
    );

    for (const attemptId of expiredIds) {
      const attempt: StudentEvaluationAttempt | undefined = await this._attemptsRepository.getById(attemptId);

      if (attempt) {
        await this._closer.lazyClose(attempt, now);
      }
    }

    return await this._gradingRepository.getQueue({ ...filter, page: input.page, limit: input.limit });
  }
}
