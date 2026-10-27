/*
 * Funcionalidad: Errores de los comandos del ventilador
 * Descripción: Errores de dominio del control exclusivo y de los comandos del ventilador físico: sin reserva activa, no titular, control bloqueado, no operador, límite de frecuencia con hora de reintento, comando inválido con la lista de violaciones, dispositivo fuera de línea, reserva no encontrada y transición del ciclo de vida no permitida; un miembro no líder del grupo titular solo observa
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";
import { type VentilatorCommandViolation } from "@/features/ventilator-commands/domain/validation/ventilator-command-validator";

export class NoActiveVentilatorReservationError extends DomainError {
  public constructor() {
    super("There is no active ventilator reservation", "ventilator-commands.no_active_reservation");
  }
}

export class NotReservationHolderError extends DomainError {
  public constructor() {
    super("Only the reservation holders, teachers and administrators can do this", "ventilator-commands.not_reservation_holder");
  }
}

export class VentilatorControlObserverError extends DomainError {
  public constructor() {
    super("Only the leader of the holder group can control the ventilator; the other members observe", "ventilator-commands.group_member_observer");
  }
}

export class VentilatorControlLockedError extends DomainError {
  public constructor() {
    super("The ventilator is controlled by another operator", "ventilator-commands.control_locked");
  }
}

export class NotVentilatorOperatorError extends DomainError {
  public constructor() {
    super("Only the current ventilator operator can do this", "ventilator-commands.not_operator");
  }
}

export class VentilatorCommandRateLimitedError extends DomainError {
  public constructor(public readonly retryAt: Date) {
    super("Too many ventilator commands, retry later", "ventilator-commands.rate_limited");
  }
}

export class InvalidVentilatorCommandError extends DomainError {
  public constructor(public readonly violations: readonly VentilatorCommandViolation[]) {
    super(`Ventilator command validation failed: ${violations.map((violation: VentilatorCommandViolation): string => violation.message).join("; ")}`, "ventilator-commands.invalid_command");
  }

  public get details(): { violations: readonly VentilatorCommandViolation[] } {
    return { violations: this.violations };
  }
}

export class VentilatorDeviceOfflineError extends DomainError {
  public constructor() {
    super("The ventilator is offline", "ventilator-commands.device_offline");
  }
}

export class VentilatorCommandReservationNotFoundError extends DomainError {
  public constructor() {
    super("Reservation not found", "ventilator-commands.reservation_not_found");
  }
}

export class IllegalVentilatorCommandTransitionError extends DomainError {
  public constructor(
    public readonly from: string,
    public readonly to: string,
  ) {
    super(`A ventilator command cannot move from ${from} to ${to}`, "ventilator-commands.illegal_transition");
  }

  public get i18nArgs(): Record<string, string> {
    return { from: this.from, to: this.to };
  }
}
