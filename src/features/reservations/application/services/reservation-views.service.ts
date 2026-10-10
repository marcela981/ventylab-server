/*
 * Funcionalidad: Servicio de vistas de reservas
 * Descripción: Enriquece reservas con los usuarios (titular y creador) y grupos titulares a través de UsersFacade y GroupsFacade, en lote y sin duplicar lecturas, y deriva el rol efectivo del titular
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type GroupSummary, GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import {
  type ReservationGroupView,
  type ReservationPartyRole,
  type ReservationUserView,
  type ReservationView,
} from "@/features/reservations/domain/read-models/reservation.read-model";
import { STUDENT_ACTOR_ROLE, TEACHER_ACTOR_ROLE, toReservationPartyRole } from "@/features/reservations/domain/services/reservation-access-policy";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";

interface GroupLookup {
  readonly view: ReservationGroupView;
  readonly role: ReservationPartyRole;
}

@Injectable()
export class ReservationViewsService {
  public constructor(
    private readonly _usersFacade: UsersFacade,
    private readonly _groupsFacade: GroupsFacade,
  ) {}

  public async toView(reservation: Reservation): Promise<ReservationView> {
    const [view]: ReservationView[] = await this.toViews([reservation]);

    return view;
  }

  public async toViews(reservations: readonly Reservation[]): Promise<ReservationView[]> {
    if (reservations.length === 0) {
      return [];
    }

    const userIds: string[] = [
      ...new Set<string>(
        reservations.flatMap((reservation: Reservation): string[] =>
          reservation.holder.userId === undefined ? [reservation.createdById] : [reservation.holder.userId, reservation.createdById],
        ),
      ),
    ];

    const groupIds: string[] = [
      ...new Set<string>(reservations.flatMap((reservation: Reservation): string[] => (reservation.holder.groupId === undefined ? [] : [reservation.holder.groupId]))),
    ];

    const [users, groups]: [UserAccount[], (GroupSummary | undefined)[]] = await Promise.all([
      this._usersFacade.getUsersByIds(userIds),
      Promise.all(groupIds.map((groupId: string): Promise<GroupSummary | undefined> => this._groupsFacade.getGroupSummary(groupId))),
    ]);

    const userMap: Map<string, ReservationUserView> = new Map<string, ReservationUserView>(
      users.map((user: UserAccount): [string, ReservationUserView] => [user.id, { id: user.id, name: user.name, email: user.email, role: toReservationPartyRole(user.role) }]),
    );

    const groupMap: Map<string, GroupLookup> = new Map<string, GroupLookup>(
      groups
        .filter((group: GroupSummary | undefined): group is GroupSummary => group !== undefined)
        .map((group: GroupSummary): [string, GroupLookup] => [
          group.id,
          { view: { id: group.id, name: group.name }, role: group.type === "TEACHER" ? TEACHER_ACTOR_ROLE : STUDENT_ACTOR_ROLE },
        ]),
    );

    return reservations.map((reservation: Reservation): ReservationView => {
      const holderUser: ReservationUserView | undefined = reservation.holder.userId === undefined ? undefined : userMap.get(reservation.holder.userId);
      const group: GroupLookup | undefined = reservation.holder.groupId === undefined ? undefined : groupMap.get(reservation.holder.groupId);

      return {
        reservation,
        holderUser,
        holderGroup: group?.view,
        creator: userMap.get(reservation.createdById),
        holderRole: holderUser?.role ?? group?.role ?? STUDENT_ACTOR_ROLE,
      };
    });
  }
}
