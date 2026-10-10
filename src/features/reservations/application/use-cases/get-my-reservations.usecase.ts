/*
 * Funcionalidad: Caso de uso GetMyReservationsUseCase
 * Descripción: Lista las reservas vigentes o futuras de quien consulta: las que tiene como usuario titular, las que creó y las de su grupo de estudiantes, enriquecidas y con quien consulta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type IReservationClock, RESERVATION_CLOCK_TOKEN } from "@/features/reservations/application/ports/reservation-clock.interface";
import { type ReservationViewsResult } from "@/features/reservations/application/results/reservation-views.result";
import { ReservationAccessService } from "@/features/reservations/application/services/reservation-access.service";
import { ReservationViewsService } from "@/features/reservations/application/services/reservation-views.service";
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { type ReservationView, type ReservationViewer } from "@/features/reservations/domain/read-models/reservation.read-model";
import { type IReservationsRepository, RESERVATIONS_REPOSITORY_TOKEN } from "@/features/reservations/domain/repositories/reservations.repository";
import { type ReservationActor, toReservationPartyRole } from "@/features/reservations/domain/services/reservation-access-policy";

@Injectable()
export class GetMyReservationsUseCase {
  public constructor(
    @Inject(RESERVATIONS_REPOSITORY_TOKEN)
    private readonly _reservationsRepository: IReservationsRepository,
    @Inject(RESERVATION_CLOCK_TOKEN)
    private readonly _clock: IReservationClock,
    private readonly _accessService: ReservationAccessService,
    private readonly _viewsService: ReservationViewsService,
  ) {}

  public async execute(actorId: string, actorRole: string): Promise<ReservationViewsResult> {
    const actor: ReservationActor = { userId: actorId, role: toReservationPartyRole(actorRole) };
    const viewer: ReservationViewer = await this._accessService.resolveViewer(actor);

    const reservations: Reservation[] = await this._reservationsRepository.getOfUser({
      userId: actorId,
      groupIds: [...viewer.groupIds],
      endsAfter: this._clock.now(),
    });

    const views: ReservationView[] = await this._viewsService.toViews(reservations);

    return { views, viewer };
  }
}
