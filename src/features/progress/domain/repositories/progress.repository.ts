/*
 * Funcionalidad: Repositorio de progreso
 * Descripción: Contrato de persistencia de la feature de progreso sobre las tablas UserProgress y LessonCompletion (lecturas, upserts y recálculo de contadores por módulo)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type LessonCompletionSnapshot,
  type LessonCompletionWrite,
  type ModuleAccessWrite,
  type ModuleCounters,
  type ModuleCountersRefresh,
  type ModuleProgressSnapshot,
} from "@/features/progress/domain/read-models/progress-records.read-model";

export const PROGRESS_REPOSITORY_TOKEN: unique symbol = Symbol("PROGRESS_REPOSITORY_TOKEN");

export interface IProgressRepository {
  getModuleProgress(userId: string, moduleId: string, transaction?: unknown): Promise<ModuleProgressSnapshot | undefined>;
  getModuleProgresses(userId: string, moduleIds?: string[]): Promise<ModuleProgressSnapshot[]>;
  ensureModuleProgress(userId: string, moduleId: string): Promise<ModuleProgressSnapshot>;
  getLessonCompletion(userId: string, lessonId: string, transaction?: unknown): Promise<LessonCompletionSnapshot | undefined>;
  getLessonCompletions(userId: string, lessonIds?: string[]): Promise<LessonCompletionSnapshot[]>;
  saveLessonCompletion(write: LessonCompletionWrite, transaction?: unknown): Promise<LessonCompletionSnapshot>;
  touchModuleAccess(write: ModuleAccessWrite, transaction?: unknown): Promise<void>;
  refreshModuleCounters(refresh: ModuleCountersRefresh, transaction?: unknown): Promise<ModuleCounters | undefined>;
}
