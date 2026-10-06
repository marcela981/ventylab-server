/*
 * Funcionalidad: Caso de uso GetNextModuleUseCase
 * Descripción: Ejecuta la operación GetNextModule de la feature de currículo; depende de ICurriculumQueriesRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type CurriculumNextModule } from "@/features/curriculum/domain/read-models/curriculum-views.read-model";
import {
  CURRICULUM_QUERIES_REPOSITORY_TOKEN,
  type ICurriculumQueriesRepository,
} from "@/features/curriculum/domain/repositories/curriculum-queries.repository";
import { getNextBeginnerModule, isBeginnerModule, isPrerequisitosModule } from "@/features/curriculum/domain/services/curriculum-catalog";

@Injectable()
export class GetNextModuleUseCase {
  public constructor(
    @Inject(CURRICULUM_QUERIES_REPOSITORY_TOKEN)
    private readonly _curriculumQueriesRepository: ICurriculumQueriesRepository,
  ) {}

  public async execute(moduleId: string): Promise<CurriculumNextModule | undefined> {
    if (isPrerequisitosModule(moduleId)) {
      return undefined;
    }

    if (isBeginnerModule(moduleId)) {
      return getNextBeginnerModule(moduleId);
    }

    return await this._curriculumQueriesRepository.getNextActiveModuleInSameDifficulty(moduleId);
  }
}
