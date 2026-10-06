/*
 * Funcionalidad: Modelos de lectura de niveles
 * Descripción: Define las interfaces LevelCompletionStatus, PrerequisiteStatus, LevelUnlockStatus, LevelUnlockSource, RoadmapLevelSource, LevelRoadmapNode que devuelven las consultas de la feature
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface LevelCompletionStatus {
  readonly isCompleted: boolean;
  readonly completionPercentage: number;
  readonly completedAt?: Date;
  readonly unlockedAt?: Date;
  readonly completedModules: number;
  readonly totalModules: number;
}

export interface PrerequisiteStatus {
  readonly levelId: string;
  readonly levelTitle: string;
  readonly isCompleted: boolean;
  readonly completionPercentage: number;
  readonly completedAt?: Date;
}

export interface LevelUnlockStatus {
  readonly isLocked: boolean;
  readonly unlockedAt?: Date;
  readonly completedAt?: Date;
  readonly prerequisites: PrerequisiteStatus[];
  readonly missingPrerequisites: string[];
}

export interface LevelUnlockSource {
  readonly createdAt: Date;
  readonly prerequisites: { readonly levelId: string; readonly title: string; readonly isActive: boolean }[];
}

export interface RoadmapLevelSource {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly moduleCount: number;
}

export interface RoadmapProgressSource {
  readonly modules: { readonly id: string; readonly levelId: string }[];
  readonly moduleProgress: { readonly moduleId: string; readonly completedAt?: Date; readonly startedAt: Date }[];
  readonly prerequisites: { readonly levelId: string; readonly prerequisiteLevelId: string; readonly title: string; readonly createdAt: Date }[];
  readonly levelCreatedAt: { readonly levelId: string; readonly createdAt: Date }[];
}

export interface LevelRoadmapNode {
  readonly levelId: string;
  readonly levelTitle: string;
  readonly levelDescription?: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly unlockStatus: LevelUnlockStatus;
  readonly moduleCount: number;
  readonly completedModules: number;
  readonly levelProgress: number;
}
