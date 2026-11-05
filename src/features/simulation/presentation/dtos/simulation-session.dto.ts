/*
 * Funcionalidad: DTOs de respuesta de sesiones de simulación
 * Descripción: Serialización de las sesiones con eventos: sesión iniciada con el caso del motor, resultado de un lote de eventos, estado actual, resumen calificado, repetición con aviso de versión del motor, vista de sesión del listado y línea de tiempo de la prueba de caso; el estado, la repetición y la vista del listado llevan el formulario del paciente propio
 * Versión: 1.4 (resultados de EXAM retenidos hasta la liberación docente)
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { SimulatedPatientDTO } from "@/features/simulation/presentation/dtos/simulation-session-request.dto";

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

  @ApiProperty({
    description: "Clinical target status; empty for an EXAM student until the teacher releases the answers",
    type: Object,
    isArray: true,
    example: [{ id: "SPO2", status: "MET" }],
  })
  public targets: object[];

  @ApiProperty({
    description: "True when an EXAM student is not shown part of the results yet (the teacher has not released the grade or the answers)",
    example: false,
  })
  public resultsWithheld: boolean;

  @ApiProperty({
    description: "Own patient form of a FREE session started with one (shown after a reload, in the list and in the replay); null otherwise",
    type: SimulatedPatientDTO,
    nullable: true,
  })
  public patient: SimulatedPatientDTO | null;

  public constructor(props: SimulationSessionStateDTO) {
    Object.assign(this, props);
  }
}

export class SimulationOutcomeDTO {
  @ApiProperty({
    description: "Final patient status; null for sessions without patient evolution (engine 1.0.0)",
    enum: ["STABLE", "UNSTABLE", "CRITICAL", "ARREST", "DECEASED"],
    example: "DECEASED",
    nullable: true,
    type: String,
  })
  public status: string | null;

  @ApiProperty({ description: "Simulated time the patient first turned critical, in ms", example: 360000, nullable: true, type: Number })
  public firstCriticalAtMs: number | null;

  @ApiProperty({ description: "Simulated time of the cardiac arrest, in ms", example: 600000, nullable: true, type: Number })
  public arrestAtMs: number | null;

  @ApiProperty({ description: "Simulated time of death, in ms", example: 630000, nullable: true, type: Number })
  public deceasedAtMs: number | null;

  public constructor(props: SimulationOutcomeDTO) {
    Object.assign(this, props);
  }
}

export class SimulationSettingChangeDTO {
  @ApiProperty({ description: "Ventilator setting", example: "peepCmH2O" })
  public field: string;

  @ApiProperty({ description: "Previous value", example: 5, nullable: true, oneOf: [{ type: "number" }, { type: "string" }] })
  public from: number | string | null;

  @ApiProperty({ description: "New value", example: 12, oneOf: [{ type: "number" }, { type: "string" }] })
  public to: number | string;
}

export class SimulationDebriefItemDTO {
  @ApiProperty({ description: "Simulated time in ms", example: 15000 })
  public simTimeMs: number;

  @ApiProperty({ description: "Item kind", enum: ["DECISION", "ALARM", "PATIENT_STATUS"], example: "DECISION" })
  public kind: string;

  @ApiProperty({ description: "Alarm code or patient status (absent for decisions)", example: "LOW_SPO2", required: false })
  public code?: string;

  @ApiProperty({ description: "Changed settings of a decision", type: SimulationSettingChangeDTO, isArray: true, required: false })
  public changes?: SimulationSettingChangeDTO[];
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

  @ApiProperty({
    description: "Final clinical target status; empty for an EXAM student until the teacher releases the answers",
    type: Object,
    isArray: true,
    example: [{ id: "SPO2", status: "MET" }],
  })
  public targets: object[];

  @ApiProperty({
    description: "Server-computed score between 0 and 1; null for an EXAM student until the teacher releases the grade",
    example: 0.82,
    nullable: true,
    type: Number,
  })
  public score: number | null;

  @ApiProperty({
    description: "Justified score per rubric criterion; empty for an EXAM student until the teacher releases the answers",
    type: Object,
    isArray: true,
    example: [{ criterion: "TARGETS_REACHED", points: 1 }],
  })
  public breakdown: object[];

  @ApiProperty({
    description: "True when an EXAM student is not shown part of the results yet (the teacher has not released the grade or the answers)",
    example: false,
  })
  public resultsWithheld: boolean;


  @ApiProperty({ description: "AI assistance requests during the session", example: 0 })
  public aiHelpCount: number;

  @ApiProperty({
    description: "Patient outcome; null for summaries stored before the engine 2.0.0",
    type: SimulationOutcomeDTO,
    nullable: true,
  })
  public outcome: SimulationOutcomeDTO | null;

  @ApiProperty({
    description: "Debrief timeline: decisions, alarm onsets and patient status changes in simulated time order (at most 200)",
    type: SimulationDebriefItemDTO,
    isArray: true,
  })
  public timeline: SimulationDebriefItemDTO[];

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

  @ApiProperty({
    description: "Own patient form of a FREE session started with one (shown after a reload, in the list and in the replay); null otherwise",
    type: SimulatedPatientDTO,
    nullable: true,
  })
  public patient: SimulatedPatientDTO | null;

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

  @ApiProperty({ description: "Clinical case title (null when the case no longer exists)", example: "Normal lung", nullable: true, type: String })
  public caseTitle: string | null;

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

  @ApiProperty({
    description: "Stored server-computed score; null until the session ends, and for an EXAM student until the teacher releases the grade",
    example: null,
    nullable: true,
    type: Number,
  })
  public score: number | null;

  @ApiProperty({
    description: "Own patient form of a FREE session started with one (shown after a reload, in the list and in the replay); null otherwise",
    type: SimulatedPatientDTO,
    nullable: true,
  })
  public patient: SimulatedPatientDTO | null;

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
