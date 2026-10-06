/*
 * Funcionalidad: Caso de uso GetManagedEvaluationAssignmentsUseCase
 * Descripción: Listado paginado de asignaciones para gestores filtrado por grupo, evaluación y estado derivado (calculado en la base con el instante de la consulta); ADMIN ve todas, TEACHER solo grupos STUDENT que creó o supervisa y recibe 403 al filtrar por un grupo que no gestiona
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ListQuery } from "@/common/domain/utils/list-query";
import { type Paginated } from "@/common/domain/utils/paginated";
import { type EvaluationAssignmentResult, withAssignmentState } from "@/features/evaluation/application/results/evaluation-assignment.result";
import { EvaluationAssignmentAccess } from "@/features/evaluation/application/services/evaluation-assignment-access";
import { type EvaluationAssignmentView } from "@/features/evaluation/domain/read-models/evaluation-assignment.read-model";
import {
  EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN,
  type EvaluationAssignmentScope,
  type IEvaluationAssignmentsRepository,
} from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";
import { type EvaluationAssignmentStateValue } from "@/features/evaluation/domain/value-objects/evaluation-assignment-state";

export interface GetManagedEvaluationAssignmentsQuery extends ListQuery {
  groupId?: string;
  evaluationId?: string;
  state?: EvaluationAssignmentStateValue;
}

/**
 * @throws {EvaluationAssignmentForbiddenError} If a teacher filters by a group they do not manage
 */
@Injectable()
export class GetManagedEvaluationAssignmentsUseCase {
  public constructor(
    @Inject(EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN)
    private readonly _assignmentsRepository: IEvaluationAssignmentsRepository,
    private readonly _access: EvaluationAssignmentAccess,
  ) {}

  public async execute(query: GetManagedEvaluationAssignmentsQuery, actor: EvaluationActor): Promise<Paginated<EvaluationAssignmentResult>> {
    if (query.groupId !== undefined) {
      await this._access.assertCanManageGroups(actor, [query.groupId]);
    }

    const scope: EvaluationAssignmentScope | undefined = await this._access.scopeFor(actor);
    const now: Date = new Date();
    const views: Paginated<EvaluationAssignmentView> = await this._assignmentsRepository.getViews({ ...query, now, scope });

    return views.map((view: EvaluationAssignmentView) => withAssignmentState(view, now));
  }
}
