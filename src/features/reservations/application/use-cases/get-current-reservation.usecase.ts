/*
 * Funcionalidad: Caso de uso GetCurrentReservationUseCase
 * Descripción: Devuelve la reserva activa en este instante (programada y dentro de su ventana) enriquecida, si quien consulta puede controlar el ventilador (titular, miembro del grupo titular, docente o administrador), la relación de quien consulta con ella (titular, líder o miembro del grupo titular, creador o ninguna) y quien consulta
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type IReservationClock, RESERVATION_CLOCK_TOKEN } from "@/features/reservations/application/ports/reservation-clock.interface";
import { type CurrentReservationResult } from "@/features/reservations/application/results/current-reservation.result";
import { ReservationAccessService } from "@/features/reservations/application/services/reservation-access.service";
import { ReservationViewsService } from "@/features/reservations/application/services/reservation-views.service";
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { type ReservationRelation, type ReservationView, type ReservationViewer } from "@/features/reservations/domain/read-models/reservation.read-model";
import { type IReservationsRepository, RESERVATIONS_REPOSITORY_TOKEN } from "@/features/reservations/domain/repositories/reservations.repository";
import { type ReservationActor, toReservationPartyRole } from "@/features/reservations/domain/services/reservation-access-policy";

@Injectable()
export class GetCurrentReservationUseCase {
  public constructor(
    @Inject(RESERVATIONS_REPOSITORY_TOKEN)
    private readonly _reservationsRepository: IReservationsRepository,
    @Inject(RESERVATION_CLOCK_TOKEN)
    private readonly _clock: IReservationClock,
    private readonly _accessService: ReservationAccessService,
    private readonly _viewsService: ReservationViewsService,
  ) {}

  public async execute(actorId: string, actorRole: string): Promise<CurrentReservationResult> {
    const actor: ReservationActor = { userId: actorId, role: toReservationPartyRole(actorRole) };

    const [active, viewer]: [Reservation | undefined, ReservationViewer] = await Promise.all([
      this._reservationsRepository.getActiveAt(this._clock.now()),
      this._accessService.resolveViewer(actor),
    ]);

    if (!active) {
      return { canControl: false, relation: "none", viewer };
    }

    const [view, canControl, relation]: [ReservationView, boolean, ReservationRelation] = await Promise.all([
      this._viewsService.toView(active),
      this._accessService.canControl(actor, active.holder.toSnapshot()),
      this._accessService.resolveRelation(actor.userId, active),
    ]);

    return { view, canControl, relation, viewer };
  }
}
