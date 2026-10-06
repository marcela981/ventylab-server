/*
 * Funcionalidad: Errores de dominio de simulación
 * Descripción: Errores del ventilador físico (reserva ocupada, sin reserva activa, comando fuera de rango, usuario que no lidera la reserva, dispositivo desconectado) y del paciente simulado (datos faltantes, paciente sin configurar, caso clínico inexistente)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class VentilatorAlreadyReservedError extends DomainError {
  public constructor() {
    super("The ventilator is already reserved by another user", "simulation.ventilator_already_reserved");
  }
}

export class NoActiveReservationError extends DomainError {
  public constructor() {
    super("No active reservation found for the user", "simulation.no_active_reservation");
  }
}

export class InvalidVentilatorCommandError extends DomainError {
  public readonly errors: string[];

  public constructor(errors: string[]) {
    super(`Command validation failed: ${errors.join("; ")}`, "simulation.invalid_ventilator_command");
    this.errors = errors;
  }
}

export class NotReservationLeaderError extends DomainError {
  public constructor() {
    super("Only the reservation leader can send commands", "simulation.not_reservation_leader");
  }
}

export class VentilatorNotConnectedError extends DomainError {
  public constructor() {
    super("The ventilator connection is not available", "simulation.ventilator_not_connected");
  }
}

export class PatientDataRequiredError extends DomainError {
  public constructor() {
    super("demographics and condition are required when clinicalCaseId is not used", "simulation.patient_data_required");
  }
}

export class PatientNotConfiguredError extends DomainError {
  public constructor() {
    super("No patient is configured for the user", "simulation.patient_not_configured");
  }
}

export class SimulationCaseNotFoundError extends DomainError {
  public constructor() {
    super("Simulation clinical case not found", "simulation.case_not_found");
  }
}
