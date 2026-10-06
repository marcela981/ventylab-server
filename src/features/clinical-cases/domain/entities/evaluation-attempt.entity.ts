/*
 * Funcionalidad: Entidad EvaluationAttempt
 * Descripción: Agregado del intento de evaluación de un caso clínico con la configuración del estudiante, la comparación contra la experta, el puntaje, el éxito (puntaje >= 70) y la retroalimentación; publica ClinicalCaseEvaluatedEvent al crearse
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AggregateRoot } from "@/common/domain/aggregates/aggregate-root";
import { AuditLog } from "@/common/domain/entities/audit-log.entity";
import { generateId } from "@/common/domain/utils/generate-id";
import { ClinicalCaseEvaluatedEvent } from "@/features/clinical-cases/domain/events/evaluation-attempt.events";
import {
  type ConfigurationComparison,
  type VentilatorConfiguration,
} from "@/features/clinical-cases/domain/read-models/configuration-comparison.read-model";

export const EVALUATION_ATTEMPT_ENTITY_COLLECTION: string = "evaluation_attempts";
export const EVALUATION_ATTEMPT_ENTITY_TYPE: string = "evaluation_attempt";

export const EVALUATION_SUCCESS_THRESHOLD: number = 70;

export type EvaluationAttemptAuditAction = "evaluation_attempt_created";

export class EvaluationAttempt extends AggregateRoot {
  private _id: string;
  private _userId: string;
  private _clinicalCaseId: string;
  private _userConfiguration: VentilatorConfiguration;
  private _score: number;
  private _differences?: ConfigurationComparison;
  private _aiFeedback?: string;
  private _completionTime?: number;
  private _isSuccessful: boolean;
  private _startedAt: Date;
  private _completedAt?: Date;
  private _auditLogs: AuditLog<EvaluationAttemptAuditAction>[];

  private constructor({
    id,
    userId,
    clinicalCaseId,
    userConfiguration,
    score,
    differences,
    aiFeedback,
    completionTime,
    isSuccessful,
    startedAt,
    completedAt,
    auditLogs,
  }: {
    id: string;
    userId: string;
    clinicalCaseId: string;
    userConfiguration: VentilatorConfiguration;
    score: number;
    differences?: ConfigurationComparison;
    aiFeedback?: string;
    completionTime?: number;
    isSuccessful: boolean;
    startedAt: Date;
    completedAt?: Date;
    auditLogs: AuditLog<EvaluationAttemptAuditAction>[];
  }) {
    super();
    this._id = id;
    this._userId = userId;
    this._clinicalCaseId = clinicalCaseId;
    this._userConfiguration = userConfiguration;
    this._score = score;
    this._differences = differences;
    this._aiFeedback = aiFeedback;
    this._completionTime = completionTime;
    this._isSuccessful = isSuccessful;
    this._startedAt = startedAt;
    this._completedAt = completedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get clinicalCaseId(): string {
    return this._clinicalCaseId;
  }

  public get userConfiguration(): VentilatorConfiguration {
    return this._userConfiguration;
  }

  public get score(): number {
    return this._score;
  }

  public get differences(): ConfigurationComparison | undefined {
    return this._differences;
  }

  public get aiFeedback(): string | undefined {
    return this._aiFeedback;
  }

  public get completionTime(): number | undefined {
    return this._completionTime;
  }

  public get isSuccessful(): boolean {
    return this._isSuccessful;
  }

  public get startedAt(): Date {
    return this._startedAt;
  }

  public get completedAt(): Date | undefined {
    return this._completedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<EvaluationAttemptAuditAction>> {
    return this._auditLogs;
  }

  public static create({
    userId,
    clinicalCaseId,
    userConfiguration,
    comparison,
    aiFeedback,
    completionTime,
  }: {
    userId: string;
    clinicalCaseId: string;
    userConfiguration: VentilatorConfiguration;
    comparison: ConfigurationComparison;
    aiFeedback: string;
    completionTime?: number;
  }): EvaluationAttempt {
    const now: Date = new Date();
    const isSuccessful: boolean = comparison.score >= EVALUATION_SUCCESS_THRESHOLD;

    const attempt: EvaluationAttempt = new EvaluationAttempt({
      id: generateId(),
      userId,
      clinicalCaseId,
      userConfiguration,
      score: comparison.score,
      differences: comparison,
      aiFeedback,
      completionTime,
      isSuccessful,
      startedAt: now,
      completedAt: now,
      auditLogs: [
        AuditLog.create<EvaluationAttemptAuditAction>({
          action: "evaluation_attempt_created",
          performedByUserId: userId,
          metadata: { clinicalCaseId, score: comparison.score, isSuccessful },
        }),
      ],
    });

    attempt.publishEvent(new ClinicalCaseEvaluatedEvent({ entity: attempt, performedBy: userId }));

    return attempt;
  }

  public static reconstitute({
    id,
    userId,
    clinicalCaseId,
    userConfiguration,
    score,
    differences,
    aiFeedback,
    completionTime,
    isSuccessful,
    startedAt,
    completedAt,
    auditLogs,
  }: {
    id: string;
    userId: string;
    clinicalCaseId: string;
    userConfiguration: VentilatorConfiguration;
    score: number;
    differences?: ConfigurationComparison;
    aiFeedback?: string;
    completionTime?: number;
    isSuccessful: boolean;
    startedAt: Date;
    completedAt?: Date;
    auditLogs: AuditLog<EvaluationAttemptAuditAction>[];
  }): EvaluationAttempt {
    return new EvaluationAttempt({
      id,
      userId,
      clinicalCaseId,
      userConfiguration,
      score,
      differences,
      aiFeedback,
      completionTime,
      isSuccessful,
      startedAt,
      completedAt,
      auditLogs,
    });
  }
}
