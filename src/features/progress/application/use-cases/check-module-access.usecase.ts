/*
 * Funcionalidad: Caso de uso CheckModuleAccessUseCase
 * Descripción: Indica si un usuario puede abrir un módulo publicado: delega en ComputeCurriculumUnlockUseCase, que aplica los prerrequisitos de nivel y de módulo con la regla de completitud por páginas
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

@Injectable()
export class CheckModuleAccessUseCase {
  public constructor(private readonly _computeCurriculumUnlockUseCase: ComputeCurriculumUnlockUseCase) {}

  public async execute(userId: string, moduleId: string): Promise<boolean> {
    const state: CurriculumUnlockState = await this._computeCurriculumUnlockUseCase.execute(userId);
    const moduleState: UnlockState | undefined = state.modules.get(moduleId);

    return moduleState !== undefined && !moduleState.locked;
  }
}
