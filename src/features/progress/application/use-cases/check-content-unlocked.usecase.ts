/*
 * Funcionalidad: Caso de uso CheckContentUnlockedUseCase
 * Descripción: Indica si un nivel o un módulo publicado está desbloqueado para un usuario, reutilizando ComputeCurriculumUnlockUseCase (prerrequisitos completados según la regla de completitud por páginas); un nodo no publicado o inexistente se considera bloqueado
 * Versión: 1.0
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
import { type ContentUnlockTarget } from "@/features/progress/domain/read-models/learning-progress.read-model";

@Injectable()
export class CheckContentUnlockedUseCase {
  public constructor(private readonly _computeCurriculumUnlockUseCase: ComputeCurriculumUnlockUseCase) {}

  public async execute(userId: string, target: ContentUnlockTarget): Promise<boolean> {
    const state: CurriculumUnlockState = await this._computeCurriculumUnlockUseCase.execute(userId);
    const nodeState: UnlockState | undefined = target.type === "level" ? state.levels.get(target.id) : state.modules.get(target.id);

    return nodeState !== undefined && !nodeState.locked;
  }
}
