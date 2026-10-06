/*
 * Funcionalidad: Modelos de lectura de currículo
 * Descripción: Define las interfaces CurriculumDbModule, CurriculumModuleProgressRecord, CurriculumModuleView, CurriculumLevelView, CurriculumOverviewLevel, CurriculumOverview y otros que devuelven las consultas de la feature
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CurriculumLevelValue } from "@/features/curriculum/domain/value-objects/curriculum-level";

export interface CurriculumDbModule {
  readonly id: string;
  readonly levelId?: string;
  readonly title: string;
  readonly description?: string;
  readonly difficulty?: string;
  readonly estimatedTime?: number;
  readonly order: number;
  readonly isActive: boolean;
  readonly lessonCount: number;
}

export interface CurriculumModuleProgressRecord {
  readonly moduleId: string;
  readonly completedAt?: Date;
  readonly timeSpent: number;
}

export interface CurriculumModuleView {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly description?: string;
  readonly dbModule?: CurriculumDbModule;
  readonly progress?: { readonly completed: boolean; readonly completionPercentage: number; readonly timeSpent: number };
  readonly isLocked: boolean;
  readonly lessonCount: number;
}

export interface CurriculumLevelView {
  readonly level: CurriculumLevelValue;
  readonly levelColor: string;
  readonly modules: CurriculumModuleView[];
  readonly totalModules: number;
  readonly completedModules: number;
  readonly levelProgress: number;
}

export interface CurriculumOverviewLevel extends CurriculumLevelView {
  readonly isOptional: boolean;
  readonly affectsUnlocking: boolean;
}

export interface CurriculumOverview {
  readonly levels: CurriculumOverviewLevel[];
  readonly totalModules: number;
  readonly mainLevelModules: number;
}

export interface CurriculumNextModule {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly description?: string;
}
