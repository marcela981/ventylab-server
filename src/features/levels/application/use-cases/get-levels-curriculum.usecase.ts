/*
 * Funcionalidad: Caso de uso GetLevelsCurriculumUseCase
 * * Descripción: Ejecuta la operación GetLevelsCurriculum de la feature de niveles con progreso de nivel ponderado por lecciones (no el promedio de módulos); depende de ILevelQueriesRepository
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { computeLessonWeightedProgress } from "@/features/curriculum/domain/services/lesson-completion-rules";
import {
  type LevelCurriculumItem,
  type LevelCurriculumModule,
  type LevelCurriculumSource,
  type LevelCurriculumSourceLevel,
  type LevelCurriculumSourceModule,
} from "@/features/levels/domain/read-models/level-curriculum.read-model";
import { type ILevelQueriesRepository, LEVEL_QUERIES_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/level-queries.repository";
import { getColorForDifficulty } from "@/features/levels/domain/services/difficulty-colors";
import {
  ADVANCED_LEVEL_ID,
  FIRST_PATHOLOGY_MODULE_ORDER,
  getLevelEmoji,
  getLevelSlug,
  PATHOLOGIES_CATEGORY,
} from "@/features/levels/domain/services/level-curriculum-labels";

@Injectable()
export class GetLevelsCurriculumUseCase {
  public constructor(
    @Inject(LEVEL_QUERIES_REPOSITORY_TOKEN)
    private readonly _levelQueriesRepository: ILevelQueriesRepository,
  ) {}

  public async execute(canManage: boolean, userId?: string, track?: string): Promise<LevelCurriculumItem[]> {
    const source: LevelCurriculumSource = await this._levelQueriesRepository.getCurriculumSource(canManage, userId, track);

    const progressByModule: Map<string, LevelCurriculumSource["moduleProgress"][number]> = new Map();
    const completedByModule: Map<string, boolean> = new Map();

    for (const progress of source.moduleProgress) {
      progressByModule.set(progress.moduleId, progress);
      completedByModule.set(progress.moduleId, progress.isCompleted);
    }

    const prerequisitesByLevel: Map<string, string[]> = new Map();

    for (const prerequisite of source.prerequisites) {
      prerequisitesByLevel.set(prerequisite.levelId, [...(prerequisitesByLevel.get(prerequisite.levelId) ?? []), prerequisite.prerequisiteLevelId]);
    }

    const moduleIdsByLevel: Map<string, string[]> = new Map(
      source.levels.map((level: LevelCurriculumSourceLevel): [string, string[]] => [
        level.id,
        level.modules.map((module: LevelCurriculumSourceModule) => module.id),
      ]),
    );

    const isLevelCompleted = (levelId: string): boolean => {
      const moduleIds: string[] = moduleIdsByLevel.get(levelId) ?? [];

      return moduleIds.length > 0 && moduleIds.every((moduleId: string) => completedByModule.get(moduleId) === true);
    };

    const isLevelUnlocked = (levelId: string): boolean =>
      (prerequisitesByLevel.get(levelId) ?? []).every((prerequisiteId: string) => isLevelCompleted(prerequisiteId));

    return source.levels.map((level: LevelCurriculumSourceLevel): LevelCurriculumItem => {
      const slug: string = getLevelSlug(level.id);
      const isAdvancedLevel: boolean = level.id === ADVANCED_LEVEL_ID;

      const modules: LevelCurriculumModule[] = level.modules.map((module: LevelCurriculumSourceModule) => ({
        id: module.id,
        title: module.title,
        description: module.description,
        difficulty: module.difficulty,
        estimatedTime: module.estimatedTime,
        order: module.order,
        category: module.category ?? (isAdvancedLevel && module.order >= FIRST_PATHOLOGY_MODULE_ORDER ? PATHOLOGIES_CATEGORY : undefined),
        progressPercentage: progressByModule.get(module.id)?.progressPercentage ?? 0,
        isCompleted: completedByModule.get(module.id) ?? false,
        lessonCount: module.lessonCount,
      }));

      const totalModules: number = modules.length;
      const completedLessons: number = modules.reduce((sum: number, module: LevelCurriculumModule) => sum + (progressByModule.get(module.id)?.completedLessons ?? 0), 0);
      const totalLessons: number = modules.reduce((sum: number, module: LevelCurriculumModule) => sum + (progressByModule.get(module.id)?.totalLessons ?? 0), 0);

      return {
        id: slug,
        dbId: level.id,
        track: level.track,
        title: level.title,
        description: level.description,
        color: getColorForDifficulty(slug),
        emoji: getLevelEmoji(slug),
        order: level.order,
        modules,
        totalModules,
        completedModules: modules.filter((module: LevelCurriculumModule) => module.isCompleted).length,
        progressPercentage: computeLessonWeightedProgress(completedLessons, totalLessons).percentage,
        isCompleted: isLevelCompleted(level.id),
        isUnlocked: isLevelUnlocked(level.id),
      };
    });
  }
}
