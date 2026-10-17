/*
 * Funcionalidad: Servicio AnalyticsScopeService
 * Descripción: Decide el alcance de la analítica docente con GroupsFacade y EvaluationFacade: ADMIN ve todo; un profesor solo los grupos STUDENT que creó o supervisa (una consulta), los usuarios con rol STUDENT miembros de esos grupos y las evaluaciones asignadas a alguno de ellos o, si no tienen asignaciones, creadas por él (fuera de alcance responde 403, grupo o evaluación inexistentes 404); devuelve el alcance de intentos del profesor (asignaciones de sus grupos gestionados o intentos sin asignación de evaluaciones que creó) el alcance de una evaluación acotado a un grupo (solo intentos de las asignaciones de ese grupo; el grupo debe existir y, para un profesor, ser gestionable) y la clave de alcance que separa las entradas de caché por solicitante y grupos
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { AnalyticsEvaluationNotFoundError, AnalyticsGroupNotFoundError, AnalyticsScopeForbiddenError } from "@/features/analytics/domain/analytics.errors";
import { EvaluationFacade } from "@/features/evaluation/application/services/evaluation.facade";
import { type EvaluationAttemptScope, type EvaluationReferenceView } from "@/features/evaluation/domain/repositories/evaluation-analytics.repository";
import { GroupsFacade, type GroupSummary } from "@/features/groups/application/services/groups.facade";

export const ADMIN_ANALYTICS_ROLE: string = "ADMIN";

export interface AnalyticsActor {
  readonly id: string;
  readonly role: string;
}

export interface ScopedGroup {
  readonly group: GroupSummary;
  readonly attemptScope?: EvaluationAttemptScope;
}

export interface ScopedEvaluation {
  readonly evaluation: EvaluationReferenceView;
  readonly attemptScope?: EvaluationAttemptScope;
}

@Injectable()
export class AnalyticsScopeService {
  public constructor(
    private readonly _groupsFacade: GroupsFacade,
    private readonly _evaluationFacade: EvaluationFacade,
  ) {}

  public scopeKey(actor: AnalyticsActor, attemptScope?: EvaluationAttemptScope): string {
    if (actor.role === ADMIN_ANALYTICS_ROLE) {
      return "admin";
    }

    return `user:${actor.id}:${[...(attemptScope?.groupIds ?? [])].sort().join(",")}`;
  }

  public async assertGroupInScope(actor: AnalyticsActor, groupId: string): Promise<ScopedGroup> {
    const group: GroupSummary | undefined = await this._groupsFacade.getGroupSummary(groupId);

    if (!group) {
      throw new AnalyticsGroupNotFoundError();
    }

    if (actor.role === ADMIN_ANALYTICS_ROLE) {
      return { group };
    }

    const groupIds: string[] = await this._groupsFacade.getManageableStudentGroupIds(actor);

    if (!groupIds.includes(group.id)) {
      throw new AnalyticsScopeForbiddenError();
    }

    return { group, attemptScope: { teacherId: actor.id, groupIds } };
  }

  public async assertStudentInScope(actor: AnalyticsActor, userId: string): Promise<EvaluationAttemptScope | undefined> {
    if (actor.role === ADMIN_ANALYTICS_ROLE) {
      return undefined;
    }

    const groupIds: string[] = await this._groupsFacade.getManageableStudentGroupIds(actor);

    if (groupIds.length === 0 || !(await this._groupsFacade.isStudentMemberOfAny(userId, groupIds))) {
      throw new AnalyticsScopeForbiddenError();
    }

    return { teacherId: actor.id, groupIds };
  }

  public async assertEvaluationInScope(actor: AnalyticsActor, evaluationId: string): Promise<ScopedEvaluation> {
    const evaluation: EvaluationReferenceView | undefined = await this._evaluationFacade.getEvaluationReference(evaluationId);

    if (!evaluation) {
      throw new AnalyticsEvaluationNotFoundError();
    }

    if (actor.role === ADMIN_ANALYTICS_ROLE) {
      return { evaluation };
    }

    // Same rule as grading: an evaluation without assignments (legacy) belongs to its creator
    if (evaluation.assignedGroupIds.length === 0) {
      if (evaluation.createdById !== actor.id) {
        throw new AnalyticsScopeForbiddenError();
      }

      return { evaluation, attemptScope: { teacherId: actor.id, groupIds: [] } };
    }

    const groupIds: string[] = await this._groupsFacade.getManageableStudentGroupIds(actor, evaluation.assignedGroupIds);

    if (groupIds.length === 0) {
      throw new AnalyticsScopeForbiddenError();
    }

    return { evaluation, attemptScope: { teacherId: actor.id, groupIds } };
  }

  public async assertEvaluationGroupInScope(actor: AnalyticsActor, evaluationId: string, groupId: string): Promise<ScopedEvaluation> {
    const { evaluation }: ScopedEvaluation = await this.assertEvaluationInScope(actor, evaluationId);
    const group: GroupSummary | undefined = await this._groupsFacade.getGroupSummary(groupId);

    if (!group) {
      throw new AnalyticsGroupNotFoundError();
    }

    if (actor.role !== ADMIN_ANALYTICS_ROLE && !(await this._groupsFacade.getManageableStudentGroupIds(actor, [group.id])).includes(group.id)) {
      throw new AnalyticsScopeForbiddenError();
    }

    return { evaluation, attemptScope: { teacherId: actor.id, groupIds: [group.id], assignedOnly: true } };
  }
}
