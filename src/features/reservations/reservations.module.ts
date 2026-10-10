/*
 * Funcionalidad: Módulo de reservas
 * Descripción: Registra la feature de reservas del ventilador (controlador /api/reservations, casos de uso, servicios de acceso y vistas, repositorio Prisma, reloj, notificador por WebSocket, manejadores de eventos y ajustes leídos de la configuración) y exporta ReservationsFacade
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { GroupsModule } from "@/features/groups/groups.module";
import { RESERVATION_CLOCK_TOKEN } from "@/features/reservations/application/ports/reservation-clock.interface";
import { RESERVATION_NOTIFIER_TOKEN } from "@/features/reservations/application/ports/reservation-notifier.interface";
import { ReservationAccessService } from "@/features/reservations/application/services/reservation-access.service";
import { ReservationViewsService } from "@/features/reservations/application/services/reservation-views.service";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { RESERVATION_SETTINGS_TOKEN, type ReservationSettings } from "@/features/reservations/application/tokens/reservation-settings.token";
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

function createReservationSettings(configService: ConfigService<EnvironmentVariables, true>): ReservationSettings {
  return {
    maxDurationMinutes: configService.get("RESERVATION_MAX_DURATION_MINUTES", { infer: true }),
    slotMinutes: configService.get("RESERVATION_SLOT_MINUTES", { infer: true }),
    maxAdvanceDays: configService.get("RESERVATION_MAX_ADVANCE_DAYS", { infer: true }),
    maxUpcomingPerStudent: configService.get("RESERVATION_MAX_FUTURE_PER_STUDENT", { infer: true }),
    maxUpcomingPerGroup: configService.get("RESERVATION_MAX_FUTURE_PER_GROUP", { infer: true }),
    deviceId: configService.get("VENTILATOR_DEVICE_ID", { infer: true }),
  };
}

@Module({
  imports: [UsersModule, GroupsModule],
  controllers: [ReservationsController],
  providers: [
    { provide: RESERVATION_SETTINGS_TOKEN, useFactory: createReservationSettings, inject: [ConfigService] },
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
