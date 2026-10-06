/*
 * Funcionalidad: Caso de uso RecordLessonProgressUseCase
 * Descripción: Registra avance o completitud de una lección resolviendo ids heredados del frontend; con datos de pasos delega en UpdateStepProgressUseCase (solo posición, sin completar) y, sin ellos, actualiza LessonCompletion y UserProgress en una transacción sin degradar una lección ya completada
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
import { RecordLessonProgressCommand } from "@/features/progress/application/commands/record-lesson-progress.command";
import { UpdateStepProgressCommand } from "@/features/progress/application/commands/update-step-progress.command";
import { UpdateStepProgressUseCase } from "@/features/progress/application/use-cases/update-step-progress.usecase";
import { LessonCompletedEvent } from "@/features/progress/domain/events/lesson-completed.event";
import {
  type LessonCompletionSnapshot,
  type LessonReference,
  type ModuleCounters,
} from "@/features/progress/domain/read-models/progress-records.read-model";
import {
  type IProgressQueriesRepository,
  PROGRESS_QUERIES_REPOSITORY_TOKEN,
} from "@/features/progress/domain/repositories/progress-queries.repository";
import { type IProgressRepository, PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/progress.repository";
import { buildScoreWrite } from "@/features/progress/domain/services/module-progress-calculator";

/**
 * @throws {LessonNotFoundError} If step data is sent and the lesson reference cannot be resolved
 */
@Injectable()
export class RecordLessonProgressUseCase {
  public constructor(
    @Inject(PROGRESS_REPOSITORY_TOKEN)
    private readonly _progressRepository: IProgressRepository,
    @Inject(PROGRESS_QUERIES_REPOSITORY_TOKEN)
    private readonly _progressQueriesRepository: IProgressQueriesRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
    private readonly _updateStepProgressUseCase: UpdateStepProgressUseCase,
  ) {}

  public async execute(command: RecordLessonProgressCommand): Promise<void> {
    const reference: LessonReference | undefined = await this._progressQueriesRepository.resolveLessonReference(
      command.lessonReference,
      command.moduleIdHint,
    );

    if (!reference) {
      return;
    }

    if (command.currentStep !== undefined && command.totalSteps !== undefined) {
      await this._updateStepProgressUseCase.execute(
        new UpdateStepProgressCommand({
          userId: command.userId,
          moduleId: reference.moduleId,
          lessonId: reference.lessonId,
          currentStepIndex: Math.max(0, command.currentStep - 1),
          totalSteps: command.totalSteps,
          timeSpentDelta: command.timeSpent,
          quizScore: command.quizScore,
        }),
      );

      return;
    }

    const { userId } = command;
    const { lessonId, moduleId } = reference;

    const event: LessonCompletedEvent | undefined = await this._transactionManager.run(async (transaction: unknown): Promise<LessonCompletedEvent | undefined> => {
      const existing: LessonCompletionSnapshot | undefined = await this._progressRepository.getLessonCompletion(userId, lessonId, transaction);
      const alreadyCompleted: boolean = existing?.isCompleted === true;
      const completed: boolean = alreadyCompleted || command.completed;

      await this._progressRepository.saveLessonCompletion(
        {
          userId,
          lessonId,
          timeSpentDelta: command.timeSpent,
          isCompleted: completed,
          stampCompletedAt: completed,
          quizScore: buildScoreWrite(command.quizScore, existing?.bestQuizScore),
        },
        transaction,
      );

      await this._progressRepository.touchModuleAccess(
        { userId, moduleId, lessonId, timeSpentDelta: command.timeSpent, markInProgress: false },
        transaction,
      );

      if (!completed) {
        return undefined;
      }

      const counters: ModuleCounters | undefined = await this._progressRepository.refreshModuleCounters({ userId, moduleId }, transaction);

      return alreadyCompleted ? undefined : new LessonCompletedEvent({ userId, lessonId, moduleId, moduleCompleted: counters?.isModuleCompleted === true });
    });

    if (event) {
      this._eventBus.publish([event]);
    }
  }
}
