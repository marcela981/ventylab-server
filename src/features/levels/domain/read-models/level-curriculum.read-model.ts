/*
 * Funcionalidad: Modelos de lectura de niveles
 * Descripción: Define las interfaces LevelCurriculumSourceModule, LevelCurriculumSourceLevel, LevelCurriculumSource, LevelCurriculumModule, LevelCurriculumItem que devuelven las consultas de la feature
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface LevelCurriculumSourceModule {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly difficulty?: string;
  readonly estimatedTime?: number;
  readonly order: number;
  readonly category?: string;
  readonly lessonCount: number;
}

export interface LevelCurriculumSourceLevel {
  readonly id: string;
  readonly track: string;
  readonly title: string;
  readonly description?: string;
  readonly order: number;
  readonly modules: LevelCurriculumSourceModule[];
}

export interface LevelCurriculumSource {
  readonly levels: LevelCurriculumSourceLevel[];
  readonly moduleProgress: {
    readonly moduleId: string;
    readonly completedLessons: number;
    readonly totalLessons: number;
    readonly progressPercentage: number;
    readonly isCompleted: boolean;
  }[];
  readonly prerequisites: { readonly levelId: string; readonly prerequisiteLevelId: string }[];
}

export interface LevelCurriculumModule {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly difficulty?: string;
  readonly estimatedTime?: number;
  readonly order: number;
  readonly category?: string;
  readonly progressPercentage: number;
  readonly isCompleted: boolean;
  readonly lessonCount: number;
}

export interface LevelCurriculumItem {
  readonly id: string;
  readonly dbId: string;
  readonly track: string;
  readonly title: string;
  readonly description?: string;
  readonly color: string;
  readonly emoji: string;
  readonly order: number;
  readonly modules: LevelCurriculumModule[];
  readonly totalModules: number;
  readonly completedModules: number;
  readonly progressPercentage: number;
  readonly isCompleted: boolean;
  readonly isUnlocked: boolean;
}
