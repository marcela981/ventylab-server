/*
 * Funcionalidad: Casos de uso del control exclusivo del ventilador
 * Descripción: Consultar el estado del control para quien pregunta, tomar el control libre, arrebatarlo (líder del grupo titular, docente o administrador, con registro de auditoría), liberarlo (operador, docente o administrador) y renovar la presencia del operador con un latido
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { AUDIT_RECORDER_TOKEN, type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { type VentilatorControlCommand } from "@/features/ventilator-commands/application/commands/ventilator-commands.commands";
import { VentilatorControlStateResult } from "@/features/ventilator-commands/application/results/ventilator-commands.results";
import { type OperatorControlSnapshot, OperatorControlService } from "@/features/ventilator-commands/application/services/operator-control.service";
import {
  canReleaseControl,
  type ControlDecision,
  type ControlRequestFacts,
  type ControlRequestKind,
  decideControlRequest,
  isPrivilegedVentilatorRole,
} from "@/features/ventilator-commands/domain/services/operator-control-policy";
import {
  NoActiveVentilatorReservationError,
  NotReservationHolderError,
  NotVentilatorOperatorError,
  VentilatorControlLockedError,
} from "@/features/ventilator-commands/domain/ventilator-commands.errors";

export const VENTILATOR_CONTROL_TAKEOVER_ACTION: string = "ventilator_control_taken_over";
export const VENTILATOR_CONTROL_AUDIT_TARGET: string = "VentilatorControl";

interface ControlContext {
  readonly active: ActiveReservationSummary | undefined;
  readonly operator: OperatorControlSnapshot | undefined;
}

async function loadControlContext(reservationsFacade: ReservationsFacade, operatorControl: OperatorControlService): Promise<ControlContext> {
  const readStartedAt: Date = new Date();
  const active: ActiveReservationSummary | undefined = await reservationsFacade.getActiveReservation(readStartedAt);

  operatorControl.syncActiveReservation(active, readStartedAt);

  return { active, operator: operatorControl.state };
}

@Injectable()
export class GetVentilatorControlUseCase {
  public constructor(
    private readonly _reservationsFacade: ReservationsFacade,
    private readonly _operatorControl: OperatorControlService,
  ) {}

  public async execute(command: VentilatorControlCommand): Promise<VentilatorControlStateResult> {
    const { active, operator }: ControlContext = await loadControlContext(this._reservationsFacade, this._operatorControl);

    if (!active) {
      return new VentilatorControlStateResult({ isOperator: false, canTake: false, canTakeover: false });
    }

    const [isHolder, leadsHolderGroup]: [boolean, boolean] = await Promise.all([
      this._reservationsFacade.isHolder(command.userId, active),
      this._reservationsFacade.isGroupLeaderOfHolder(command.userId, active),
    ]);

    const facts: ControlRequestFacts = {
      actorUserId: command.userId,
      actorRole: command.role,
      isHolder,
      leadsHolderGroup,
      currentOperatorUserId: operator?.operatorUserId,
    };

    return new VentilatorControlStateResult({
      reservationId: active.id,
      operatorUserId: operator?.operatorUserId,
      since: operator?.since,
      lastSeenAt: operator?.lastSeenAt,
      presenceExpiresAt: operator?.presenceExpiresAt,
      isOperator: operator?.operatorUserId === command.userId,
      canTake: decideControlRequest("take", facts) === "take",
      canTakeover: decideControlRequest("takeover", facts) === "takeover",
    });
  }
}

/**
 * @throws {NoActiveVentilatorReservationError} If no reservation is active now
 * @throws {NotReservationHolderError} If the caller is neither a holder of the active reservation nor a teacher or administrator
 * @throws {VentilatorControlLockedError} If another operator holds the control and the caller may not take it over
 */
@Injectable()
export class TakeVentilatorControlUseCase {
  private readonly _logger: Logger = new Logger(TakeVentilatorControlUseCase.name);

  public constructor(
    private readonly _reservationsFacade: ReservationsFacade,
    private readonly _operatorControl: OperatorControlService,
    @Inject(AUDIT_RECORDER_TOKEN)
    private readonly _auditRecorder: IAuditRecorder,
  ) {}

  public async execute(command: VentilatorControlCommand, kind: ControlRequestKind): Promise<void> {
    const { active, operator }: ControlContext = await loadControlContext(this._reservationsFacade, this._operatorControl);

    if (!active) {
      throw new NoActiveVentilatorReservationError();
    }

    const isHolder: boolean = isPrivilegedVentilatorRole(command.role) ? false : await this._reservationsFacade.isHolder(command.userId, active);
    const needsLeadership: boolean = kind === "takeover" && operator !== undefined && operator.operatorUserId !== command.userId;
    const leadsHolderGroup: boolean = needsLeadership ? await this._reservationsFacade.isGroupLeaderOfHolder(command.userId, active) : false;

    const decision: ControlDecision = decideControlRequest(kind, {
      actorUserId: command.userId,
      actorRole: command.role,
      isHolder,
      leadsHolderGroup,
      currentOperatorUserId: operator?.operatorUserId,
    });

    switch (decision) {
      case "not_holder":
        throw new NotReservationHolderError();
      case "locked":
        throw new VentilatorControlLockedError();
      case "already_operator":
        this._operatorControl.touch(command.userId);

        return;
      case "take":
        this._operatorControl.assign(active.id, command.userId, "taken");

        return;
      case "takeover":
        this._operatorControl.assign(active.id, command.userId, "takeover");
        await this._auditTakeover(command.userId, active.id, operator?.operatorUserId);
    }
  }

  private async _auditTakeover(actorId: string, reservationId: string, previousOperatorUserId: string | undefined): Promise<void> {
    try {
      await this._auditRecorder.record(
        actorId,
        VENTILATOR_CONTROL_TAKEOVER_ACTION,
        VENTILATOR_CONTROL_AUDIT_TARGET,
        reservationId,
        { operatorUserId: previousOperatorUserId ?? null },
        { operatorUserId: actorId },
      );
    } catch (error: unknown) {
      this._logger.error(`Ventilator control takeover could not be audited: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * @throws {VentilatorControlLockedError} If another operator holds the control and the caller is neither that operator nor a teacher or administrator
 */
@Injectable()
export class ReleaseVentilatorControlUseCase {
  public constructor(private readonly _operatorControl: OperatorControlService) {}

  public execute(command: VentilatorControlCommand): void {
    const operator: OperatorControlSnapshot | undefined = this._operatorControl.state;

    if (!operator) {
      return;
    }

    if (!canReleaseControl(command.userId, command.role, operator.operatorUserId)) {
      throw new VentilatorControlLockedError();
    }

    this._operatorControl.release("released");
  }
}

/**
 * @throws {NotVentilatorOperatorError} If the caller does not hold the exclusive control of the ventilator
 */
@Injectable()
export class VentilatorControlHeartbeatUseCase {
  public constructor(private readonly _operatorControl: OperatorControlService) {}

  public execute(command: VentilatorControlCommand): void {
    if (!this._operatorControl.touch(command.userId)) {
      throw new NotVentilatorOperatorError();
    }
  }
}
