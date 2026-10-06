/*
 * Funcionalidad: Caso de uso GetUnlockedModulesUseCase
 * Descripción: Devuelve los ids de los módulos publicados que un usuario tiene desbloqueados según ComputeCurriculumUnlockUseCase (bloqueo por nivel y por prerrequisitos de módulo con la regla de completitud por páginas)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { ComputeCurriculumUnlockUseCase } from "@/features/curriculum/application/use-cases/compute-curriculum-unlock.usecase";
import { type CurriculumUnlockState } from "@/features/curriculum/domain/read-models/curriculum-tree.read-model";
import { type UnlockState } from "@/features/curriculum/domain/services/unlock-rules";
import { type UnlockedModules } from "@/features/progress/domain/read-models/progress-views.read-model";

@Injectable()
export class GetUnlockedModulesUseCase {
  public constructor(private readonly _computeCurriculumUnlockUseCase: ComputeCurriculumUnlockUseCase) {}

  public async execute(userId: string): Promise<UnlockedModules> {
    const state: CurriculumUnlockState = await this._computeCurriculumUnlockUseCase.execute(userId);

    const unlockedModuleIds: string[] = Array.from(state.modules.entries())
      .filter(([, moduleState]: [string, UnlockState]) => !moduleState.locked)
      .map(([moduleId]: [string, UnlockState]) => moduleId);

    return { unlockedModuleIds, count: unlockedModuleIds.length };
  }
}
