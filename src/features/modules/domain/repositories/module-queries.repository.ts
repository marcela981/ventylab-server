/*
 * Funcionalidad: Puerto de repositorio MODULE_QUERIES_REPOSITORY_TOKEN
 * Descripción: Define la interfaz IModuleQueriesRepository y su token de inyección para la feature de módulos
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
import {
  type ModuleDetail,
  type ModuleFullContent,
  type ModuleLessonItem,
  type ModuleListItem,
} from "@/features/modules/domain/read-models/module-views.read-model";

export const MODULE_QUERIES_REPOSITORY_TOKEN: unique symbol = Symbol("MODULE_QUERIES_REPOSITORY_TOKEN");

export interface GetModulesQuery extends ListQuery {
  category?: string;
  difficulty?: string;
  canManage: boolean;
}

export interface IModuleQueriesRepository {
  getList(query: GetModulesQuery): Promise<Paginated<ModuleListItem>>;
  getStatusChain(moduleId: string): Promise<ContentStatusChain | undefined>;
  getDetail(moduleId: string): Promise<ModuleDetail | undefined>;
  countLessons(moduleId: string, canManage: boolean): Promise<number>;
  getLessons(moduleId: string, canManage: boolean): Promise<ModuleLessonItem[]>;
  getFullContent(moduleId: string, canManage: boolean): Promise<ModuleFullContent | undefined>;
}
