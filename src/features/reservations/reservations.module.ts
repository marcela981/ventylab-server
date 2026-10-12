/*
 * Funcionalidad: Módulo de reservas
 * Descripción: Registra la feature de reservas del ventilador (controlador /api/reservations, casos de uso, servicios de acceso y vistas, repositorio Prisma, reloj, notificador por WebSocket, manejadores de eventos; los ajustes RESERVATION_SETTINGS_TOKEN los enlaza la raíz de composición) y exporta ReservationsFacade
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { GroupsModule } from "@/features/groups/groups.module";
import { RESERVATION_CLOCK_TOKEN } from "@/features/reservations/application/ports/reservation-clock.interface";
import { RESERVATION_NOTIFIER_TOKEN } from "@/features/reservations/application/ports/reservation-notifier.interface";
import { ReservationAccessService } from "@/features/reservations/application/services/reservation-access.service";
import { ReservationViewsService } from "@/features/reservations/application/services/reservation-views.service";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { CancelReservationUseCase } from "@/features/reservations/application/use-cases/cancel-reservation.usecase";
import { CreateReservationUseCase } from "@/features/reservations/application/use-cases/create-reservation.usecase";
import { GetCurrentReservationUseCase } from "@/features/reservations/application/use-cases/get-current-reservation.usecase";
import { GetMyReservationsUseCase } from "@/features/reservations/application/use-cases/get-my-reservations.usecase";
import { GetReservationsCalendarUseCase } from "@/features/reservations/application/use-cases/get-reservations-calendar.usecase";
import { PreemptReservationUseCase } from "@/features/reservations/application/use-cases/preempt-reservation.usecase";
import { ReleaseActiveReservationUseCase } from "@/features/reservations/application/use-cases/release-active-reservation.usecase";
import { ReserveNowUseCase } from "@/features/reservations/application/use-cases/reserve-now.usecase";
import { RESERVATIONS_REPOSITORY_TOKEN } from "@/features/reservations/domain/repositories/reservations.repository";
import { SystemReservationClock } from "@/features/reservations/infrastructure/clock/system-reservation.clock";
import { ReservationsEventsHandlers } from "@/features/reservations/infrastructure/events/reservations-events.handlers";
import { ReservationsPrismaRepository } from "@/features/reservations/infrastructure/persistence/prisma/repositories/reservations-prisma.repository";
import { RealtimeReservationNotifier } from "@/features/reservations/infrastructure/realtime/realtime-reservation.notifier";
import { ReservationsController } from "@/features/reservations/presentation/controllers/reservations.controller";
import { UsersModule } from "@/features/users/users.module";

@Module({
  imports: [UsersModule, GroupsModule],
  controllers: [ReservationsController],
  providers: [
    { provide: RESERVATIONS_REPOSITORY_TOKEN, useClass: ReservationsPrismaRepository },
    { provide: RESERVATION_CLOCK_TOKEN, useClass: SystemReservationClock },
    { provide: RESERVATION_NOTIFIER_TOKEN, useClass: RealtimeReservationNotifier },
    ReservationAccessService,
    ReservationViewsService,
    CreateReservationUseCase,
    CancelReservationUseCase,
    PreemptReservationUseCase,
    GetReservationsCalendarUseCase,
    GetMyReservationsUseCase,
    GetCurrentReservationUseCase,
    ReserveNowUseCase,
    ReleaseActiveReservationUseCase,
    ReservationsEventsHandlers,
    ReservationsFacade,
  ],
  exports: [ReservationsFacade],
})
export class ReservationsModule {}
