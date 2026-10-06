/*
 * Funcionalidad: Caso de uso GetModuleResumeUseCase
 * Descripción: Ejecuta la operación GetModuleResume de la feature de módulos; depende de IModuleProgressRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { ModuleHasNoLessonsError, ModuleNotFoundError } from "@/features/modules/domain/modules.errors";
import { type ModuleResumeSnapshot, type ModuleResumeState } from "@/features/modules/domain/read-models/module-progress.read-model";
import { type IModuleProgressRepository, MODULE_PROGRESS_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/module-progress.repository";

type ResumeCompletion = ModuleResumeSnapshot["completions"][number];
type ResumeLesson = ModuleResumeSnapshot["lessons"][number];

/**
 * @throws {ModuleNotFoundError} If the module does not exist
 * @throws {ModuleHasNoLessonsError} If the module has no active lessons
 */
@Injectable()
export class GetModuleResumeUseCase {
  public constructor(
    @Inject(MODULE_PROGRESS_REPOSITORY_TOKEN)
    private readonly _moduleProgressRepository: IModuleProgressRepository,
  ) {}

  public async execute(userId: string, moduleId: string): Promise<ModuleResumeState> {
    const snapshot: ModuleResumeSnapshot | undefined = await this._moduleProgressRepository.getResumeSnapshot(userId, moduleId);

    if (!snapshot) {
      throw new ModuleNotFoundError();
    }

    const lastLesson: ResumeLesson | undefined = snapshot.lessons[snapshot.lessons.length - 1];

    if (!lastLesson) {
      throw new ModuleHasNoLessonsError();
    }

    const completionByLesson: Map<string, ResumeCompletion> = new Map(
      snapshot.completions.map((completion: ResumeCompletion): [string, ResumeCompletion] => [completion.lessonId, completion]),
    );

    const firstIncompleteLesson: ResumeLesson | undefined = snapshot.lessons.find(
      (lesson: ResumeLesson) => !completionByLesson.get(lesson.id)?.isCompleted,
    );

    const resumeLesson: ResumeLesson = firstIncompleteLesson ?? lastLesson;
    const completion: ResumeCompletion | undefined = completionByLesson.get(resumeLesson.id);

    const completedLessons: number = snapshot.lessons.filter(
      (lesson: ResumeLesson) => completionByLesson.get(lesson.id)?.isCompleted === true,
    ).length;

    return {
      moduleId: snapshot.moduleId,
      moduleName: snapshot.moduleTitle,
      currentLessonId: resumeLesson.id,
      currentLessonTitle: resumeLesson.title,
      currentLessonOrder: resumeLesson.order,
      currentStepIndex: completion?.currentStepIndex ?? 0,
      totalStepsInLesson: completion?.totalSteps ?? (resumeLesson.activeStepCount || 1),
      moduleProgress: Math.floor((completedLessons / snapshot.lessons.length) * 100),
      totalLessons: snapshot.lessons.length,
      completedLessons,
      isModuleComplete: firstIncompleteLesson === undefined,
      lastAccessedAt: snapshot.lastAccessedAt,
    };
  }
}
