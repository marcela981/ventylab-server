/*
 * Funcionalidad: Caso de uso GetCurriculumOverviewUseCase
 * Descripción: Ejecuta la operación GetCurriculumOverview de la feature de currículo; depende de GetCurriculumLevelUseCase
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { GetCurriculumLevelUseCase } from "@/features/curriculum/application/use-cases/get-curriculum-level.usecase";
import { type CurriculumLevelView, type CurriculumOverview } from "@/features/curriculum/domain/read-models/curriculum-views.read-model";
import { CURRICULUM_CONFIG } from "@/features/curriculum/domain/services/curriculum-catalog";
import { BEGINNER_CURRICULUM_LEVEL, PREREQUISITOS_CURRICULUM_LEVEL } from "@/features/curriculum/domain/value-objects/curriculum-level";

@Injectable()
export class GetCurriculumOverviewUseCase {
  public constructor(private readonly _getCurriculumLevelUseCase: GetCurriculumLevelUseCase) {}

  public async execute(userId?: string): Promise<CurriculumOverview> {
    const [prerequisitos, beginner]: [CurriculumLevelView, CurriculumLevelView] = await Promise.all([
      this._getCurriculumLevelUseCase.execute(PREREQUISITOS_CURRICULUM_LEVEL, userId),
      this._getCurriculumLevelUseCase.execute(BEGINNER_CURRICULUM_LEVEL, userId),
    ]);

    return {
      levels: [
        {
          ...prerequisitos,
          isOptional: CURRICULUM_CONFIG.prerequisitos.isOptional,
          affectsUnlocking: CURRICULUM_CONFIG.prerequisitos.affectsUnlocking,
        },
        {
          ...beginner,
          isOptional: CURRICULUM_CONFIG.beginner.isOptional,
          affectsUnlocking: CURRICULUM_CONFIG.beginner.affectsUnlocking,
        },
      ],
      totalModules: beginner.totalModules + prerequisitos.totalModules,
      mainLevelModules: beginner.totalModules,
    };
  }
}
