/*
 * Funcionalidad: Servicio de acceso a reservas
 * Descripción: Resuelve con GroupsFacade los hechos de grupo que necesita la política (liderazgo, supervisión, tipo de grupo), los hechos para filtrar el calendario por grupo (gestión o supervisión de un profesor, pertenencia de un estudiante), el grupo de estudiantes de quien consulta, si un usuario es titular de una reserva (usuario titular o miembro del grupo titular), los usuarios a avisar y la relación de quien consulta con una reserva
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type GroupMemberSummary, type GroupSummary, GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { type StudentGroupSummaryView } from "@/features/groups/domain/read-models/group.read-model";
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { type ReservationRelation, type ReservationViewer } from "@/features/reservations/domain/read-models/reservation.read-model";
import {
  ADMIN_ACTOR_ROLE,
  type CalendarGroupFacts,
  type HolderGroupFacts,
  type ReservationActor,
  resolveReservationRelation,
  TEACHER_ACTOR_ROLE,
} from "@/features/reservations/domain/services/reservation-access-policy";
import { type ReservationHolderSnapshot } from "@/features/reservations/domain/value-objects/reservation-holder";

export interface ResolvedGroupFacts extends HolderGroupFacts {
  readonly exists: boolean;
}

const NO_GROUP_FACTS: ResolvedGroupFacts = { exists: false, leadsGroup: false, supervisesGroup: false, isStudentGroup: false };

@Injectable()
export class ReservationAccessService {
  public constructor(private readonly _groupsFacade: GroupsFacade) {}

  public async resolveGroupFacts(actor: ReservationActor, groupId: string | undefined): Promise<ResolvedGroupFacts> {
    if (groupId === undefined) {
      return NO_GROUP_FACTS;
    }

    const [summary, leadsGroup, supervisedGroupIds]: [GroupSummary | undefined, boolean, string[]] = await Promise.all([
      this._groupsFacade.getGroupSummary(groupId),
      this._groupsFacade.isGroupLeader(actor.userId, groupId),
      actor.role === TEACHER_ACTOR_ROLE ? this._groupsFacade.getSupervisedStudentGroupIds(actor.userId) : Promise.resolve([]),
    ]);

    if (!summary) {
      return NO_GROUP_FACTS;
    }

    return {
      exists: true,
      leadsGroup,
      supervisesGroup: supervisedGroupIds.includes(groupId),
      isStudentGroup: summary.type === "STUDENT" && summary.isActive,
    };
  }

  public async resolveCalendarGroupFacts(actor: ReservationActor, groupId: string): Promise<CalendarGroupFacts> {
    if (actor.role === ADMIN_ACTOR_ROLE) {
      return { managesGroup: true, isMember: false };
    }

    if (actor.role === TEACHER_ACTOR_ROLE) {
      return { managesGroup: await this._groupsFacade.canManageGroup({ id: actor.userId, role: actor.role }, groupId), isMember: false };
    }

    return { managesGroup: false, isMember: await this._groupsFacade.isMemberOf(actor.userId, groupId) };
  }

  public async isHolder(userId: string, holder: ReservationHolderSnapshot): Promise<boolean> {
    if (holder.userId !== undefined) {
      return holder.userId === userId;
    }

    return holder.groupId !== undefined && (await this._groupsFacade.isMemberOf(userId, holder.groupId));
  }

  public async resolveRelation(userId: string, reservation: Reservation): Promise<ReservationRelation> {
    const groupId: string | undefined = reservation.holder.groupId;

    if (groupId === undefined || reservation.holder.userId === userId) {
      return resolveReservationRelation(userId, reservation, { leadsGroup: false, isMember: false });
    }

    const [leadsGroup, isMember]: [boolean, boolean] = await Promise.all([this._groupsFacade.isGroupLeader(userId, groupId), this._groupsFacade.isMemberOf(userId, groupId)]);

    return resolveReservationRelation(userId, reservation, { leadsGroup, isMember });
  }

  public async resolveViewer(actor: ReservationActor): Promise<ReservationViewer> {
    const group: StudentGroupSummaryView | undefined = await this._groupsFacade.getStudentGroupOfUser(actor.userId);

    return { userId: actor.userId, role: actor.role, groupIds: group ? [group.id] : [] };
  }

  public async listHolderUserIds(holder: ReservationHolderSnapshot): Promise<string[]> {
    if (holder.userId !== undefined) {
      return [holder.userId];
    }

    if (holder.groupId === undefined) {
      return [];
    }

    const members: GroupMemberSummary[] = await this._groupsFacade.getGroupMembers(holder.groupId);

    return members.map((member: GroupMemberSummary): string => member.userId);
  }
}
