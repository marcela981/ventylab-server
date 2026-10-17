/*
 * Funcionalidad: Caso de uso GetGradingQueueCountUseCase
 * Descripción: Cuenta los intentos PENDING_REVIEW de la cola de revisión con el mismo alcance (grupos STUDENT creados o supervisados por el profesor, intentos heredados de evaluaciones que creó; administrador: todos) y los mismos filtros (evaluación, grupo y estudiante) que la cola, tras el mismo cierre perezoso de intentos vencidos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EvaluationGradingAccess } from "@/features/evaluation/application/services/evaluation-grading-access";
import { GradingQueueLazyCloser } from "@/features/evaluation/application/services/grading-queue-lazy-closer";
import { type GradingQueueFilterInput } from "@/features/evaluation/application/use-cases/get-grading-queue.usecase";
import { type EvaluationAssignmentScope } from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import {
  EVALUATION_GRADING_REPOSITORY_TOKEN,
  type GradingAttemptFilter,
  type IEvaluationGradingRepository,
} from "@/features/evaluation/domain/repositories/evaluation-grading.repository";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

@Injectable()
export class GetGradingQueueCountUseCase {
  public constructor(
    @Inject(EVALUATION_GRADING_REPOSITORY_TOKEN)
    private readonly _gradingRepository: IEvaluationGradingRepository,
    private readonly _lazyCloser: GradingQueueLazyCloser,
    private readonly _access: EvaluationGradingAccess,
  ) {}

  public async execute(input: GradingQueueFilterInput, actor: EvaluationActor): Promise<number> {
    const scope: EvaluationAssignmentScope | undefined = await this._access.scopeFor(actor);
    const filter: GradingAttemptFilter = { evaluationId: input.evaluationId, groupId: input.groupId, studentId: input.studentId, scope };

    await this._lazyCloser.closeExpired(filter, new Date());

    return await this._gradingRepository.countQueue(filter);
  }
}
