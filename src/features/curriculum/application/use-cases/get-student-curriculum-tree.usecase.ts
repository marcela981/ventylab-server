/*
 * Funcionalidad: Caso de uso GetStudentCurriculumTreeUseCase
 * Descripción: Construye el árbol Sección, Nivel, Módulo visible para el lector y le agrega locked, completed y missingPrerequisites por nivel y módulo usando ComputeCurriculumUnlockUseCase; todas las lecturas son por lotes
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { ComputeCurriculumUnlockUseCase } from "@/features/curriculum/application/use-cases/compute-curriculum-unlock.usecase";
import {
  type CurriculumTreeSource,
  type CurriculumTreeSourceLevel,
  type CurriculumTreeSourceModule,
  type CurriculumTreeSourceSection,
  type CurriculumUnlockState,
  type StudentCurriculumTree,
  type StudentTreeLevel,
  type StudentTreeModule,
} from "@/features/curriculum/domain/read-models/curriculum-tree.read-model";
import {
  CURRICULUM_QUERIES_REPOSITORY_TOKEN,
  type ICurriculumQueriesRepository,
} from "@/features/curriculum/domain/repositories/curriculum-queries.repository";
import { UNLOCKED_STATE, type UnlockState } from "@/features/curriculum/domain/services/unlock-rules";

@Injectable()
export class GetStudentCurriculumTreeUseCase {
  public constructor(
    @Inject(CURRICULUM_QUERIES_REPOSITORY_TOKEN)
    private readonly _curriculumQueriesRepository: ICurriculumQueriesRepository,
    private readonly _computeCurriculumUnlockUseCase: ComputeCurriculumUnlockUseCase,
  ) {}

  public async execute(userId: string | undefined, canManage: boolean): Promise<StudentCurriculumTree> {
    const [source, unlock]: [CurriculumTreeSource, CurriculumUnlockState] = await Promise.all([
      this._curriculumQueriesRepository.getTreeSource(canManage),
      this._computeCurriculumUnlockUseCase.execute(userId),
    ]);

    const levels: StudentTreeLevel[] = source.levels.map((level: CurriculumTreeSourceLevel) => this._toLevel(level, unlock));
    const sectionIds: Set<string> = new Set(source.sections.map((section: CurriculumTreeSourceSection) => section.id));

    return {
      sections: source.sections.map((section: CurriculumTreeSourceSection) => ({
        ...section,
        levels: levels.filter((level: StudentTreeLevel) => level.sectionId === section.id),
      })),
      unsectionedLevels: levels.filter((level: StudentTreeLevel) => level.sectionId === undefined || !sectionIds.has(level.sectionId)),
    };
  }

  private _toLevel(level: CurriculumTreeSourceLevel, unlock: CurriculumUnlockState): StudentTreeLevel {
    const state: UnlockState = unlock.levels.get(level.id) ?? UNLOCKED_STATE;

    return {
      ...level,
      locked: state.locked,
      completed: unlock.completedLevelIds.has(level.id),
      missingPrerequisites: state.missingPrerequisites,
      modules: level.modules.map((module: CurriculumTreeSourceModule): StudentTreeModule => {
        const moduleState: UnlockState = unlock.modules.get(module.id) ?? UNLOCKED_STATE;

        return {
          ...module,
          locked: moduleState.locked,
          completed: unlock.completedModuleIds.has(module.id),
          missingPrerequisites: moduleState.missingPrerequisites,
        };
      }),
    };
  }
}
