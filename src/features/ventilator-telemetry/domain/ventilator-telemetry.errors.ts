/*
 * Funcionalidad: Errores de la telemetría del ventilador
 * Descripción: Errores de dominio de la grabación de telemetría: sin reserva activa, grabación no permitida al usuario y reserva inexistente
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class TelemetryNoActiveReservationError extends DomainError {
  public constructor() {
    super("There is no active ventilator reservation", "ventilator-telemetry.no_active_reservation");
  }
}

export class TelemetryRecordingForbiddenError extends DomainError {
  public constructor() {
    super("Only the reservation holders, teachers or administrators can access this telemetry recording", "ventilator-telemetry.recording_forbidden");
  }
}

export class TelemetryReservationNotFoundError extends DomainError {
  public constructor() {
    super("Reservation not found", "ventilator-telemetry.reservation_not_found");
  }
}
