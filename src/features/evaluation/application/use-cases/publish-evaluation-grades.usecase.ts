/*
 * Funcionalidad: Caso de uso PublishEvaluationGradesUseCase
 * Descripción: Publicación masiva de las notas GRADED sin publicar de una evaluación (opcionalmente de un grupo) en el alcance del profesor (o todas para un administrador): en una sola transacción toma el candado por evaluación y estudiante de cada intento en orden estable, vuelve a leerlo, fija gradePublishedAt y devuelve el conteo; un EvaluationGradePublishedEvent por intento se emite tras confirmar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { type PublishEvaluationGradesCommand } from "@/features/evaluation/application/commands/publish-evaluation-grades.command";
import { EVALUATION_GRADING_CONFIG_TOKEN, type EvaluationGradingConfig } from "@/features/evaluation/application/evaluation-grading.config";
import { EvaluationGradingAccess } from "@/features/evaluation/application/services/evaluation-grading-access";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { EvaluationNotFoundError } from "@/features/evaluation/domain/evaluation.errors";
import { type EvaluationAssignmentScope } from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import {
  EVALUATION_GRADING_REPOSITORY_TOKEN,
  type GradingAttemptKey,
  type IEvaluationGradingRepository,
} from "@/features/evaluation/domain/repositories/evaluation-grading.repository";
import { EVALUATIONS_REPOSITORY_TOKEN, type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";
import {
  type IStudentEvaluationAttemptsRepository,
  STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN,
} from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";
import { evaluationAttemptLockKey } from "@/features/evaluation/domain/services/evaluation-attempt-policy";
import { GRADED_ATTEMPT_STATUS } from "@/features/evaluation/domain/value-objects/evaluation-attempt-status";

interface PublishAllOutcome {
  readonly events: DomainEvent[];
  readonly count: number;
}

/**
 * @throws {EvaluationNotFoundError} If the evaluation does not exist
 */
@Injectable()
export class PublishEvaluationGradesUseCase {
  public constructor(
    @Inject(EVALUATION_GRADING_REPOSITORY_TOKEN)
    private readonly _gradingRepository: IEvaluationGradingRepository,
    @Inject(STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN)
    private readonly _attemptsRepository: IStudentEvaluationAttemptsRepository,
    @Inject(EVALUATIONS_REPOSITORY_TOKEN)
    private readonly _evaluationsRepository: IEvaluationsRepository,
    private readonly _access: EvaluationGradingAccess,
    @Inject(EVALUATION_GRADING_CONFIG_TOKEN)
    private readonly _gradingConfig: EvaluationGradingConfig,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: PublishEvaluationGradesCommand): Promise<number> {
    const evaluation: Evaluation | undefined = await this._evaluationsRepository.getById(command.evaluationId);

    if (!evaluation) {
      throw new EvaluationNotFoundError();
    }

    const scope: EvaluationAssignmentScope | undefined = await this._access.scopeFor(command.actor);
    const keys: GradingAttemptKey[] = await this._gradingRepository.getPublishableAttempts({ evaluationId: evaluation.id, groupId: command.groupId, scope });

    if (keys.length === 0) {
      return 0;
    }

    const ordered: GradingAttemptKey[] = [...keys].sort((left: GradingAttemptKey, right: GradingAttemptKey) =>
      `${left.userId}:${left.id}`.localeCompare(`${right.userId}:${right.id}`),
    );

    const now: Date = new Date();

    const outcome: PublishAllOutcome = await this._transactionManager.run(async (transaction: unknown): Promise<PublishAllOutcome> => {
      const events: DomainEvent[] = [];
      let count: number = 0;

      for (const key of ordered) {
        await this._attemptsRepository.acquireTransactionLock(evaluationAttemptLockKey(key.evaluationId, key.userId), transaction);

        const attempt: StudentEvaluationAttempt | undefined = await this._attemptsRepository.getById(key.id, transaction);

        if (!attempt || attempt.status !== GRADED_ATTEMPT_STATUS || attempt.isPublished) {
          continue;
        }

        attempt.publishGrade(now, this._gradingConfig.passingGrade, command.actor.id);
        await this._attemptsRepository.save(attempt, transaction);
        events.push(...attempt.getEvents());
        count++;
      }

      return { events, count };
    });

    this._eventBus.publish(outcome.events);

    return outcome.count;
  }
}
