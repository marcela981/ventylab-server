/*
 * Funcionalidad: Fachada pública de reservas
 * Descripción: API que ReservationsModule exporta para otras features (simulación heredada, telemetría y comandos del ventilador): reserva activa en un instante, reserva por identificador, titularidad, liderazgo del grupo titular (vía GroupsFacade), usuarios titulares, estadísticas de uso y los adaptadores heredados de reserva inmediata y liberación; y lecturas para analítica: horas de uso del ventilador por usuario de varios usuarios en una sola consulta, reservas de un usuario en un rango y próximas reservas visibles para un usuario
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { ReserveNowCommand } from "@/features/reservations/application/commands/reserve-now.command";
import { type ActiveReservationSummary, toActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { type ReleasedReservationResult } from "@/features/reservations/application/results/released-reservation.result";
import { type ReservationUsageStats } from "@/features/reservations/application/results/reservation-usage-stats.result";
import { type ReserveNowResult } from "@/features/reservations/application/results/reserve-now.result";
import { ReservationAccessService } from "@/features/reservations/application/services/reservation-access.service";
import { ReleaseActiveReservationUseCase } from "@/features/reservations/application/use-cases/release-active-reservation.usecase";
import { ReserveNowUseCase } from "@/features/reservations/application/use-cases/reserve-now.usecase";
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { type ReservationViewer } from "@/features/reservations/domain/read-models/reservation.read-model";
import {
  type IReservationAnalyticsRepository,
  RESERVATION_ANALYTICS_REPOSITORY_TOKEN,
  type ReservationActivityView,
  type UserHeldReservationView,
} from "@/features/reservations/domain/repositories/reservation-analytics.repository";
import { type IReservationsRepository, RESERVATIONS_REPOSITORY_TOKEN } from "@/features/reservations/domain/repositories/reservations.repository";
import { toReservationPartyRole } from "@/features/reservations/domain/services/reservation-access-policy";
import { reservationUsageMinutes } from "@/features/reservations/domain/services/reservation-usage-time";
import { type ReservationHolderSnapshot, type ReservationHolderTypeValue } from "@/features/reservations/domain/value-objects/reservation-holder";
import {
  CANCELLED_RESERVATION_STATUS,
  type ReservationStatusValue,
  SCHEDULED_RESERVATION_STATUS,
} from "@/features/reservations/domain/value-objects/reservation-status";

const MS_PER_MINUTE: number = 60_000;

const MINUTES_PER_HOUR: number = 60;

export interface UserVentilatorUsage {
  readonly userId: string;
  readonly reservations: number;
  readonly hours: number;
}

export interface UpcomingReservationSummary {
  readonly id: string;
  readonly holderType: ReservationHolderTypeValue;
  readonly groupId?: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly purpose?: string;
}

export interface ReservationUsageRange {
  readonly from: Date;
  readonly to: Date;
}

export interface ReserveNowInput {
  readonly userId: string;
  readonly role: string;
  readonly durationMinutes: number;
  readonly groupId?: string;
  readonly purpose?: string;
}

@Injectable()
export class ReservationsFacade {
  public constructor(
    @Inject(RESERVATIONS_REPOSITORY_TOKEN)
    private readonly _reservationsRepository: IReservationsRepository,
    private readonly _accessService: ReservationAccessService,
    private readonly _reserveNowUseCase: ReserveNowUseCase,
    private readonly _releaseActiveReservationUseCase: ReleaseActiveReservationUseCase,
    private readonly _groupsFacade: GroupsFacade,
    @Inject(RESERVATION_ANALYTICS_REPOSITORY_TOKEN)
    private readonly _analyticsRepository: IReservationAnalyticsRepository,
  ) {}

  public async getActiveReservation(now: Date): Promise<ActiveReservationSummary | undefined> {
    const active: Reservation | undefined = await this._reservationsRepository.getActiveAt(now);

    return active ? toActiveReservationSummary(active) : undefined;
  }

  public async isHolder(userId: string, reservation: ActiveReservationSummary): Promise<boolean> {
    return await this._accessService.isHolder(userId, ReservationsFacade._toHolder(reservation));
  }

  public async listHolderUserIds(reservation: ActiveReservationSummary): Promise<string[]> {
    return await this._accessService.listHolderUserIds(ReservationsFacade._toHolder(reservation));
  }

  public async getReservationById(id: string): Promise<ActiveReservationSummary | undefined> {
    const reservation: Reservation | undefined = await this._reservationsRepository.getById(id);

    return reservation ? toActiveReservationSummary(reservation) : undefined;
  }

  public async isGroupLeaderOfHolder(userId: string, reservation: ActiveReservationSummary): Promise<boolean> {
    return reservation.groupId !== undefined && (await this._groupsFacade.isGroupLeader(userId, reservation.groupId));
  }

  public async getUsageStats(range: ReservationUsageRange, groupId?: string): Promise<ReservationUsageStats> {
    const reservations: Reservation[] = await this._reservationsRepository.getInRange({ from: range.from, to: range.to, groupId });

    const byStatus: Record<ReservationStatusValue, number> = { SCHEDULED: 0, CANCELLED: 0, PREEMPTED: 0, COMPLETED: 0 };
    const byHolderType: Record<ReservationHolderTypeValue, number> = { USER: 0, GROUP: 0 };
    let totalMinutes: number = 0;

    for (const reservation of reservations) {
      byStatus[reservation.status] += 1;
      byHolderType[reservation.holder.type] += 1;

      if (reservation.status === CANCELLED_RESERVATION_STATUS) {
        continue;
      }

      const start: number = Math.max(reservation.startsAt.getTime(), range.from.getTime());
      const end: number = Math.min(reservation.endsAt.getTime(), range.to.getTime());

      totalMinutes += Math.max(0, end - start) / MS_PER_MINUTE;
    }

    return { count: reservations.length, totalMinutes, byStatus, byHolderType };
  }

  public async getVentilatorUsageForUsers(userIds: readonly string[], now: Date): Promise<UserVentilatorUsage[]> {
    const rows: UserHeldReservationView[] = await this._analyticsRepository.getUserHeldReservations(userIds, now);
    const usage: Map<string, { reservations: number; minutes: number }> = new Map<string, { reservations: number; minutes: number }>();

    for (const row of rows) {
      const current: { reservations: number; minutes: number } = usage.get(row.userId) ?? { reservations: 0, minutes: 0 };
      const minutes: number = reservationUsageMinutes(row, now);

      usage.set(row.userId, { reservations: current.reservations + (minutes > 0 ? 1 : 0), minutes: current.minutes + minutes });
    }

    return [...usage.entries()].map(
      ([userId, totals]: [string, { reservations: number; minutes: number }]): UserVentilatorUsage => ({
        userId,
        reservations: totals.reservations,
        hours: totals.minutes / MINUTES_PER_HOUR,
      }),
    );
  }

  public async getReservationActivityOfUser(userId: string, range: ReservationUsageRange, limit: number): Promise<ReservationActivityView[]> {
    return await this._analyticsRepository.getReservationActivityOfUser(userId, range.from, range.to, limit);
  }

  public async getUpcomingReservationsOfUser(userId: string, role: string, now: Date, limit: number): Promise<UpcomingReservationSummary[]> {
    const viewer: ReservationViewer = await this._accessService.resolveViewer({ userId, role: toReservationPartyRole(role) });
    const reservations: Reservation[] = await this._reservationsRepository.getOfUser({ userId, groupIds: [...viewer.groupIds], endsAfter: now });

    return reservations
      .filter((reservation: Reservation) => reservation.status === SCHEDULED_RESERVATION_STATUS)
      .slice(0, limit)
      .map(
        (reservation: Reservation): UpcomingReservationSummary => ({
          id: reservation.id,
          holderType: reservation.holder.type,
          groupId: reservation.holder.groupId,
          startsAt: reservation.startsAt,
          endsAt: reservation.endsAt,
          purpose: reservation.purpose,
        }),
      );
  }

  public async reserveNow(input: ReserveNowInput): Promise<ReserveNowResult> {
    return await this._reserveNowUseCase.execute(new ReserveNowCommand({ ...input }));
  }

  public async releaseActive(userId: string, role: string): Promise<ReleasedReservationResult | undefined> {
    return await this._releaseActiveReservationUseCase.execute(userId, role);
  }

  private static _toHolder(reservation: ActiveReservationSummary): ReservationHolderSnapshot {
    return { type: reservation.holderType, userId: reservation.userId, groupId: reservation.groupId };
  }
}
