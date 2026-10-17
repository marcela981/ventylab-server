/*
 * Funcionalidad: Caso de uso GetReservationsCalendarUseCase
 * Descripción: Lista las reservas que se solapan con un rango (máximo 31 días), opcionalmente solo las del grupo titular indicado si quien consulta puede verlo (ADMIN cualquiera, profesor los grupos que gestiona o supervisa, estudiante los suyos; 403 en otro caso), enriquecidas con titulares y creadores, junto con quien consulta para la presentación por rol
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ReservationViewsResult } from "@/features/reservations/application/results/reservation-views.result";
import { ReservationAccessService } from "@/features/reservations/application/services/reservation-access.service";
import { ReservationViewsService } from "@/features/reservations/application/services/reservation-views.service";
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { type ReservationView, type ReservationViewer } from "@/features/reservations/domain/read-models/reservation.read-model";
import { type IReservationsRepository, RESERVATIONS_REPOSITORY_TOKEN } from "@/features/reservations/domain/repositories/reservations.repository";
import { InvalidReservationRangeError, ReservationGroupFilterForbiddenError } from "@/features/reservations/domain/reservations.errors";
import { canFilterCalendarByGroup, type ReservationActor, toReservationPartyRole } from "@/features/reservations/domain/services/reservation-access-policy";

export const MAX_CALENDAR_RANGE_DAYS: number = 31;

const MS_PER_DAY: number = 86_400_000;

export interface GetReservationsCalendarQuery {
  readonly from: Date;
  readonly to: Date;
  readonly actorId: string;
  readonly actorRole: string;
  readonly groupId?: string;
}

/**
 * @throws {InvalidReservationRangeError} If the range is empty, inverted or longer than the maximum
 * @throws {ReservationGroupFilterForbiddenError} If the requester may not list the reservations of the requested group
 */
@Injectable()
export class GetReservationsCalendarUseCase {
  public constructor(
    @Inject(RESERVATIONS_REPOSITORY_TOKEN)
    private readonly _reservationsRepository: IReservationsRepository,
    private readonly _accessService: ReservationAccessService,
    private readonly _viewsService: ReservationViewsService,
  ) {}

  public async execute(query: GetReservationsCalendarQuery): Promise<ReservationViewsResult> {
    const rangeMs: number = query.to.getTime() - query.from.getTime();

    if (Number.isNaN(rangeMs) || rangeMs <= 0 || rangeMs > MAX_CALENDAR_RANGE_DAYS * MS_PER_DAY) {
      throw new InvalidReservationRangeError(MAX_CALENDAR_RANGE_DAYS);
    }

    const actor: ReservationActor = { userId: query.actorId, role: toReservationPartyRole(query.actorRole) };

    if (query.groupId !== undefined && !canFilterCalendarByGroup(actor, await this._accessService.resolveCalendarGroupFacts(actor, query.groupId))) {
      throw new ReservationGroupFilterForbiddenError();
    }

    const reservations: Reservation[] = await this._reservationsRepository.getInRange({ from: query.from, to: query.to, groupId: query.groupId });

    const [views, viewer]: [ReservationView[], ReservationViewer] = await Promise.all([
      this._viewsService.toViews(reservations),
      this._accessService.resolveViewer(actor),
    ]);

    return { views, viewer };
  }
}
