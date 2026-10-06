/*
 * Funcionalidad: Alcance de revisión de la retroalimentación de calificación
 * Descripción: Decide si un actor puede leer o regenerar la retroalimentación de un intento: ADMIN siempre; un docente si gestiona el grupo de la asignación del intento (GroupsFacade.canManageGroup) o, para intentos migrados sin asignación, si es el autor de la evaluación; en otro caso GradeFeedbackForbiddenError
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type EvaluationAssignment } from "@/features/evaluation/domain/entities/evaluation-assignment.entity";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { GradeFeedbackForbiddenError } from "@/features/evaluation/domain/evaluation.errors";
import {
  EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN,
  type IEvaluationAssignmentsRepository,
} from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import { EVALUATIONS_REPOSITORY_TOKEN, type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";
import { ADMIN_EVALUATION_ACTOR_ROLE, type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";
import { GroupsFacade } from "@/features/groups/application/services/groups.facade";

@Injectable()
export class GradeFeedbackAccess {
  public constructor(
    private readonly _groupsFacade: GroupsFacade,
    @Inject(EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN)
    private readonly _assignmentsRepository: IEvaluationAssignmentsRepository,
    @Inject(EVALUATIONS_REPOSITORY_TOKEN)
    private readonly _evaluationsRepository: IEvaluationsRepository,
  ) {}

  public async assertCanReview(actor: EvaluationActor, attempt: StudentEvaluationAttempt): Promise<void> {
    if (actor.role === ADMIN_EVALUATION_ACTOR_ROLE) {
      return;
    }

    if (!(await this._canReview(actor, attempt))) {
      throw new GradeFeedbackForbiddenError();
    }
  }

  private async _canReview(actor: EvaluationActor, attempt: StudentEvaluationAttempt): Promise<boolean> {
    if (attempt.assignmentId !== undefined) {
      const assignment: EvaluationAssignment | undefined = await this._assignmentsRepository.getById(attempt.assignmentId);

      return assignment !== undefined && (await this._groupsFacade.canManageGroup({ id: actor.id, role: actor.role }, assignment.groupId));
    }

    const evaluation: Evaluation | undefined = await this._evaluationsRepository.getById(attempt.evaluationId);

    return evaluation?.createdById === actor.id;
  }
}
