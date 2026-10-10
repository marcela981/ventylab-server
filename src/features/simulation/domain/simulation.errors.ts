/*
 * Funcionalidad: Errores de dominio de simulación
 * Descripción: Errores del ventilador físico (reserva ocupada, sin reserva activa, comando fuera de rango, usuario que no lidera la reserva, dispositivo desconectado), del paciente simulado (datos faltantes, paciente sin configurar, caso clínico inexistente) y de las sesiones con eventos (sesión inexistente, sin acceso o inactiva, examen no válido, caso no simulable, rúbrica inválida, lote, tiempo, id o payload de evento inválidos y ajuste fuera de rango) y asistencia de IA deshabilitada por la política del examen
 * Versión: 1.2
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

export class SimulationSessionNotFoundError extends DomainError {
  public constructor() {
    super("Simulation session not found", "simulation.session_not_found");
  }
}

export class SimulationSessionAccessDeniedError extends DomainError {
  public constructor() {
    super("You do not have access to this simulation session", "simulation.session_access_denied");
  }
}

export class SimulationSessionNotActiveError extends DomainError {
  public constructor() {
    super("The simulation session is not active", "simulation.session_not_active");
  }
}

export class SimulationExamAccessDeniedError extends DomainError {
  public constructor() {
    super("The exam attempt or question does not allow this simulation", "simulation.exam_access_denied");
  }
}

export class SimulationCaseRequiredError extends DomainError {
  public constructor() {
    super("caseId is required for a free simulation", "simulation.case_required");
  }
}

export class SimulationCaseNotReadyError extends DomainError {
  public constructor() {
    super("The clinical case cannot be simulated by the engine", "simulation.case_not_ready");
  }
}

export class SimulationRubricInvalidError extends DomainError {
  public constructor() {
    super("The simulation rubric is invalid", "simulation.rubric_invalid");
  }
}

export class SimulationEventBatchTooLargeError extends DomainError {
  public constructor(public readonly maxBatchSize: number) {
    super(`A batch can contain at most ${maxBatchSize} events`, "simulation.event_batch_too_large");
  }

  public get i18nArgs(): Record<string, number> {
    return { max: this.maxBatchSize };
  }
}

export class SimulationEventTimeNotMonotonicError extends DomainError {
  public constructor() {
    super("Event simulated times must not decrease", "simulation.event_time_not_monotonic");
  }
}

export class SimulationEventTimeAheadError extends DomainError {
  public constructor() {
    super("Event simulated time is ahead of the elapsed session time", "simulation.event_time_ahead");
  }
}

export class SimulationEventIdConflictError extends DomainError {
  public constructor() {
    super("The event id already belongs to another simulation session", "simulation.event_id_conflict");
  }
}

export class InvalidSimulationEventPayloadError extends DomainError {
  public constructor(public readonly field: string) {
    super(`Invalid simulation event payload: ${field}`, "simulation.invalid_event_payload");
  }

  public get i18nArgs(): Record<string, string> {
    return { field: this.field };
  }
}

export class SimulationParameterOutOfRangeError extends DomainError {
  public constructor(public readonly field: string, public readonly detail: string) {
    super(`Ventilator setting out of range: ${detail}`, "simulation.parameter_out_of_range");
  }

  public get i18nArgs(): Record<string, string> {
    return { field: this.field, detail: this.detail };
  }
}

export class SimulationAssistanceDisabledError extends DomainError {
  public constructor() {
    super("AI assistance is disabled for this exam simulation", "simulation.assistance_disabled");
  }
}
