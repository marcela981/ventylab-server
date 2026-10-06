/*
 * Funcionalidad: Caso de uso CheckModuleUnlockedUseCase
 * Descripción: Ejecuta la operación CheckModuleUnlocked de la feature de currículo; depende de ICurriculumQueriesRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import {
  CURRICULUM_QUERIES_REPOSITORY_TOKEN,
  type ICurriculumQueriesRepository,
} from "@/features/curriculum/domain/repositories/curriculum-queries.repository";
import {
  type CurriculumModule,
  getBeginnerModuleOrder,
  getPreviousBeginnerModule,
  isBeginnerModule,
  isPrerequisitosModule,
} from "@/features/curriculum/domain/services/curriculum-catalog";

@Injectable()
export class CheckModuleUnlockedUseCase {
  public constructor(
    @Inject(CURRICULUM_QUERIES_REPOSITORY_TOKEN)
    private readonly _curriculumQueriesRepository: ICurriculumQueriesRepository,
  ) {}

  public async execute(userId: string, moduleId: string): Promise<boolean> {
    if (isPrerequisitosModule(moduleId)) {
      return true;
    }

    if (isBeginnerModule(moduleId)) {
      if (getBeginnerModuleOrder(moduleId) === 1) {
        return true;
      }

      const previousModule: CurriculumModule | undefined = getPreviousBeginnerModule(moduleId);

      return previousModule ? await this._curriculumQueriesRepository.isModuleCompleted(userId, previousModule.id) : true;
    }

    const prerequisiteIds: string[] | undefined = await this._curriculumQueriesRepository.getModulePrerequisiteIds(moduleId);

    if (!prerequisiteIds) {
      return false;
    }

    const relevantPrerequisiteIds: string[] = prerequisiteIds.filter((prerequisiteId: string) => !isPrerequisitosModule(prerequisiteId));

    if (relevantPrerequisiteIds.length === 0) {
      return true;
    }

    const completed: number = await this._curriculumQueriesRepository.countCompletedModules(userId, relevantPrerequisiteIds);

    return completed === relevantPrerequisiteIds.length;
  }
}
