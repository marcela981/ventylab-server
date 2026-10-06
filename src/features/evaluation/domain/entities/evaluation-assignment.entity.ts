/*
 * Funcionalidad: Agregado EvaluationAssignment
 * Descripción: Activación de una evaluación READY para un grupo dentro de una ventana [startsAt, endsAt]: valida la ventana, emite EvaluationActivatedEvent, deriva el estado visible en lectura, cierra anticipadamente y edita la ventana (UPCOMING ambos extremos, ACTIVE solo el fin, CLOSED inmutable)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AggregateRoot } from "@/common/domain/aggregates/aggregate-root";
import { generateId } from "@/common/domain/utils/generate-id";
import {
  EvaluationAssignmentClosedError,
  EvaluationNotActivatableError,
  InvalidEvaluationAssignmentWindowError,
} from "@/features/evaluation/domain/evaluation.errors";
import { EvaluationActivatedEvent } from "@/features/evaluation/domain/events/evaluation-assignment.events";
import {
  ACTIVE_ASSIGNMENT_STATE,
  CLOSED_ASSIGNMENT_STATE,
  deriveEvaluationAssignmentState,
  type EvaluationAssignmentStateValue,
  type EvaluationAssignmentWindow,
  evaluationAssignmentWindowsOverlap,
  UPCOMING_ASSIGNMENT_STATE,
} from "@/features/evaluation/domain/value-objects/evaluation-assignment-state";
import { type EvaluationStatusValue, READY_EVALUATION_STATUS } from "@/features/evaluation/domain/value-objects/evaluation-status";
import { type EvaluationTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-type";

export const EVALUATION_ASSIGNMENT_AUDIT_TARGET: string = "EvaluationAssignment";

export interface ActivatableEvaluation {
  readonly id: string;
  readonly status: EvaluationStatusValue;
  readonly title: string;
  readonly type: EvaluationTypeValue;
}

export interface EvaluationAssignmentProps {
  id: string;
  evaluationId: string;
  groupId: string;
  startsAt: Date;
  endsAt?: Date;
  assignedById?: string;
  legacyIsActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function assertWindow(startsAt: Date, endsAt: Date, now: Date): void {
  if (startsAt.getTime() >= endsAt.getTime()) {
    throw new InvalidEvaluationAssignmentWindowError("starts_at_not_before_ends_at");
  }

  if (endsAt.getTime() <= now.getTime()) {
    throw new InvalidEvaluationAssignmentWindowError("ends_at_not_in_future");
  }
}

export class EvaluationAssignment extends AggregateRoot {
  private readonly _id: string;
  private readonly _evaluationId: string;
  private readonly _groupId: string;
  private _startsAt: Date;
  private _endsAt?: Date;
  private readonly _assignedById?: string;
  private readonly _legacyIsActive?: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: EvaluationAssignmentProps) {
    super();
    this._id = props.id;
    this._evaluationId = props.evaluationId;
    this._groupId = props.groupId;
    this._startsAt = props.startsAt;
    this._endsAt = props.endsAt;
    this._assignedById = props.assignedById;
    this._legacyIsActive = props.legacyIsActive;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public get id(): string {
    return this._id;
  }

  public get evaluationId(): string {
    return this._evaluationId;
  }

  public get groupId(): string {
    return this._groupId;
  }

  public get startsAt(): Date {
    return this._startsAt;
  }

  public get endsAt(): Date | undefined {
    return this._endsAt;
  }

  public get assignedById(): string | undefined {
    return this._assignedById;
  }

  public get legacyIsActive(): boolean | undefined {
    return this._legacyIsActive;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get window(): EvaluationAssignmentWindow {
    return { startsAt: this._startsAt, endsAt: this._endsAt, legacyIsActive: this._legacyIsActive };
  }

  public stateAt(now: Date): EvaluationAssignmentStateValue {
    return deriveEvaluationAssignmentState(this.window, now);
  }

  public overlaps(other: EvaluationAssignment): boolean {
    return other.id !== this._id && other.groupId === this._groupId && evaluationAssignmentWindowsOverlap(this.window, other.window);
  }

  public reschedule({ startsAt, endsAt }: { startsAt?: Date; endsAt?: Date }, now: Date): void {
    const state: EvaluationAssignmentStateValue = this.stateAt(now);

    if (state === CLOSED_ASSIGNMENT_STATE) {
      throw new EvaluationAssignmentClosedError();
    }

    if (state === ACTIVE_ASSIGNMENT_STATE && startsAt !== undefined && startsAt.getTime() !== this._startsAt.getTime()) {
      throw new InvalidEvaluationAssignmentWindowError("starts_at_locked");
    }

    const nextStartsAt: Date = startsAt ?? this._startsAt;
    const nextEndsAt: Date | undefined = endsAt ?? this._endsAt;

    if (nextEndsAt !== undefined) {
      assertWindow(nextStartsAt, nextEndsAt, now);
    }

    this._startsAt = nextStartsAt;
    this._endsAt = nextEndsAt;
    this._updatedAt = now;
  }

  public close(now: Date): void {
    const state: EvaluationAssignmentStateValue = this.stateAt(now);

    if (state === CLOSED_ASSIGNMENT_STATE) {
      throw new EvaluationAssignmentClosedError();
    }

    if (state === UPCOMING_ASSIGNMENT_STATE) {
      this._startsAt = now;
    }

    this._endsAt = now;
    this._updatedAt = now;
  }

  public toAuditState(): Record<string, unknown> {
    return {
      evaluationId: this._evaluationId,
      groupId: this._groupId,
      startsAt: this._startsAt.toISOString(),
      endsAt: this._endsAt?.toISOString() ?? null,
    };
  }

  public static create({
    evaluation,
    groupId,
    startsAt,
    endsAt,
    assignedById,
    now,
  }: {
    evaluation: ActivatableEvaluation;
    groupId: string;
    startsAt: Date;
    endsAt: Date;
    assignedById?: string;
    now: Date;
  }): EvaluationAssignment {
    if (evaluation.status !== READY_EVALUATION_STATUS) {
      throw new EvaluationNotActivatableError(evaluation.status);
    }

    assertWindow(startsAt, endsAt, now);

    const assignment: EvaluationAssignment = new EvaluationAssignment({
      id: generateId(),
      evaluationId: evaluation.id,
      groupId,
      startsAt,
      endsAt,
      assignedById,
      createdAt: now,
      updatedAt: now,
    });

    assignment.publishEvent(
      new EvaluationActivatedEvent({
        assignmentId: assignment.id,
        evaluationId: evaluation.id,
        groupId,
        title: evaluation.title,
        type: evaluation.type,
        startsAt,
        endsAt,
        performedBy: assignedById,
      }),
    );

    return assignment;
  }

  public static reconstitute(props: EvaluationAssignmentProps): EvaluationAssignment {
    return new EvaluationAssignment(props);
  }
}
