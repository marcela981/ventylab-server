/*
 * Funcionalidad: Caso de uso PublishEvaluationAttemptGradeUseCase
 * Descripción: Publicación idempotente de la nota de un intento GRADED por un profesor en su alcance (o un administrador): bajo el candado por evaluación y estudiante fija gradePublishedAt, audita GRADE_PUBLISHED en la misma transacción y emite EvaluationGradePublishedEvent tras confirmar (grade:published al estudiante); si ya estaba publicada devuelve la fecha original sin escribir. v2.0 (ajustes C1): libera solo la nota (GRADE) o la nota con las respuestas, explicaciones y retroalimentación IA (GRADE_AND_ANSWERS, emite EvaluationAnswersReleasedEvent); liberar de nuevo lo ya liberado no escribe nada
 * Versión: 2.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { AUDIT_RECORDER_TOKEN, type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { AUDIT_ACTIONS } from "@/common/domain/audit/audit-action";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { EVALUATION_GRADING_CONFIG_TOKEN, type EvaluationGradingConfig } from "@/features/evaluation/application/evaluation-grading.config";
import { type PublishEvaluationAttemptGradeResult } from "@/features/evaluation/application/results/evaluation-grading.result";
import { EvaluationGradingAccess } from "@/features/evaluation/application/services/evaluation-grading-access";
import { EVALUATION_ATTEMPT_AUDIT_TARGET, type StudentEvaluationAttempt, type ResultsReleaseChange } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { EvaluationAttemptNotFoundError } from "@/features/evaluation/domain/evaluation.errors";
import {
  type IStudentEvaluationAttemptsRepository,
  STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN,
} from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";
import { evaluationAttemptLockKey } from "@/features/evaluation/domain/services/evaluation-attempt-policy";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";
import { type ResultsReleaseScopeValue } from "@/features/evaluation/domain/value-objects/results-release-scope";

interface PublishOutcome {
  readonly result: PublishEvaluationAttemptGradeResult;
  readonly events: DomainEvent[];
}

/**
 * @throws {EvaluationAttemptNotFoundError} If the attempt does not exist
 * @throws {EvaluationGradingForbiddenError} If a teacher publishes an attempt outside their groups (or a legacy attempt of an evaluation they did not create)
 * @throws {EvaluationAttemptNotGradedError} If the attempt is not GRADED
 */
@Injectable()
export class PublishEvaluationAttemptGradeUseCase {
  public constructor(
    @Inject(STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN)
    private readonly _attemptsRepository: IStudentEvaluationAttemptsRepository,
    private readonly _access: EvaluationGradingAccess,
    @Inject(EVALUATION_GRADING_CONFIG_TOKEN)
    private readonly _gradingConfig: EvaluationGradingConfig,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
    @Inject(AUDIT_RECORDER_TOKEN)
    private readonly _auditRecorder: IAuditRecorder,
  ) {}

  public async execute(attemptId: string, actor: EvaluationActor, releaseScope: ResultsReleaseScopeValue): Promise<PublishEvaluationAttemptGradeResult> {
    const target: StudentEvaluationAttempt | undefined = await this._attemptsRepository.getById(attemptId);

    if (!target) {
      throw new EvaluationAttemptNotFoundError();
    }

    await this._access.assertCanGrade(actor, target.id);

    const now: Date = new Date();

    const outcome: PublishOutcome = await this._transactionManager.run(async (transaction: unknown): Promise<PublishOutcome> => {
      await this._attemptsRepository.acquireTransactionLock(evaluationAttemptLockKey(target.evaluationId, target.userId), transaction);

      const attempt: StudentEvaluationAttempt | undefined = await this._attemptsRepository.getById(target.id, transaction);

      if (!attempt) {
        throw new EvaluationAttemptNotFoundError();
      }

      const before: { gradePublishedAt: Date | null; answersReleasedAt: Date | null } = { gradePublishedAt: attempt.gradePublishedAt ?? null, answersReleasedAt: attempt.answersReleasedAt ?? null };
      const change: ResultsReleaseChange = attempt.releaseResults(releaseScope, now, this._gradingConfig.passingGrade, actor.id);
      const changed: boolean = change.gradePublished || change.answersReleased;

      if (changed) {
        await this._attemptsRepository.save(attempt, transaction);
        await this._auditRecorder.record(
          actor.id,
          AUDIT_ACTIONS.GRADE_PUBLISHED,
          EVALUATION_ATTEMPT_AUDIT_TARGET,
          attempt.id,
          before,
          { gradePublishedAt: attempt.gradePublishedAt ?? null, answersReleasedAt: attempt.answersReleasedAt ?? null, grade: attempt.grade },
          transaction,
          { metadata: { evaluationId: attempt.evaluationId, studentId: attempt.userId, bulk: false, releaseScope } },
        );
      }

      return {
        result: { attemptId: attempt.id, publishedAt: attempt.gradePublishedAt ?? now, answersReleasedAt: attempt.answersReleasedAt, alreadyPublished: !changed },
        events: attempt.getEvents(),
      };
    });

    this._eventBus.publish(outcome.events);

    return outcome.result;
  }
}
