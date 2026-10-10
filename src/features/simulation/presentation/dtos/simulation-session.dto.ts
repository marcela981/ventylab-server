/*
 * Funcionalidad: DTOs de respuesta de sesiones de simulación
 * Descripción: Serialización de las sesiones con eventos: sesión iniciada con el caso del motor, resultado de un lote de eventos, estado actual, resumen calificado, repetición con aviso de versión del motor, vista de sesión del listado y línea de tiempo de la prueba de caso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class StartedSimulationSessionDTO {
  @ApiProperty({ description: "Session ID", example: "0192f1c2-7c1e-7a8b-9c0d-1e2f3a4b5c6d" })
  public id: string;

  @ApiProperty({ description: "Server-generated engine seed", example: 123456789 })
  public seed: number;

  @ApiProperty({ description: "Engine version fixed for the session", example: "1.0.0" })
  public engineVersion: string;

  @ApiProperty({ description: "Slow dynamics time multiplier", example: 1 })
  public timeMultiplier: number;

  @ApiProperty({ description: "Session start", example: "2026-10-08T12:00:00.000Z" })
  public startedAt: string;

  @ApiProperty({ description: "Exam attempt deadline, null in FREE mode", example: null, nullable: true, type: String })
  public expiresAt: string | null;

  @ApiProperty({ description: "Engine case definition the client runs locally", type: Object, example: { id: "engine-normal-lung" } })
  public case: object;

  public constructor(props: StartedSimulationSessionDTO) {
    Object.assign(this, props);
  }
}

export class AppendedSimulationEventsDTO {
  @ApiProperty({ description: "Events stored by this request", example: 3 })
  public accepted: number;

  @ApiProperty({ description: "Events skipped because their ID was already stored for the session", example: 0 })
  public duplicates: number;

  @ApiProperty({ description: "Last accepted simulated time in ms", example: 42000 })
  public lastSimTimeMs: number;

  public constructor(props: AppendedSimulationEventsDTO) {
    Object.assign(this, props);
  }
}

export class SimulationSessionStateDTO {
  @ApiProperty({ description: "Session ID", example: "0192f1c2-7c1e-7a8b-9c0d-1e2f3a4b5c6d" })
  public id: string;

  @ApiProperty({ description: "Session status", example: "ACTIVE" })
  public status: string;

  @ApiProperty({ description: "Simulated time replayed by the server in ms", example: 42000 })
  public simTimeMs: number;

  @ApiProperty({ description: "Exam attempt deadline, null in FREE mode", example: null, nullable: true, type: String })
  public expiresAt: string | null;

  @ApiProperty({ description: "Current ventilator settings", type: Object, example: { mode: "VCV", peepCmH2O: 8 } })
  public settings: object;

  @ApiProperty({ description: "Engine metrics at the last accepted event", type: Object, example: { simTimeMs: 42000 } })
  public metrics: object;

  @ApiProperty({ description: "Active alarms", type: Object, isArray: true, example: [] })
  public alarms: object[];

  @ApiProperty({ description: "Clinical target status", type: Object, isArray: true, example: [{ id: "SPO2", status: "MET" }] })
  public targets: object[];

  public constructor(props: SimulationSessionStateDTO) {
    Object.assign(this, props);
  }
}

export class SimulationSessionSummaryDTO {
  @ApiProperty({ description: "Session ID", example: "0192f1c2-7c1e-7a8b-9c0d-1e2f3a4b5c6d" })
  public id: string;

  @ApiProperty({ description: "Session status", example: "ENDED" })
  public status: string;

  @ApiProperty({ description: "Engine version of the session", example: "1.0.0" })
  public engineVersion: string;

  @ApiProperty({ description: "Simulated time scored in ms", example: 600000 })
  public simTimeMs: number;

  @ApiProperty({ description: "Wall-clock duration in ms", example: 610000 })
  public durationMs: number;

  @ApiProperty({ description: "Final engine metrics", type: Object, example: { simTimeMs: 600000 } })
  public finalMetrics: object;

  @ApiProperty({ description: "Final clinical target status", type: Object, isArray: true, example: [{ id: "SPO2", status: "MET" }] })
  public targets: object[];

  @ApiProperty({ description: "Server-computed score between 0 and 1", example: 0.82 })
  public score: number;

  @ApiProperty({ description: "Justified score per rubric criterion", type: Object, isArray: true, example: [{ criterion: "TARGETS_REACHED", points: 1 }] })
  public breakdown: object[];

  @ApiProperty({ description: "AI assistance requests during the session", example: 0 })
  public aiHelpCount: number;

  public constructor(props: SimulationSessionSummaryDTO) {
    Object.assign(this, props);
  }
}

export class SimulationEventDTO {
  @ApiProperty({ description: "Event ID", example: "0192f1c2-7c1e-7a8b-9c0d-1e2f3a4b5c6d" })
  public id: string;

  @ApiProperty({ description: "Simulated time in ms", example: 12000 })
  public simTimeMs: number;

  @ApiProperty({ description: "Event type", example: "PARAM_CHANGE" })
  public type: string;

  @ApiProperty({ description: "Sanitized payload", type: Object, example: { changes: { peepCmH2O: 8 } } })
  public payload: object;

  @ApiProperty({ description: "Server reception time", example: "2026-10-08T12:00:12.000Z" })
  public receivedAt: string;

  public constructor(props: SimulationEventDTO) {
    Object.assign(this, props);
  }
}

export class SimulationSessionReplayDTO {
  @ApiProperty({ description: "Session ID", example: "0192f1c2-7c1e-7a8b-9c0d-1e2f3a4b5c6d" })
  public id: string;

  @ApiProperty({ description: "Engine case definition", type: Object, example: { id: "engine-normal-lung" } })
  public case: object;

  @ApiProperty({ description: "Engine seed", example: 123456789 })
  public seed: number;

  @ApiProperty({ description: "Stored events ordered by simulated time", type: SimulationEventDTO, isArray: true })
  public events: SimulationEventDTO[];

  @ApiProperty({ description: "Engine version recorded with the session", example: "1.0.0" })
  public engineVersion: string;

  @ApiProperty({ description: "Slow dynamics time multiplier", example: 1 })
  public timeMultiplier: number;

  @ApiProperty({ description: "Current server engine version", example: "1.0.0" })
  public currentEngineVersion: string;

  @ApiProperty({ description: "Whether the recorded and current engine versions differ", example: false })
  public engineVersionMismatch: boolean;

  @ApiProperty({ description: "Warning when the engine versions differ", example: null, nullable: true, type: String })
  public warning: string | null;

  public constructor(props: SimulationSessionReplayDTO) {
    Object.assign(this, props);
  }
}

export class SimulationSessionDTO {
  @ApiProperty({ description: "Session ID", example: "0192f1c2-7c1e-7a8b-9c0d-1e2f3a4b5c6d" })
  public id: string;

  @ApiProperty({ description: "Owner user ID", example: "cm1student0001" })
  public userId: string;

  @ApiProperty({ description: "Clinical case ID", example: "engine-normal-lung" })
  public caseId: string;

  @ApiProperty({ description: "Simulation mode", example: "FREE" })
  public mode: string;

  @ApiProperty({ description: "Exam attempt ID", example: null, nullable: true, type: String })
  public attemptId: string | null;

  @ApiProperty({ description: "Exam question ID", example: null, nullable: true, type: String })
  public questionId: string | null;

  @ApiProperty({ description: "Engine version", example: "1.0.0" })
  public engineVersion: string;

  @ApiProperty({ description: "Slow dynamics time multiplier", example: 1 })
  public timeMultiplier: number;

  @ApiProperty({ description: "Session status", example: "ENDED" })
  public status: string;

  @ApiProperty({ description: "Session start", example: "2026-10-08T12:00:00.000Z" })
  public startedAt: string;

  @ApiProperty({ description: "Session end", example: null, nullable: true, type: String })
  public endedAt: string | null;

  @ApiProperty({ description: "Last activity", example: "2026-10-08T12:10:00.000Z" })
  public lastEventAt: string;

  @ApiProperty({ description: "Last accepted simulated time in ms", example: 600000 })
  public lastSimTimeMs: number;

  @ApiProperty({ description: "Stored server-computed score, null until the session ends", example: null, nullable: true, type: Number })
  public score: number | null;

  public constructor(props: SimulationSessionDTO) {
    Object.assign(this, props);
  }
}

export class ClinicalCaseTestRunDTO {
  @ApiProperty({ description: "Engine version", example: "1.0.0" })
  public engineVersion: string;

  @ApiProperty({ description: "Simulated seconds", example: 300 })
  public seconds: number;

  @ApiProperty({ description: "Seed used", example: 42 })
  public seed: number;

  @ApiProperty({ description: "Engine metrics once per simulated second", type: Object, isArray: true, example: [{ simTimeMs: 1000 }] })
  public metricsTimeline: object[];

  public constructor(props: ClinicalCaseTestRunDTO) {
    Object.assign(this, props);
  }
}
