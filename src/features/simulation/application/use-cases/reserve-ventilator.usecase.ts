/*
 * Funcionalidad: Caso de uso ReserveVentilatorUseCase
 * Descripción: Reserva el ventilador físico en una transacción serializada con pg_advisory_xact_lock por dispositivo (expira vencidas, comprueba la activa, crea la nueva); recupera la reserva del mismo usuario, resuelve el líder desde el grupo y refresca la caché en memoria
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { type Group } from "@/features/groups/domain/entities/group.entity";
import { GroupNotFoundError } from "@/features/groups/domain/groups.errors";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";
import { ReserveVentilatorCommand } from "@/features/simulation/application/commands/reserve-ventilator.command";
import { ReserveVentilatorResult } from "@/features/simulation/application/results/reserve-ventilator.result";
import { ReservationCacheService } from "@/features/simulation/application/services/reservation-cache.service";
import { SIMULATION_SETTINGS_TOKEN, type SimulationSettings } from "@/features/simulation/application/tokens/simulation-settings.token";
import { VentilatorReservation } from "@/features/simulation/domain/entities/ventilator-reservation.entity";
import { type ActiveReservationView } from "@/features/simulation/domain/read-models/active-reservation.read-model";
import {
  type IVentilatorReservationsRepository,
  VENTILATOR_RESERVATIONS_REPOSITORY_TOKEN,
} from "@/features/simulation/domain/repositories/ventilator-reservations.repository";
import { VentilatorAlreadyReservedError } from "@/features/simulation/domain/simulation.errors";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { UserNotFoundError } from "@/features/users/domain/users.errors";
import { UserRole } from "@/features/users/domain/value-objects/user-role";

type ReservationOutcome =
  | { kind: "existing"; existing: ActiveReservationView }
  | { kind: "created"; reservation: VentilatorReservation; events: DomainEvent[] };

/**
 * @throws {GroupNotFoundError} If the given group does not exist
 * @throws {UserNotFoundError} If the leader who should receive the telemetry does not exist
 * @throws {VentilatorAlreadyReservedError} If another user holds the active reservation
 */
@Injectable()
export class ReserveVentilatorUseCase {
  public constructor(
    @Inject(VENTILATOR_RESERVATIONS_REPOSITORY_TOKEN)
    private readonly _reservationsRepository: IVentilatorReservationsRepository,
    @Inject(GROUPS_REPOSITORY_TOKEN)
    private readonly _groupsRepository: IGroupsRepository,
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
    @Inject(SIMULATION_SETTINGS_TOKEN)
    private readonly _settings: SimulationSettings,
    private readonly _reservationCache: ReservationCacheService,
  ) {}

  public async execute(command: ReserveVentilatorCommand): Promise<ReserveVentilatorResult> {
    const userRole: UserRole = UserRole.create(command.userRole);
    const leaderId: string | undefined = await this._resolveLeaderId(command);
    const holder: User | undefined = await this._usersRepository.getById(command.userId);
    const holderName: string | undefined = holder ? holder.name ?? holder.email : undefined;

    const outcome: ReservationOutcome = await this._transactionManager.run(
      async (transaction: unknown): Promise<ReservationOutcome> => {
        await this._reservationsRepository.lockDevice(this._settings.deviceId, transaction);
        await this._reservationsRepository.expireOverdue(new Date(), transaction);

        const existing: ActiveReservationView | undefined = await this._reservationsRepository.getActive(transaction);

        if (existing) {
          return { kind: "existing", existing };
        }

        const reservation: VentilatorReservation = VentilatorReservation.create({
          userId: command.userId,
          userRole: userRole.value,
          deviceId: this._settings.deviceId,
          groupId: command.groupId,
          leaderId,
          durationMinutes: command.durationMinutes,
          purpose: command.purpose,
          holderName,
        });

        await this._reservationsRepository.save(reservation, transaction);

        return { kind: "created", reservation, events: reservation.getEvents() };
      },
    );

    if (outcome.kind === "existing") {
      const existing: VentilatorReservation = outcome.existing.reservation;

      if (existing.userId !== command.userId) {
        throw new VentilatorAlreadyReservedError();
      }

      return new ReserveVentilatorResult({
        reservationId: existing.id,
        startTime: existing.startTime.getTime(),
        endTime: existing.endTime.getTime(),
        recovered: true,
      });
    }

    this._eventBus.publish(outcome.events);

    await this._reservationCache.refresh();

    return new ReserveVentilatorResult({
      reservationId: outcome.reservation.id,
      startTime: outcome.reservation.startTime.getTime(),
      endTime: outcome.reservation.endTime.getTime(),
      recovered: false,
    });
  }

  private async _resolveLeaderId(command: ReserveVentilatorCommand): Promise<string | undefined> {
    let leaderId: string | undefined = command.leaderId;

    if (command.groupId !== undefined) {
      const group: Group | undefined = await this._groupsRepository.getById(command.groupId);

      if (!group) {
        throw new GroupNotFoundError();
      }

      leaderId = leaderId ?? group.simulatorLeaderId;
    }

    if (leaderId !== undefined && leaderId !== command.userId) {
      const leader: User | undefined = await this._usersRepository.getById(leaderId);

      if (!leader) {
        throw new UserNotFoundError();
      }
    }

    return leaderId;
  }
}
