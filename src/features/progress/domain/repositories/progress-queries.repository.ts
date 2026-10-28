/*
 * Funcionalidad: Repositorio de consultas de contenido para progreso
 * Descripción: Contrato de lectura de la estructura de contenido (lecciones, páginas, pasos y módulos) que necesita la feature de progreso para resolver identificadores, accesos y el resumen general. v1.2: getLessonSequence (lección visible y sus lecciones publicadas anteriores) reemplaza getLessonGate y getPreviousActiveLessonId
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LessonSequence } from "@/features/progress/domain/read-models/lesson-access.read-model";
import {
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
  // The lesson (published with published ancestors unless canManage) and the published lessons before it in its module, in order.
  getLessonSequence(lessonId: string, canManage: boolean): Promise<LessonSequence | undefined>;
  countActiveSteps(lessonId: string): Promise<number | undefined>;
  getOverviewModules(track: string): Promise<OverviewModuleSource[]>;
}
