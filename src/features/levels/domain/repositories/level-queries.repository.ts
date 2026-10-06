/*
 * Funcionalidad: Puerto de repositorio LEVEL_QUERIES_REPOSITORY_TOKEN
 * Descripción: Define la interfaz ILevelQueriesRepository y su token de inyección para la feature de niveles
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ListQuery } from "@/common/domain/utils/list-query";
import { type Paginated } from "@/common/domain/utils/paginated";
import { type ContentStatusChain } from "@/features/curriculum/domain/services/content-visibility";
import { type LevelCurriculumSource } from "@/features/levels/domain/read-models/level-curriculum.read-model";
import {
  type LevelCompletionStatus,
  type LevelUnlockSource,
  type RoadmapLevelSource,
  type RoadmapProgressSource,
} from "@/features/levels/domain/read-models/level-roadmap.read-model";
import {
  type LevelDetail,
  type LevelModuleItem,
  type LevelPrerequisitesView,
  type LevelSummary,
} from "@/features/levels/domain/read-models/level-views.read-model";

export const LEVEL_QUERIES_REPOSITORY_TOKEN: unique symbol = Symbol("LEVEL_QUERIES_REPOSITORY_TOKEN");

export interface GetLevelsQuery extends ListQuery {
  includeInactive?: boolean;
  canManage: boolean;
}

export interface ILevelQueriesRepository {
  getSummaries(query: GetLevelsQuery): Promise<Paginated<LevelSummary>>;
  getStatusChain(levelId: string): Promise<ContentStatusChain | undefined>;
  getDetail(levelId: string, canManage: boolean): Promise<LevelDetail | undefined>;
  getModules(levelId: string, includeInactive: boolean, canManage: boolean): Promise<LevelModuleItem[]>;
  getPrerequisitesView(levelId: string): Promise<LevelPrerequisitesView | undefined>;
  getCurriculumSource(canManage: boolean, userId?: string, track?: string): Promise<LevelCurriculumSource>;
  getActiveDependentLevelTitles(levelId: string, transaction?: unknown): Promise<string[]>;
  getCompletion(userId: string, levelId: string): Promise<LevelCompletionStatus>;
  getUnlockSource(levelId: string): Promise<LevelUnlockSource | undefined>;
  getRoadmapLevels(track: string): Promise<RoadmapLevelSource[]>;
  getRoadmapProgress(userId: string, levelIds: string[]): Promise<RoadmapProgressSource>;
}
