/*
 * Funcionalidad: Caso de uso GetVentilatorCommandsUseCase
 * Descripción: Historial paginado de los comandos enviados durante una reserva; permitido a los titulares de esa reserva, docentes y administradores
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { type GetVentilatorCommandsCommand } from "@/features/ventilator-commands/application/commands/ventilator-commands.commands";
import { type VentilatorCommand } from "@/features/ventilator-commands/domain/entities/ventilator-command.entity";
import { type IVentilatorCommandsRepository, VENTILATOR_COMMANDS_REPOSITORY_TOKEN } from "@/features/ventilator-commands/domain/repositories/ventilator-commands.repository";
import { isPrivilegedVentilatorRole } from "@/features/ventilator-commands/domain/services/operator-control-policy";
import { NotReservationHolderError, VentilatorCommandReservationNotFoundError } from "@/features/ventilator-commands/domain/ventilator-commands.errors";

/**
 * @throws {VentilatorCommandReservationNotFoundError} If the reservation does not exist
 * @throws {NotReservationHolderError} If the caller is neither a holder of the reservation nor a teacher or administrator
 */
@Injectable()
export class GetVentilatorCommandsUseCase {
  public constructor(
    @Inject(VENTILATOR_COMMANDS_REPOSITORY_TOKEN)
    private readonly _repository: IVentilatorCommandsRepository,
    private readonly _reservationsFacade: ReservationsFacade,
  ) {}

  public async execute(command: GetVentilatorCommandsCommand): Promise<Paginated<VentilatorCommand>> {
    const reservation: ActiveReservationSummary | undefined = await this._reservationsFacade.getReservationById(command.reservationId);

    if (!reservation) {
      throw new VentilatorCommandReservationNotFoundError();
    }

    if (!isPrivilegedVentilatorRole(command.role) && !(await this._reservationsFacade.isHolder(command.userId, reservation))) {
      throw new NotReservationHolderError();
    }

    return await this._repository.getByReservation({
      reservationId: command.reservationId,
      page: command.page,
      limit: command.limit,
      sortOrder: command.sortOrder,
    });
  }
}
