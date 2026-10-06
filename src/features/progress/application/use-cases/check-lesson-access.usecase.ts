/*
 * Funcionalidad: Caso de uso CheckLessonAccessUseCase
 * Descripción: Indica si un usuario puede abrir una lección: su módulo debe estar desbloqueado (CheckModuleAccessUseCase) y la lección publicada anterior debe estar completada según la regla de completitud por páginas
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { isLessonCompleted } from "@/features/curriculum/domain/services/lesson-completion-rules";
import { CheckModuleAccessUseCase } from "@/features/progress/application/use-cases/check-module-access.usecase";
import { type LessonGate } from "@/features/progress/domain/read-models/progress-records.read-model";
import { type ILearningProgressRepository, LEARNING_PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/learning-progress.repository";
import {
  type IProgressQueriesRepository,
  PROGRESS_QUERIES_REPOSITORY_TOKEN,
} from "@/features/progress/domain/repositories/progress-queries.repository";

@Injectable()
export class CheckLessonAccessUseCase {
  public constructor(
    @Inject(LEARNING_PROGRESS_REPOSITORY_TOKEN)
    private readonly _learningProgressRepository: ILearningProgressRepository,
    @Inject(PROGRESS_QUERIES_REPOSITORY_TOKEN)
    private readonly _progressQueriesRepository: IProgressQueriesRepository,
    private readonly _checkModuleAccessUseCase: CheckModuleAccessUseCase,
  ) {}

  public async execute(userId: string, lessonId: string): Promise<boolean> {
    const gate: LessonGate | undefined = await this._progressQueriesRepository.getLessonGate(lessonId);

    if (!gate || !gate.moduleIsActive) {
      return false;
    }

    const moduleAccessible: boolean = await this._checkModuleAccessUseCase.execute(userId, gate.moduleId);

    if (!moduleAccessible) {
      return false;
    }

    const previousLessonId: string | undefined = await this._progressQueriesRepository.getPreviousActiveLessonId(gate.moduleId, gate.order);

    if (!previousLessonId) {
      return true;
    }

    const [previousFact]: LessonCompletionFact[] = await this._learningProgressRepository.getLessonFacts(userId, [previousLessonId]);

    return previousFact === undefined || isLessonCompleted(previousFact);
  }
}
