/*
 * Funcionalidad: Puerto de repositorio CURRICULUM_QUERIES_REPOSITORY_TOKEN
 * Descripción: Define la interfaz ICurriculumQueriesRepository y su token de inyección para la feature de currículo
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CurriculumTreeSource, type CurriculumUnlockSource } from "@/features/curriculum/domain/read-models/curriculum-tree.read-model";
import {
  type CurriculumDbModule,
  type CurriculumModuleProgressRecord,
  type CurriculumNextModule,
} from "@/features/curriculum/domain/read-models/curriculum-views.read-model";

export const CURRICULUM_QUERIES_REPOSITORY_TOKEN: unique symbol = Symbol("CURRICULUM_QUERIES_REPOSITORY_TOKEN");

export interface ICurriculumQueriesRepository {
  getActiveModulesByIds(moduleIds: string[]): Promise<CurriculumDbModule[]>;
  getActiveModulesByDifficulty(difficulty: string): Promise<CurriculumDbModule[]>;
  getModuleProgress(userId: string, moduleIds: string[]): Promise<CurriculumModuleProgressRecord[]>;
  isModuleCompleted(userId: string, moduleId: string): Promise<boolean>;
  getModulePrerequisiteIds(moduleId: string): Promise<string[] | undefined>;
  countCompletedModules(userId: string, moduleIds: string[]): Promise<number>;
  getNextActiveModuleInSameDifficulty(moduleId: string): Promise<CurriculumNextModule | undefined>;
  getUnlockSource(userId?: string): Promise<CurriculumUnlockSource>;
  getTreeSource(canManage: boolean): Promise<CurriculumTreeSource>;
}
