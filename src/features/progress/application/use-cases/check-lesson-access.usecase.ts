/*
 * Funcionalidad: Caso de uso CheckLessonAccessUseCase
 * Descripción: Decide si un usuario puede abrir una lección y por qué no: su módulo debe estar desbloqueado (CheckContentUnlockedUseCase, la misma regla de LearningProgressFacade.isUnlocked) y todas las lecciones publicadas anteriores con páginas publicadas deben estar completadas según la regla de completitud por páginas (las lecciones vacías se saltan). Quien gestiona contenido (staff) siempre puede abrirla. v2.0: devuelve la decisión con motivo y lecciones faltantes (undefined si la lección no existe o no es visible) en lugar de un booleano
 * Versión: 2.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { CheckContentUnlockedUseCase } from "@/features/progress/application/use-cases/check-content-unlocked.usecase";
import {
  type LessonAccessDecision,
  type LessonSequence,
  type SequenceLesson,
} from "@/features/progress/domain/read-models/lesson-access.read-model";
import { type ILearningProgressRepository, LEARNING_PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/learning-progress.repository";
import {
  type IProgressQueriesRepository,
  PROGRESS_QUERIES_REPOSITORY_TOKEN,
} from "@/features/progress/domain/repositories/progress-queries.repository";
import { ALLOWED_LESSON_ACCESS, decideLessonAccess, findMissingPreviousLessons } from "@/features/progress/domain/services/lesson-access-rules";

@Injectable()
export class CheckLessonAccessUseCase {
  public constructor(
    @Inject(LEARNING_PROGRESS_REPOSITORY_TOKEN)
    private readonly _learningProgressRepository: ILearningProgressRepository,
    @Inject(PROGRESS_QUERIES_REPOSITORY_TOKEN)
    private readonly _progressQueriesRepository: IProgressQueriesRepository,
    private readonly _checkContentUnlockedUseCase: CheckContentUnlockedUseCase,
  ) {}

  // Returns undefined when the lesson does not exist or is not visible to the caller.
  public async execute(userId: string, lessonId: string, canManage: boolean): Promise<LessonAccessDecision | undefined> {
    const sequence: LessonSequence | undefined = await this._progressQueriesRepository.getLessonSequence(lessonId, canManage);

    if (!sequence) {
      return undefined;
    }

    if (canManage) {
      return ALLOWED_LESSON_ACCESS;
    }

    const moduleUnlocked: boolean = await this._checkContentUnlockedUseCase.execute(userId, { type: "module", id: sequence.moduleId });

    if (!moduleUnlocked) {
      return decideLessonAccess(false, []);
    }

    const facts: LessonCompletionFact[] = await this._learningProgressRepository.getLessonFacts(
      userId,
      sequence.previousLessons.map((lesson: SequenceLesson) => lesson.lessonId),
    );

    return decideLessonAccess(true, findMissingPreviousLessons(sequence.previousLessons, facts));
  }
}
