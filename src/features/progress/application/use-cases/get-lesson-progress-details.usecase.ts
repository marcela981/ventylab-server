/*
 * Funcionalidad: Caso de uso GetLessonProgressDetailsUseCase
 * Descripción: Devuelve el detalle por pasos del progreso de una lección dentro de un módulo existente, o su estado inicial con el número de pasos activos cuando aún no hay LessonCompletion
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { ModuleNotFoundError } from "@/features/modules/domain/modules.errors";
import { type LessonCompletionSnapshot } from "@/features/progress/domain/read-models/progress-records.read-model";
import { type LessonProgressDetails } from "@/features/progress/domain/read-models/progress-views.read-model";
import {
  type IProgressQueriesRepository,
  PROGRESS_QUERIES_REPOSITORY_TOKEN,
} from "@/features/progress/domain/repositories/progress-queries.repository";
import { type IProgressRepository, PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/progress.repository";
import { computeStepPercentage } from "@/features/progress/domain/services/module-progress-calculator";

/**
 * @throws {ModuleNotFoundError} If the module does not exist
 */
@Injectable()
export class GetLessonProgressDetailsUseCase {
  public constructor(
    @Inject(PROGRESS_REPOSITORY_TOKEN)
    private readonly _progressRepository: IProgressRepository,
    @Inject(PROGRESS_QUERIES_REPOSITORY_TOKEN)
    private readonly _progressQueriesRepository: IProgressQueriesRepository,
  ) {}

  public async execute(userId: string, moduleId: string, lessonId: string): Promise<LessonProgressDetails> {
    const moduleExists: boolean = await this._progressQueriesRepository.moduleExists(moduleId);

    if (!moduleExists) {
      throw new ModuleNotFoundError();
    }

    const completion: LessonCompletionSnapshot | undefined = await this._progressRepository.getLessonCompletion(userId, lessonId);

    if (!completion) {
      const activeSteps: number | undefined = await this._progressQueriesRepository.countActiveSteps(lessonId);

      return { lessonId, currentStepIndex: 0, totalSteps: activeSteps ?? 1, completed: false, timeSpent: 0, progressPercentage: 0 };
    }

    return {
      lessonId: completion.lessonId,
      currentStepIndex: completion.currentStepIndex,
      totalSteps: completion.totalSteps,
      completed: completion.isCompleted,
      timeSpent: completion.timeSpent,
      lastAccessed: completion.lastAccessed,
      progressPercentage: computeStepPercentage(completion.currentStepIndex, completion.totalSteps, completion.isCompleted),
    };
  }
}
