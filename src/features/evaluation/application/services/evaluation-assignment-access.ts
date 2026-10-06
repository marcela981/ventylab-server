/*
 * Funcionalidad: Alcance de asignaciones de evaluación
 * Descripción: Traduce el alcance de gestión de grupos de GroupsFacade para las asignaciones: ADMIN gestiona cualquier grupo; TEACHER solo los grupos que GroupsFacade.canManageGroup acepta (403 todo-o-nada); resuelve el alcance de lectura de un profesor (grupos STUDENT creados o supervisados) y el grupo STUDENT activo de un estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { EvaluationAssignmentForbiddenError } from "@/features/evaluation/domain/evaluation.errors";
import { type EvaluationAssignmentScope } from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import { ADMIN_EVALUATION_ACTOR_ROLE, type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";
import { GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { type StudentGroupSummaryView } from "@/features/groups/domain/read-models/group.read-model";

@Injectable()
export class EvaluationAssignmentAccess {
  public constructor(private readonly _groupsFacade: GroupsFacade) {}

  public async assertCanManageGroups(actor: EvaluationActor, groupIds: ReadonlyArray<string>): Promise<void> {
    if (actor.role === ADMIN_EVALUATION_ACTOR_ROLE) {
      return;
    }

    for (const groupId of new Set(groupIds)) {
      const allowed: boolean = await this._groupsFacade.canManageGroup({ id: actor.id, role: actor.role }, groupId);

      if (!allowed) {
        throw new EvaluationAssignmentForbiddenError();
      }
    }
  }

  public async scopeFor(actor: EvaluationActor): Promise<EvaluationAssignmentScope | undefined> {
    if (actor.role === ADMIN_EVALUATION_ACTOR_ROLE) {
      return undefined;
    }

    const supervisedGroupIds: string[] = await this._groupsFacade.getSupervisedStudentGroupIds(actor.id);

    return { teacherId: actor.id, supervisedGroupIds };
  }

  public async studentGroupIdOf(userId: string): Promise<string | undefined> {
    const group: StudentGroupSummaryView | undefined = await this._groupsFacade.getStudentGroupOfUser(userId);

    return group?.id;
  }
}
