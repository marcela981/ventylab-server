/*
 * Funcionalidad: Caso de uso GradeEvaluationAnswerUseCase
 * Descripción: Calificación manual de una pregunta de un intento por un profesor en su alcance (o un administrador): bajo el candado por evaluación y estudiante y el compartido de estructura (los mismos del cierre y la entrega) cierra antes un intento en curso vencido, valida 0 ≤ puntaje ≤ puntos, exige comentario al sobrescribir un puntaje automático o manual existente y lo audita con IAuditRecorder en la misma transacción, recalcula puntaje, estado y nota (GRADED sin pendientes, publicación automática si showResultsImmediately) y publica los eventos tras confirmar; los intentos heredados (legacySource) se rechazan con 409 porque se califican por las rutas heredadas y su puntaje migrado no se recalcula desde las respuestas
 * Versión: 1.1
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
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { type GradeEvaluationAnswerCommand } from "@/features/evaluation/application/commands/grade-evaluation-answer.command";
import { EVALUATION_GRADING_CONFIG_TOKEN, type EvaluationGradingConfig } from "@/features/evaluation/application/evaluation-grading.config";
import { type GradeEvaluationAnswerResult } from "@/features/evaluation/application/results/evaluation-grading.result";
import { EvaluationAttemptCloser, type EvaluationAttemptContext } from "@/features/evaluation/application/services/evaluation-attempt-closer";
import { EvaluationGradingAccess } from "@/features/evaluation/application/services/evaluation-grading-access";
import {
  type AnswerGradeChange,
  EVALUATION_ANSWER_AUDIT_TARGET,
  type StudentEvaluationAttempt,
} from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { EvaluationAttemptNotFoundError, EvaluationAttemptReadOnlyError } from "@/features/evaluation/domain/evaluation.errors";
import {
  type IStudentEvaluationAttemptsRepository,
  STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN,
} from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";

export const EVALUATION_SCORE_OVERRIDDEN_ACTION: string = "evaluation_score_overridden";

interface GradeOutcome {
  readonly attempt: StudentEvaluationAttempt;
  readonly change: AnswerGradeChange;
  readonly events: DomainEvent[];
}

/**
 * @throws {EvaluationAttemptNotFoundError} If the attempt does not exist
 * @throws {EvaluationGradingForbiddenError} If a teacher grades an attempt outside their groups (or a legacy attempt of an evaluation they did not create)
 * @throws {EvaluationAttemptReadOnlyError} If the attempt is legacy (graded through the legacy routes, never recomputed from answer rows)
 * @throws {EvaluationNotFoundError} If the evaluation of the attempt does not exist
 * @throws {EvaluationAttemptNotGradableError} If the attempt is still in progress
 * @throws {EvaluationQuestionNotFoundError} If the question does not belong to the evaluation
 * @throws {InvalidManualScoreError} If the score is not between 0 and the question points
 * @throws {GradeOverrideCommentRequiredError} If an existing score is overridden without a comment
 */
@Injectable()
export class GradeEvaluationAnswerUseCase {
  public constructor(
    @Inject(STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN)
    private readonly _attemptsRepository: IStudentEvaluationAttemptsRepository,
    private readonly _closer: EvaluationAttemptCloser,
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

  public async execute(command: GradeEvaluationAnswerCommand): Promise<GradeEvaluationAnswerResult> {
    const target: StudentEvaluationAttempt | undefined = await this._attemptsRepository.getById(command.attemptId);

    if (!target) {
      throw new EvaluationAttemptNotFoundError();
    }

    await this._access.assertCanGrade(command.actor, target.id);

    if (target.isLegacy) {
      throw new EvaluationAttemptReadOnlyError();
    }

    const now: Date = new Date();

    const outcome: GradeOutcome = await this._transactionManager.run(async (transaction: unknown): Promise<GradeOutcome> => {
      await this._closer.lock(target.evaluationId, target.userId, transaction);

      const attempt: StudentEvaluationAttempt | undefined = await this._attemptsRepository.getById(target.id, transaction);

      if (!attempt) {
        throw new EvaluationAttemptNotFoundError();
      }

      const context: EvaluationAttemptContext = await this._closer.loadContext(attempt, transaction);

      await this._closer.closeIfExpired(attempt, context, now, transaction);

      const change: AnswerGradeChange = attempt.gradeAnswer({
        questions: context.evaluation.questions,
        questionId: command.questionId,
        manualScore: command.manualScore,
        comment: command.comment,
        graderId: command.actor.id,
        now,
        publishImmediately: context.evaluation.showResultsImmediately,
        passingGrade: this._gradingConfig.passingGrade,
      });

      await this._attemptsRepository.save(attempt, transaction);

      if (change.override) {
        await this._auditRecorder.record(
          command.actor.id,
          EVALUATION_SCORE_OVERRIDDEN_ACTION,
          EVALUATION_ANSWER_AUDIT_TARGET,
          change.answerId,
          change.before,
          change.after,
          transaction,
        );
      }

      return { attempt, change, events: attempt.getEvents() };
    });

    this._eventBus.publish(outcome.events);

    return {
      attemptId: outcome.attempt.id,
      questionId: command.questionId,
      status: outcome.attempt.status,
      score: outcome.attempt.score,
      maxScore: outcome.attempt.maxScore,
      grade: outcome.attempt.grade,
      published: outcome.attempt.isPublished,
      override: outcome.change.override,
    };
  }
}
