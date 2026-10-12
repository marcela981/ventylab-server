/*
 * Funcionalidad: Módulo de reservas
 * Descripción: Registra la feature de reservas del ventilador (controlador /api/reservations, casos de uso, servicios de acceso y vistas, repositorio Prisma, reloj, manejadores de eventos (incluido el aviso reservation:preempted por WebSocket); los ajustes RESERVATION_SETTINGS_TOKEN los enlaza la raíz de composición) y exporta ReservationsFacade
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { GroupsModule } from "@/features/groups/groups.module";
import { RESERVATION_CLOCK_TOKEN } from "@/features/reservations/application/ports/reservation-clock.interface";
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
import { ReservationsController } from "@/features/reservations/presentation/controllers/reservations.controller";
import { UsersModule } from "@/features/users/users.module";

@Module({
  imports: [UsersModule, GroupsModule],
  controllers: [ReservationsController],
  providers: [
    { provide: RESERVATIONS_REPOSITORY_TOKEN, useClass: ReservationsPrismaRepository },
    { provide: RESERVATION_CLOCK_TOKEN, useClass: SystemReservationClock },
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
