/*
 * Funcionalidad: Repositorio de consultas de contenido para progreso
 * Descripción: Contrato de lectura de la estructura de contenido (lecciones, páginas, pasos y módulos) que necesita la feature de progreso para resolver identificadores, accesos y el resumen general
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type LessonGate,
  type LessonReference,
  type ModuleLessonSource,
  type OverviewModuleSource,
} from "@/features/progress/domain/read-models/progress-records.read-model";

export const PROGRESS_QUERIES_REPOSITORY_TOKEN: unique symbol = Symbol("PROGRESS_QUERIES_REPOSITORY_TOKEN");

export interface IProgressQueriesRepository {
  resolveLessonReference(lessonReference: string, moduleIdHint?: string): Promise<LessonReference | undefined>;
  isActiveModule(moduleId: string): Promise<boolean>;
  moduleExists(moduleId: string): Promise<boolean>;
  getActiveLessonIds(moduleId: string, transaction?: unknown): Promise<string[]>;
  getActiveLessonsByModules(moduleIds: string[]): Promise<ModuleLessonSource[]>;
  getLessonGate(lessonId: string): Promise<LessonGate | undefined>;
  getPreviousActiveLessonId(moduleId: string, order: number): Promise<string | undefined>;
  countActiveSteps(lessonId: string): Promise<number | undefined>;
  getOverviewModules(track: string): Promise<OverviewModuleSource[]>;
}
