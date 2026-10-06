/*
 * Funcionalidad: Caso de uso GetUserRoadmapUseCase
 * Descripción: Construye la ruta de aprendizaje del track principal con el estado de desbloqueo y el progreso del usuario por nivel; carga niveles, módulos, progreso y prerrequisitos por lotes (sin consultas por nivel) y aplica las reglas de desbloqueo del dominio curricular
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { computeUnlockState, type UnlockState } from "@/features/curriculum/domain/services/unlock-rules";
import {
  type LevelCompletionStatus,
  type LevelRoadmapNode,
  type LevelUnlockStatus,
  type PrerequisiteStatus,
  type RoadmapLevelSource,
  type RoadmapProgressSource,
} from "@/features/levels/domain/read-models/level-roadmap.read-model";
import { type ILevelQueriesRepository, LEVEL_QUERIES_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/level-queries.repository";
import { DEFAULT_LEVEL_TRACK_VALUE } from "@/features/levels/domain/value-objects/level-track";

type ModuleProgressRecord = RoadmapProgressSource["moduleProgress"][number];
type PrerequisiteRecord = RoadmapProgressSource["prerequisites"][number];

@Injectable()
export class GetUserRoadmapUseCase {
  public constructor(
    @Inject(LEVEL_QUERIES_REPOSITORY_TOKEN)
    private readonly _levelQueriesRepository: ILevelQueriesRepository,
  ) {}

  public async execute(userId: string): Promise<LevelRoadmapNode[]> {
    const levels: RoadmapLevelSource[] = await this._levelQueriesRepository.getRoadmapLevels(DEFAULT_LEVEL_TRACK_VALUE);
    const source: RoadmapProgressSource = await this._levelQueriesRepository.getRoadmapProgress(
      userId,
      levels.map((level: RoadmapLevelSource) => level.id),
    );

    const moduleIdsByLevel: Map<string, string[]> = new Map<string, string[]>();

    for (const module of source.modules) {
      moduleIdsByLevel.set(module.levelId, [...(moduleIdsByLevel.get(module.levelId) ?? []), module.id]);
    }

    const progressByModule: Map<string, ModuleProgressRecord> = new Map(
      source.moduleProgress.map((progress: ModuleProgressRecord): [string, ModuleProgressRecord] => [progress.moduleId, progress]),
    );
    const createdAtByLevel: Map<string, Date> = new Map(
      source.levelCreatedAt.map((level: { levelId: string; createdAt: Date }): [string, Date] => [level.levelId, level.createdAt]),
    );
    const completionOf = (levelId: string): LevelCompletionStatus => this._completion(moduleIdsByLevel.get(levelId) ?? [], progressByModule);

    return levels.map((level: RoadmapLevelSource): LevelRoadmapNode => {
      const completion: LevelCompletionStatus = completionOf(level.id);
      const prerequisites: PrerequisiteRecord[] = source.prerequisites.filter((prerequisite: PrerequisiteRecord) => prerequisite.levelId === level.id);

      return {
        levelId: level.id,
        levelTitle: level.title,
        levelDescription: level.description,
        order: level.order,
        isActive: level.isActive,
        unlockStatus: this._unlockStatus(completion, prerequisites, completionOf, createdAtByLevel.get(level.id)),
        moduleCount: level.moduleCount,
        completedModules: completion.completedModules,
        levelProgress: completion.completionPercentage,
      };
    });
  }

  private _unlockStatus(
    completion: LevelCompletionStatus,
    prerequisites: PrerequisiteRecord[],
    completionOf: (levelId: string) => LevelCompletionStatus,
    createdAt?: Date,
  ): LevelUnlockStatus {
    if (completion.isCompleted) {
      return { isLocked: false, completedAt: completion.completedAt, unlockedAt: completion.unlockedAt, prerequisites: [], missingPrerequisites: [] };
    }

    if (prerequisites.length === 0) {
      return { isLocked: false, unlockedAt: createdAt, prerequisites: [], missingPrerequisites: [] };
    }

    const statuses: PrerequisiteStatus[] = prerequisites.map((prerequisite: PrerequisiteRecord) => {
      const prerequisiteCompletion: LevelCompletionStatus = completionOf(prerequisite.prerequisiteLevelId);

      return {
        levelId: prerequisite.prerequisiteLevelId,
        levelTitle: prerequisite.title,
        isCompleted: prerequisiteCompletion.isCompleted,
        completionPercentage: prerequisiteCompletion.completionPercentage,
        completedAt: prerequisiteCompletion.completedAt,
      };
    });

    const state: UnlockState = computeUnlockState(
      statuses.map((status: PrerequisiteStatus) => ({ id: status.levelId, title: status.levelTitle })),
      new Set(statuses.filter((status: PrerequisiteStatus) => status.isCompleted).map((status: PrerequisiteStatus) => status.levelId)),
      false,
    );

    return {
      isLocked: state.locked,
      prerequisites: statuses,
      missingPrerequisites: state.missingPrerequisites.map((missing: { title: string }) => missing.title),
    };
  }

  private _completion(moduleIds: string[], progressByModule: ReadonlyMap<string, ModuleProgressRecord>): LevelCompletionStatus {
    if (moduleIds.length === 0) {
      return { isCompleted: false, completionPercentage: 0, completedModules: 0, totalModules: 0 };
    }

    const records: ModuleProgressRecord[] = moduleIds
      .map((moduleId: string) => progressByModule.get(moduleId))
      .filter((record: ModuleProgressRecord | undefined): record is ModuleProgressRecord => record !== undefined);
    const completedDates: Date[] = records
      .map((record: ModuleProgressRecord) => record.completedAt)
      .filter((completedAt: Date | undefined): completedAt is Date => completedAt !== undefined);
    const isCompleted: boolean = completedDates.length === moduleIds.length;

    return {
      isCompleted,
      completionPercentage: Math.floor((completedDates.length / moduleIds.length) * 100),
      completedAt: isCompleted ? new Date(Math.max(...completedDates.map((date: Date) => date.getTime()))) : undefined,
      unlockedAt: records.length > 0 ? new Date(Math.min(...records.map((record: ModuleProgressRecord) => record.startedAt.getTime()))) : undefined,
      completedModules: completedDates.length,
      totalModules: moduleIds.length,
    };
  }
}
