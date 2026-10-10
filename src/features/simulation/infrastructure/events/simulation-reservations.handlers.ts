/*
 * Funcionalidad: Manejadores de reservas en simulación
 * Descripción: Mantiene al día la caché de la reserva activa que leen la retransmisión de telemetría y el envío de comandos: la refresca al crear, cancelar, desplazar o completar cualquier reserva y periódicamente, porque una reserva programada se vuelve activa al llegar su hora sin ningún evento
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Interval } from "@nestjs/schedule";

import {
  ReservationCancelledEvent,
  ReservationCompletedEvent,
  ReservationCreatedEvent,
  ReservationPreemptedEvent,
} from "@/features/reservations/domain/events/reservation.events";
import { ReservationCacheService } from "@/features/simulation/application/services/reservation-cache.service";

const RESERVATION_CACHE_REFRESH_MS: number = 15_000;

@Injectable()
export class SimulationReservationsHandlers {
  public constructor(private readonly _reservationCache: ReservationCacheService) {}

  @OnEvent(ReservationCreatedEvent.name)
  @OnEvent(ReservationCancelledEvent.name)
  @OnEvent(ReservationPreemptedEvent.name)
  @OnEvent(ReservationCompletedEvent.name)
  public handleReservationChanged(): void {
    this._reservationCache.refreshInBackground();
  }

  @Interval(RESERVATION_CACHE_REFRESH_MS)
  public refreshPeriodically(): void {
    this._reservationCache.refreshInBackground();
  }
}
