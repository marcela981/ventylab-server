/*
 * Funcionalidad: Entidad SimulationSession
 * Descripción: Sesión de simulación con eventos (modo libre o examen) sobre el motor fisiológico determinista: semilla y versión del motor fijadas por el servidor, multiplicador de tiempo, último tiempo simulado aceptado, estado ACTIVE/ENDED/ABANDONED y resumen calculado al terminar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { generateId } from "@/common/domain/utils/generate-id";
import { type TimeMultiplier } from "@/features/simulation/domain/engine";
import { type SimulationSessionSummary } from "@/features/simulation/domain/read-models/simulation-session.read-model";
import {
  ABANDONED_SIMULATION_STATUS,
  ACTIVE_SIMULATION_STATUS,
  ENDED_SIMULATION_STATUS,
  EXAM_SIMULATION_MODE,
  type SimulationModeValue,
  type SimulationSessionStatusValue,
} from "@/features/simulation/domain/value-objects/simulation-session-values";

export interface SimulationSessionProps {
  readonly id: string;
  readonly userId: string;
  readonly caseId: string;
  readonly mode: SimulationModeValue;
  readonly attemptId?: string;
  readonly questionId?: string;
  readonly seed: number;
  readonly engineVersion: string;
  readonly timeMultiplier: TimeMultiplier;
  readonly status: SimulationSessionStatusValue;
  readonly startedAt: Date;
  readonly endedAt?: Date;
  readonly lastEventAt: Date;
  readonly lastSimTimeMs: number;
  readonly summary?: SimulationSessionSummary;
}

export class SimulationSession {
  private _props: SimulationSessionProps;

  private constructor(props: SimulationSessionProps) {
    this._props = props;
  }

  public get id(): string {
    return this._props.id;
  }

  public get userId(): string {
    return this._props.userId;
  }

  public get caseId(): string {
    return this._props.caseId;
  }

  public get mode(): SimulationModeValue {
    return this._props.mode;
  }

  public get attemptId(): string | undefined {
    return this._props.attemptId;
  }

  public get questionId(): string | undefined {
    return this._props.questionId;
  }

  public get seed(): number {
    return this._props.seed;
  }

  public get engineVersion(): string {
    return this._props.engineVersion;
  }

  public get timeMultiplier(): TimeMultiplier {
    return this._props.timeMultiplier;
  }

  public get status(): SimulationSessionStatusValue {
    return this._props.status;
  }

  public get startedAt(): Date {
    return this._props.startedAt;
  }

  public get endedAt(): Date | undefined {
    return this._props.endedAt;
  }

  public get lastEventAt(): Date {
    return this._props.lastEventAt;
  }

  public get lastSimTimeMs(): number {
    return this._props.lastSimTimeMs;
  }

  public get summary(): SimulationSessionSummary | undefined {
    return this._props.summary;
  }

  public get isActive(): boolean {
    return this._props.status === ACTIVE_SIMULATION_STATUS;
  }

  public get isExam(): boolean {
    return this._props.mode === EXAM_SIMULATION_MODE;
  }

  public static start({
    userId,
    caseId,
    mode,
    attemptId,
    questionId,
    seed,
    engineVersion,
    timeMultiplier,
    now,
  }: {
    userId: string;
    caseId: string;
    mode: SimulationModeValue;
    attemptId?: string;
    questionId?: string;
    seed: number;
    engineVersion: string;
    timeMultiplier: TimeMultiplier;
    now: Date;
  }): SimulationSession {
    return new SimulationSession({
      id: generateId(),
      userId,
      caseId,
      mode,
      attemptId,
      questionId,
      seed,
      engineVersion,
      timeMultiplier,
      status: ACTIVE_SIMULATION_STATUS,
      startedAt: now,
      lastEventAt: now,
      lastSimTimeMs: 0,
    });
  }

  public static reconstitute(props: SimulationSessionProps): SimulationSession {
    return new SimulationSession(props);
  }

  public isOwnedBy(userId: string): boolean {
    return this._props.userId === userId;
  }

  public recordActivity(lastSimTimeMs: number, now: Date): void {
    this._props = { ...this._props, lastSimTimeMs: Math.max(this._props.lastSimTimeMs, lastSimTimeMs), lastEventAt: now };
  }

  public end(summary: SimulationSessionSummary, now: Date): void {
    this._props = {
      ...this._props,
      status: ENDED_SIMULATION_STATUS,
      endedAt: now,
      lastSimTimeMs: Math.max(this._props.lastSimTimeMs, summary.simTimeMs),
      summary,
    };
  }

  public abandon(now: Date): void {
    this._props = { ...this._props, status: ABANDONED_SIMULATION_STATUS, endedAt: now };
  }
}
