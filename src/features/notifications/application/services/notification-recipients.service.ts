/*
 * Funcionalidad: Resolución de destinatarios de notificaciones
 * Descripción: Traduce el titular de una reserva, un grupo o la reserva activa del ventilador en los identificadores de usuario a notificar, a través de GroupsFacade y ReservationsFacade
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type CatalogReservationHolder } from "@/common/domain/events/domain-event-catalog";
import { type GroupMemberSummary, GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";

export interface ActiveReservationRecipients {
  readonly reservationId: string;
  readonly userIds: string[];
}

@Injectable()
export class NotificationRecipientsService {
  public constructor(
    private readonly _groupsFacade: GroupsFacade,
    private readonly _reservationsFacade: ReservationsFacade,
  ) {}

  public async forReservationHolder(holder: CatalogReservationHolder): Promise<string[]> {
    if (holder.type === "USER") {
      return holder.userId !== undefined ? [holder.userId] : [];
    }

    return holder.groupId !== undefined ? await this.forGroup(holder.groupId) : [];
  }

  public async forGroup(groupId: string): Promise<string[]> {
    const members: GroupMemberSummary[] = await this._groupsFacade.getGroupMembers(groupId);

    return members.map((member: GroupMemberSummary): string => member.userId);
  }

  public async forActiveReservation(at: Date): Promise<ActiveReservationRecipients | undefined> {
    const active: ActiveReservationSummary | undefined = await this._reservationsFacade.getActiveReservation(at);

    if (!active) {
      return undefined;
    }

    return { reservationId: active.id, userIds: await this._reservationsFacade.listHolderUserIds(active) };
  }
}
