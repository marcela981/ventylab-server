/*
 * Funcionalidad: Caso de uso ComputeCurriculumUnlockUseCase
 * Descripción: Calcula en memoria el estado de desbloqueo de todos los niveles y módulos publicados para un usuario a partir de una carga por lotes (aristas de prerrequisitos y módulos completados), sin consultas por nodo; es la API pública que la feature de progreso puede reutilizar o reemplazar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type CurriculumUnlockSource, type CurriculumUnlockState } from "@/features/curriculum/domain/read-models/curriculum-tree.read-model";
import {
  CURRICULUM_QUERIES_REPOSITORY_TOKEN,
  type ICurriculumQueriesRepository,
} from "@/features/curriculum/domain/repositories/curriculum-queries.repository";
import { type PrerequisiteEdge } from "@/features/curriculum/domain/services/prerequisite-graph";
import {
  combineUnlockStates,
  computeUnlockState,
  isGroupCompleted,
  type NamedReference,
  UNLOCKED_STATE,
  type UnlockState,
} from "@/features/curriculum/domain/services/unlock-rules";

@Injectable()
export class ComputeCurriculumUnlockUseCase {
  public constructor(
    @Inject(CURRICULUM_QUERIES_REPOSITORY_TOKEN)
    private readonly _curriculumQueriesRepository: ICurriculumQueriesRepository,
  ) {}

  public async execute(userId?: string): Promise<CurriculumUnlockState> {
    const source: CurriculumUnlockSource = await this._curriculumQueriesRepository.getUnlockSource(userId);

    return ComputeCurriculumUnlockUseCase.compute(source);
  }

  public static compute(source: CurriculumUnlockSource): CurriculumUnlockState {
    const completedModuleIds: Set<string> = new Set(source.completedModuleIds);
    const levelTitles: Map<string, string> = new Map(source.levels.map((level: { id: string; title: string }): [string, string] => [level.id, level.title]));
    const moduleTitles: Map<string, string> = new Map(source.modules.map((module: { id: string; title: string }): [string, string] => [module.id, module.title]));

    const completedLevelIds: Set<string> = new Set(
      source.levels
        .filter((level: { moduleIds: string[] }) => isGroupCompleted(level.moduleIds, completedModuleIds))
        .map((level: { id: string }) => level.id),
    );

    const levelStates: Map<string, UnlockState> = new Map<string, UnlockState>();

    for (const level of source.levels) {
      const prerequisites: NamedReference[] = ComputeCurriculumUnlockUseCase._prerequisitesOf(level.id, source.levelEdges, levelTitles);

      levelStates.set(level.id, computeUnlockState(prerequisites, completedLevelIds, completedLevelIds.has(level.id)));
    }

    const moduleStates: Map<string, UnlockState> = new Map<string, UnlockState>();

    for (const module of source.modules) {
      const prerequisites: NamedReference[] = ComputeCurriculumUnlockUseCase._prerequisitesOf(module.id, source.moduleEdges, moduleTitles);
      const isCompleted: boolean = completedModuleIds.has(module.id);
      const levelState: UnlockState = module.levelId && !isCompleted ? (levelStates.get(module.levelId) ?? UNLOCKED_STATE) : UNLOCKED_STATE;

      moduleStates.set(module.id, combineUnlockStates(levelState, computeUnlockState(prerequisites, completedModuleIds, isCompleted)));
    }

    return { levels: levelStates, modules: moduleStates, completedLevelIds, completedModuleIds };
  }

  private static _prerequisitesOf(nodeId: string, edges: ReadonlyArray<PrerequisiteEdge>, titles: ReadonlyMap<string, string>): NamedReference[] {
    return edges
      .filter((edge: PrerequisiteEdge) => edge.nodeId === nodeId && titles.has(edge.prerequisiteId))
      .map((edge: PrerequisiteEdge) => ({ id: edge.prerequisiteId, title: titles.get(edge.prerequisiteId) ?? edge.prerequisiteId }));
  }
}
