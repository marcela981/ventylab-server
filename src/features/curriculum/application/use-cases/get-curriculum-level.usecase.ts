/*
 * Funcionalidad: Caso de uso GetCurriculumLevelUseCase
 * Descripción: Ejecuta la operación GetCurriculumLevel de la feature de currículo; depende de ICurriculumQueriesRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import {
  type CurriculumDbModule,
  type CurriculumLevelView,
  type CurriculumModuleProgressRecord,
  type CurriculumModuleView,
} from "@/features/curriculum/domain/read-models/curriculum-views.read-model";
import {
  CURRICULUM_QUERIES_REPOSITORY_TOKEN,
  type ICurriculumQueriesRepository,
} from "@/features/curriculum/domain/repositories/curriculum-queries.repository";
import { BEGINNER_MODULES, type CurriculumModule, PREREQUISITOS_MODULES } from "@/features/curriculum/domain/services/curriculum-catalog";
import {
  BEGINNER_CURRICULUM_LEVEL,
  type CurriculumLevelValue,
  PREREQUISITOS_CURRICULUM_LEVEL,
} from "@/features/curriculum/domain/value-objects/curriculum-level";
import { getColorForDifficulty } from "@/features/levels/domain/services/difficulty-colors";

@Injectable()
export class GetCurriculumLevelUseCase {
  public constructor(
    @Inject(CURRICULUM_QUERIES_REPOSITORY_TOKEN)
    private readonly _curriculumQueriesRepository: ICurriculumQueriesRepository,
  ) {}

  public async execute(level: CurriculumLevelValue, userId?: string): Promise<CurriculumLevelView> {
    if (level === BEGINNER_CURRICULUM_LEVEL || level === PREREQUISITOS_CURRICULUM_LEVEL) {
      return await this._buildStaticLevel(level, userId);
    }

    return await this._buildDatabaseLevel(level, userId);
  }

  private async _buildStaticLevel(level: CurriculumLevelValue, userId?: string): Promise<CurriculumLevelView> {
    const catalogModules: readonly CurriculumModule[] = level === BEGINNER_CURRICULUM_LEVEL ? BEGINNER_MODULES : PREREQUISITOS_MODULES;
    const isSequential: boolean = level === BEGINNER_CURRICULUM_LEVEL;
    const moduleIds: string[] = catalogModules.map((module: CurriculumModule) => module.id);

    const [dbModules, progressRecords] = await Promise.all([
      this._curriculumQueriesRepository.getActiveModulesByIds(moduleIds),
      userId ? this._curriculumQueriesRepository.getModuleProgress(userId, moduleIds) : Promise.resolve([]),
    ]);

    const dbModuleById: Map<string, CurriculumDbModule> = new Map(
      dbModules.map((module: CurriculumDbModule): [string, CurriculumDbModule] => [module.id, module]),
    );
    const progressById: Map<string, CurriculumModuleProgressRecord> = this._indexProgress(progressRecords);

    const modules: CurriculumModuleView[] = catalogModules.map((catalogModule: CurriculumModule, index: number) => {
      const dbModule: CurriculumDbModule | undefined = dbModuleById.get(catalogModule.id);
      const previousModule: CurriculumModule | undefined = catalogModules[index - 1];

      return {
        id: catalogModule.id,
        order: catalogModule.order,
        title: catalogModule.title,
        description: catalogModule.description,
        dbModule,
        progress: this._toProgress(progressById.get(catalogModule.id)),
        isLocked: isSequential && userId !== undefined && previousModule !== undefined && !progressById.get(previousModule.id)?.completedAt,
        lessonCount: dbModule?.lessonCount ?? 0,
      };
    });

    return this._toLevelView(level, modules);
  }

  private async _buildDatabaseLevel(level: CurriculumLevelValue, userId?: string): Promise<CurriculumLevelView> {
    const dbModules: CurriculumDbModule[] = await this._curriculumQueriesRepository.getActiveModulesByDifficulty(level);

    const progressRecords: CurriculumModuleProgressRecord[] = userId
      ? await this._curriculumQueriesRepository.getModuleProgress(
        userId,
        dbModules.map((module: CurriculumDbModule) => module.id),
      )
      : [];

    const progressById: Map<string, CurriculumModuleProgressRecord> = this._indexProgress(progressRecords);

    const modules: CurriculumModuleView[] = dbModules.map((dbModule: CurriculumDbModule, index: number) => {
      const previousModule: CurriculumDbModule | undefined = dbModules[index - 1];

      return {
        id: dbModule.id,
        order: dbModule.order,
        title: dbModule.title,
        description: dbModule.description,
        dbModule,
        progress: this._toProgress(progressById.get(dbModule.id)),
        isLocked: userId !== undefined && previousModule !== undefined && !progressById.get(previousModule.id)?.completedAt,
        lessonCount: dbModule.lessonCount,
      };
    });

    return this._toLevelView(level, modules);
  }

  private _indexProgress(records: CurriculumModuleProgressRecord[]): Map<string, CurriculumModuleProgressRecord> {
    return new Map(records.map((record: CurriculumModuleProgressRecord): [string, CurriculumModuleProgressRecord] => [record.moduleId, record]));
  }

  private _toProgress(record?: CurriculumModuleProgressRecord): CurriculumModuleView["progress"] {
    if (!record) {
      return undefined;
    }

    const completed: boolean = record.completedAt !== undefined;

    return { completed, completionPercentage: completed ? 100 : 0, timeSpent: record.timeSpent };
  }

  private _toLevelView(level: CurriculumLevelValue, modules: CurriculumModuleView[]): CurriculumLevelView {
    const completedModules: number = modules.filter((module: CurriculumModuleView) => module.progress?.completed === true).length;

    return {
      level,
      levelColor: getColorForDifficulty(level),
      modules,
      totalModules: modules.length,
      completedModules,
      levelProgress: modules.length > 0 ? Math.round((completedModules / modules.length) * 100) : 0,
    };
  }
}
