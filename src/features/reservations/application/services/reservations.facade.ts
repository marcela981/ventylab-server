/*
 * Funcionalidad: Fachada pública de reservas
 * Descripción: API que ReservationsModule exporta para otras features (simulación heredada, telemetría y comandos del ventilador): reserva activa en un instante, titularidad, usuarios titulares, estadísticas de uso y los adaptadores heredados de reserva inmediata y liberación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { ReserveNowCommand } from "@/features/reservations/application/commands/reserve-now.command";
import { type ActiveReservationSummary, toActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { type ReleasedReservationResult } from "@/features/reservations/application/results/released-reservation.result";
import { type ReservationUsageStats } from "@/features/reservations/application/results/reservation-usage-stats.result";
import { type ReserveNowResult } from "@/features/reservations/application/results/reserve-now.result";
import { ReservationAccessService } from "@/features/reservations/application/services/reservation-access.service";
import { ReleaseActiveReservationUseCase } from "@/features/reservations/application/use-cases/release-active-reservation.usecase";
import { ReserveNowUseCase } from "@/features/reservations/application/use-cases/reserve-now.usecase";
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { type IReservationsRepository, RESERVATIONS_REPOSITORY_TOKEN } from "@/features/reservations/domain/repositories/reservations.repository";
import { type ReservationHolderSnapshot, type ReservationHolderTypeValue } from "@/features/reservations/domain/value-objects/reservation-holder";
import { CANCELLED_RESERVATION_STATUS, type ReservationStatusValue } from "@/features/reservations/domain/value-objects/reservation-status";

const MS_PER_MINUTE: number = 60_000;

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
