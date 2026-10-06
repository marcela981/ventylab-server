/*
 * Funcionalidad: Modelos de lectura del progreso por páginas
 * Descripción: Define el alcance (módulo, nivel, sección o todo), la estructura publicada, el progreso ponderado por lecciones de lecciones, módulos, niveles y secciones, el resumen del usuario y los datos de registro de vistas de página
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LessonCompletionFact, type LessonWeightedProgress } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";

export type ProgressScopeType = "module" | "level" | "section" | "all";

export interface ProgressScope {
  readonly type: ProgressScopeType;
  readonly id?: string;
}

export interface ProgressStructureModule {
  readonly id: string;
  readonly levelId?: string;
}

export interface ProgressStructureLevel {
  readonly id: string;
  readonly sectionId?: string;
  readonly moduleIds: string[];
}

export interface ProgressStructureSection {
  readonly id: string;
  readonly levelIds: string[];
}

export interface ProgressStructure {
  readonly sections: ProgressStructureSection[];
  readonly levels: ProgressStructureLevel[];
  readonly modules: ProgressStructureModule[];
}

export interface ProgressSource {
  readonly structure: ProgressStructure;
  readonly facts: LessonCompletionFact[];
}

export interface LessonLearningProgress {
  readonly lessonId: string;
  readonly moduleId: string;
  readonly viewedPages: number;
  readonly totalPages: number;
  readonly completedByPages: boolean;
  readonly completed: boolean;
}

export interface ModuleLearningProgress extends LessonWeightedProgress {
  readonly moduleId: string;
  readonly levelId?: string;
  readonly lessons: LessonLearningProgress[];
}

export interface LevelLearningProgress extends LessonWeightedProgress {
  readonly levelId: string;
  readonly sectionId?: string;
  readonly completedModules: number;
  readonly totalModules: number;
  readonly modules: ModuleLearningProgress[];
}

export interface SectionLearningProgress extends LessonWeightedProgress {
  readonly sectionId: string;
  readonly completedLevels: number;
  readonly totalLevels: number;
  readonly levels: LevelLearningProgress[];
}

export interface LearningProgressReport {
  readonly overall: LessonWeightedProgress;
  readonly modules: ModuleLearningProgress[];
  readonly levels: LevelLearningProgress[];
  readonly sections: SectionLearningProgress[];
}

export interface PageViewTarget {
  readonly pageId: string;
  readonly moduleId: string;
  readonly lessonId?: string;
}

export interface PageViewSnapshot {
  readonly pageId: string;
  readonly completed: boolean;
  readonly firstViewedAt?: Date;
  readonly lastVisitedAt?: Date;
}

export interface PageViewWrite {
  readonly lastVisitedAt: Date;
  readonly completedAt?: Date;
}

export interface PageViewResult {
  readonly pageId: string;
  readonly lessonId?: string;
  readonly firstViewedAt: Date;
  readonly lastVisitedAt: Date;
  readonly lessonCompleted: boolean;
  readonly lessonJustCompleted: boolean;
  readonly viewedPages: number;
  readonly totalPages: number;
}

export type ContentUnlockTargetType = "level" | "module";

export interface ContentUnlockTarget {
  readonly type: ContentUnlockTargetType;
  readonly id: string;
}
