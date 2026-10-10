/*
 * Funcionalidad: Política de acceso a sesiones de simulación
 * Descripción: Decide con GroupsFacade si un actor puede leer las sesiones de un estudiante: el propio dueño, un administrador, o un docente que gestiona o supervisa el grupo de estudiantes del dueño
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { type StudentGroupSummaryView } from "@/features/groups/domain/read-models/group.read-model";
import { SimulationSessionAccessDeniedError } from "@/features/simulation/domain/simulation.errors";
import { ADMIN_ROLE_VALUE, TEACHER_ROLE_VALUE } from "@/features/users/domain/value-objects/user-role";

export interface SimulationActor {
  readonly id: string;
  readonly role: string;
}

@Injectable()
export class SimulationSessionAccessService {
  public constructor(private readonly _groupsFacade: GroupsFacade) {}

  public async canReadSessionsOf(actor: SimulationActor, ownerId: string): Promise<boolean> {
    if (actor.id === ownerId || actor.role === ADMIN_ROLE_VALUE) {
      return true;
    }

    if (actor.role !== TEACHER_ROLE_VALUE) {
      return false;
    }

    const group: StudentGroupSummaryView | undefined = await this._groupsFacade.getStudentGroupOfUser(ownerId);

    return group !== undefined && (await this._groupsFacade.canManageGroup(actor, group.id));
  }

  public async assertCanReadSessionsOf(actor: SimulationActor, ownerId: string): Promise<void> {
    const allowed: boolean = await this.canReadSessionsOf(actor, ownerId);

    if (!allowed) {
      throw new SimulationSessionAccessDeniedError();
    }
  }
}
