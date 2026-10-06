/*
 * Funcionalidad: Caso de uso UpdateStepProgressUseCase
 * Descripción: Registra la navegación a un paso de una lección (solo lectura heredada para reanudar): marca UserProgress en curso y guarda el paso y el tiempo en LessonCompletion sin completar la lección; la completitud solo proviene de las vistas de página y una lección ya completada nunca se degrada
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { LessonNotFoundError } from "@/features/lessons/domain/lessons.errors";
import { UpdateStepProgressCommand } from "@/features/progress/application/commands/update-step-progress.command";
import { type LessonCompletionSnapshot, type LessonReference } from "@/features/progress/domain/read-models/progress-records.read-model";
import {
  type IProgressQueriesRepository,
  PROGRESS_QUERIES_REPOSITORY_TOKEN,
} from "@/features/progress/domain/repositories/progress-queries.repository";
import { type IProgressRepository, PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/progress.repository";
import { buildScoreWrite } from "@/features/progress/domain/services/module-progress-calculator";

/**
 * @throws {LessonNotFoundError} If the lesson reference cannot be resolved to a lesson
 */
@Injectable()
export class UpdateStepProgressUseCase {
  public constructor(
    @Inject(PROGRESS_REPOSITORY_TOKEN)
    private readonly _progressRepository: IProgressRepository,
    @Inject(PROGRESS_QUERIES_REPOSITORY_TOKEN)
    private readonly _progressQueriesRepository: IProgressQueriesRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
  ) {}

  public async execute(command: UpdateStepProgressCommand): Promise<void> {
    const reference: LessonReference | undefined = await this._progressQueriesRepository.resolveLessonReference(command.lessonId, command.moduleId);

    if (!reference) {
      throw new LessonNotFoundError();
    }

    const { userId } = command;
    const { lessonId, moduleId } = reference;
    const currentStepIndex: number = Math.min(command.currentStepIndex, command.totalSteps - 1);

    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      await this._progressRepository.touchModuleAccess(
        { userId, moduleId, lessonId, timeSpentDelta: command.timeSpentDelta, markInProgress: true },
        transaction,
      );

      const existing: LessonCompletionSnapshot | undefined = await this._progressRepository.getLessonCompletion(userId, lessonId, transaction);

      await this._progressRepository.saveLessonCompletion(
        {
          userId,
          lessonId,
          currentStepIndex,
          totalSteps: command.totalSteps,
          timeSpentDelta: command.timeSpentDelta,
          isCompleted: existing?.isCompleted === true,
          stampCompletedAt: false,
          quizScore: buildScoreWrite(command.quizScore, existing?.bestQuizScore),
        },
        transaction,
      );
    });
  }
}
