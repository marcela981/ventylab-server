/*
 * Funcionalidad: Caso de uso GetLevelUnlockStatusUseCase
 * Descripción: Ejecuta la operación GetLevelUnlockStatus de la feature de niveles; depende de ILevelQueriesRepository
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ContentStatusChain, isContentVisible } from "@/features/curriculum/domain/services/content-visibility";
import { LevelNotFoundError } from "@/features/levels/domain/levels.errors";
import {
  type LevelCompletionStatus,
  type LevelUnlockSource,
  type LevelUnlockStatus,
  type PrerequisiteStatus,
} from "@/features/levels/domain/read-models/level-roadmap.read-model";
import { type ILevelQueriesRepository, LEVEL_QUERIES_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/level-queries.repository";

/**
 * @throws {LevelNotFoundError} If the level does not exist or is not visible to the reader
 */
@Injectable()
export class GetLevelUnlockStatusUseCase {
  public constructor(
    @Inject(LEVEL_QUERIES_REPOSITORY_TOKEN)
    private readonly _levelQueriesRepository: ILevelQueriesRepository,
  ) {}

  public async execute(userId: string, levelId: string, canManage: boolean): Promise<LevelUnlockStatus> {
    const chain: ContentStatusChain | undefined = await this._levelQueriesRepository.getStatusChain(levelId);

    if (!chain || !isContentVisible(canManage, chain)) {
      throw new LevelNotFoundError();
    }

    const completion: LevelCompletionStatus = await this._levelQueriesRepository.getCompletion(userId, levelId);

    if (completion.isCompleted) {
      return {
        isLocked: false,
        completedAt: completion.completedAt,
        unlockedAt: completion.unlockedAt,
        prerequisites: [],
        missingPrerequisites: [],
      };
    }

    const source: LevelUnlockSource | undefined = await this._levelQueriesRepository.getUnlockSource(levelId);

    if (!source) {
      throw new LevelNotFoundError();
    }

    if (source.prerequisites.length === 0) {
      return { isLocked: false, unlockedAt: source.createdAt, prerequisites: [], missingPrerequisites: [] };
    }

    const prerequisites: PrerequisiteStatus[] = [];
    const missingPrerequisites: string[] = [];

    for (const prerequisite of source.prerequisites) {
      if (!prerequisite.isActive) {
        continue;
      }

      const prerequisiteCompletion: LevelCompletionStatus = await this._levelQueriesRepository.getCompletion(userId, prerequisite.levelId);

      prerequisites.push({
        levelId: prerequisite.levelId,
        levelTitle: prerequisite.title,
        isCompleted: prerequisiteCompletion.isCompleted,
        completionPercentage: prerequisiteCompletion.completionPercentage,
        completedAt: prerequisiteCompletion.completedAt,
      });

      if (!prerequisiteCompletion.isCompleted) {
        missingPrerequisites.push(prerequisite.title);
      }
    }

    return { isLocked: missingPrerequisites.length > 0, prerequisites, missingPrerequisites };
  }
}
